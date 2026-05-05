import Logger from '../helper/logger.js';
import got from 'got';
import { join } from 'path';
import { access, readFile, writeFile } from 'fs/promises';

const tado_url = "https://my.tado.com";
const tado_auth_url = "https://login.tado.com/oauth2";
const tado_client_id = "1bb50063-6b0c-4d11-bd99-387f4a91cc46";

function _getSimpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export default class Tado {
  constructor(name, auth, storagePath, counterActivated) {
    this.tadoApiUrl = auth.tadoApiUrl || tado_url;
    this.customTadoApiUrlActive = !!auth.tadoApiUrl;
    this.skipAuth = auth.skipAuth?.toString() === "true";
    this.storagePath = storagePath;
    this.name = name;
    const usesExternalTokenFile = auth.username?.toLowerCase().endsWith(".json");
    this._tadoExternalTokenFilePath = usesExternalTokenFile ? auth.username : undefined;
    this.hashedUsername = _getSimpleHash(auth.username);
    this.username = usesExternalTokenFile ? undefined : auth.username;
    this._tadoInternalTokenFilePath = usesExternalTokenFile ? undefined : join(this.storagePath, `.tado-token-${this.hashedUsername}.json`);
    this._tadoApiClientId = tado_client_id;
    this._tadoTokenPromise = undefined;
    this._tadoAuthenticationCallback = undefined;
    this._counterActivated = counterActivated?.toString() === "true";
    this._counterInitPromise = this._initCounter();
    Logger.debug("API successfull initialized", this.name);
  }

  async _initCounter() {
    if (!this._counterActivated) return;
    const persistedCounterData = (await this._getPersistedCounter())?.counterData;
    this._counter = persistedCounterData?.counter ?? 0;
    this._counterTimestamp = persistedCounterData?.counterTimestamp ?? new Date().toISOString();
    this._checkCounterMidnightReset();
    //wait some seconds to catch recent API calls
    setTimeout(() => {
      void this._logCounter();
      setInterval(() => void this._logCounter(), 60 * 60 * 1000);
      void this._persistCounterData();
      setInterval(() => void this._persistCounterData(), 5 * 60 * 1000);
    }, 4 * 1000);
  }

  async _getPersistedCounter() {
    try {
      const filePath = join(this.storagePath, `tado-api-${this.hashedUsername}.json`);
      await access(filePath);
      const data = (await readFile(filePath, "utf-8"));
      if (data) return JSON.parse(data);
    } catch (error) {
      //no persisted counter data => ignore
      Logger.debug(`Failed to read tado API file for user ${this.hashedUsername}: ${error.message || JSON.stringify(error)}`);
    }
  }

  _checkCounterMidnightReset() {
    const timezone = "Europe/Berlin";
    const now = new Date();
    const last = new Date(this._counterTimestamp || 0);
    const formatDate = (date) => date.toLocaleDateString("en-US", { timeZone: timezone });
    if (formatDate(now) !== formatDate(last)) {
      this._counter = 0;
      this._counterTimestamp = new Date().toISOString();
    }
  }

  async _increaseCounter() {
    if (!this._counterActivated) return;
    try {
      await this._counterInitPromise;
      this._checkCounterMidnightReset();
      this._counter++;
      this._counterTimestamp = new Date().toISOString();
    } catch (error) {
      Logger.warn(`Failed to increase tado API counter: ${error.message || JSON.stringify(error)}`);
    }
  }

  async _getCounterData() {
    await this._counterInitPromise;
    return {
      counter: this._counter,
      counterTimestamp: this._counterTimestamp
    };
  }

  async _persistCounterData() {
    try {
      const data = {};
      data.counterData = await this._getCounterData();
      await writeFile(join(this.storagePath, `tado-api-${this.hashedUsername}.json`), JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      Logger.error(`Error while updating the tado API file for user ${this.hashedUsername}: ${error.message || JSON.stringify(error)}`);
    }
  }

  async _logCounter() {
    try {
      const counter = (await this._getCounterData()).counter;
      Logger.info(`tado API counter: ${counter.toLocaleString('en-US')}`);
    } catch (error) {
      Logger.warn(`Failed to get tado API counter: ${error.message || JSON.stringify(error)}`);
    }
  }

  async getToken() {
    Logger.debug('Get access token...', this.name);
    if (!this._tadoTokenPromise) {
      this._tadoTokenPromise = this._getToken().finally(() => {
        this._tadoTokenPromise = undefined;
      });
    }
    return this._tadoTokenPromise;
  }

  async _getToken() {
    try {
      if (!this._tadoBearerToken) this._tadoBearerToken = { access_token: undefined, refresh_token: undefined, timestamp: 0 };
      if ((Date.now() - this._tadoBearerToken.timestamp) < 9 * 60 * 1000) return this._tadoBearerToken.access_token;

      if (this._tadoExternalTokenFilePath) await this._retrieveTokenFromExternalFile();
      else await this._retrieveToken();

      if (!this._tadoBearerToken.access_token) throw new Error("An unknown error occurred.");

      return this._tadoBearerToken.access_token;
    } catch (error) {
      throw new Error(`API call failed. Could not get access token: ${error.message || JSON.stringify(error)}`);
    }
  }

  async _retrieveToken() {
    try {
      if (this._tadoBearerToken.refresh_token) return this._refreshToken(this._tadoBearerToken.refresh_token);
      await access(this._tadoInternalTokenFilePath);
      const refresh_token = await this._retrieveRefreshTokenFromInternalFile();
      return this._refreshToken(refresh_token);

    } catch (_err) {
      return this._authenticateUser();
    }
  }

  async _retrieveRefreshTokenFromInternalFile() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await readFile(this._tadoInternalTokenFilePath, "utf8");
        const json = JSON.parse(data);
        if (json.refresh_token) return json.refresh_token;
      } catch (error) {
        Logger.warn(`Failed to load from internal file (attempt ${attempt} of ${maxRetries}):`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error(`Failed to load from internal file after ${maxRetries} attempts.`);
  }

  async _refreshToken(old_refresh_token) {
    let access_token, refresh_token;
    try {
      const response = await got.post(`${tado_auth_url}/token`, {
        form: {
          client_id: this._tadoApiClientId,
          grant_type: "refresh_token",
          refresh_token: old_refresh_token
        },
        responseType: "json"
      });
      await this._increaseCounter();
      ({ access_token, refresh_token } = response.body);
      if (!access_token || !refresh_token) throw new Error("Empty access/refresh token.");
      this._tadoBearerToken = { access_token, refresh_token, timestamp: Date.now() };
    } catch (error) {
      Logger.warn(`Error while refreshing token: ${error.message || JSON.stringify(error)}`);
      this._tadoBearerToken = { access_token: undefined, refresh_token: undefined, timestamp: 0 };
      return this._authenticateUser();
    }
    await writeFile(this._tadoInternalTokenFilePath, JSON.stringify({ access_token, refresh_token }));
  }

  async _authenticateUser() {
    Logger.info('Requesting device authorization...');
    const authResponse = await got.post(`${tado_auth_url}/device_authorize`, {
      form: {
        client_id: this._tadoApiClientId,
        scope: "offline_access"
      },
      responseType: "json"
    });
    await this._increaseCounter();
    const { device_code, verification_uri_complete } = authResponse.body;
    if (!device_code) throw new Error("Failed to retrieve device code.");
    Logger.info(
      `Open the following URL and sign in as "${this.username}" to authorize the plugin (tip: if your browser is signed in to tado.com with a different account, use a private/incognito window). ` +
      `URL: ${verification_uri_complete}`
    );
    if (this._tadoAuthenticationCallback) this._tadoAuthenticationCallback(verification_uri_complete);
    const maxRetries = 30;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let tokenResponse;
      try {
        tokenResponse = await got.post(`${tado_auth_url}/token`, {
          form: {
            client_id: this._tadoApiClientId,
            device_code: device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code"
          },
          responseType: "json"
        });
        await this._increaseCounter();
      } catch (_error) {
        //authentication still pending -> response code 400
      }
      if (tokenResponse?.body) {
        const { access_token, refresh_token } = tokenResponse.body;
        if (access_token && refresh_token) {
          this._tadoBearerToken = { access_token, refresh_token, timestamp: Date.now() };
          try {
            await this._verifyAuthenticatedIdentity();
          } catch (error) {
            // Clear the cached token before propagating, otherwise the 9-min
            // cache in _getToken would happily hand the wrong-account token
            // back to subsequent callers.
            this._tadoBearerToken = { access_token: undefined, refresh_token: undefined, timestamp: 0 };
            throw error;
          }
          await writeFile(this._tadoInternalTokenFilePath, JSON.stringify({ access_token, refresh_token }));
          Logger.info("Authentication successful!");
          return;
        }
      }
      Logger.info("Waiting for confirmation...");
    }
    throw new Error(`Failed to authenticate after ${maxRetries} attempts.`);
  }

  // Tado's device-code "Submit" page silently confirms whichever account is
  // already signed in to tado.com, so a user trying to authenticate account B
  // can end up granting tokens for account A without noticing. Verify the
  // identity that actually came back matches the one we asked for, and abort
  // if it doesn't — better a loud failure than a silent account mix-up that
  // poisons a token file. Uses got directly because apiCall → getToken would
  // re-enter the in-flight token promise and deadlock.
  async _verifyAuthenticatedIdentity() {
    if (!this.username) return;
    const access_token = this._tadoBearerToken?.access_token;
    if (!access_token) throw new Error('No access token available for identity verification.');
    const url = `${this.tadoApiUrl}/api/v2/me`;
    let me;
    try {
      const response = await got(url, {
        method: 'GET',
        responseType: 'json',
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: { request: 15000 }
      });
      await this._increaseCounter();
      me = response.body;
    } catch (error) {
      throw new Error(`Could not verify identity after authentication: ${error.message || JSON.stringify(error)}`);
    }
    const actual = (me?.email || me?.username || '').toLowerCase();
    const expected = this.username.toLowerCase();
    if (actual && actual !== expected) {
      throw new Error(
        `Authenticated identity "${actual}" does not match the configured username "${this.username}". ` +
        `This usually means tado.com was logged in as a different account when you clicked "Submit". ` +
        `Sign out of tado.com (or use a private/incognito window) and try again.`
      );
    }
  }

  async _retrieveTokenFromExternalFile() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await readFile(this._tadoExternalTokenFilePath, 'utf8');
        const json = JSON.parse(data);
        if (json.access_token) {
          this._tadoBearerToken = { access_token: json.access_token, refresh_token: undefined, timestamp: Date.now() };
          return;
        }
      } catch (error) {
        Logger.warn(`Failed to load from external file (attempt ${attempt} of ${maxRetries}):`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    throw new Error(`Failed to load from external file after ${maxRetries} attempts.`);
  }

  async apiCall(path, method = 'GET', data = {}, params = {}, tado_url_dif) {
    const access_token = this.skipAuth ? undefined : await this.getToken();
    const url = `${tado_url_dif || this.tadoApiUrl}${path}`;

    const options = {
      method,
      responseType: 'json',
      headers: access_token ?
        { Authorization: `Bearer ${access_token}` } :
        undefined,
      timeout: {
        request: 15000
      },
      retry: {
        limit: 2,
        statusCodes: [408, 429, 503, 504],
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
      },
    };

    //only add data to options for non-GET methods and when data has content
    if (data && typeof data === 'object' && Object.keys(data).length > 0 && method !== 'GET') {
      options.json = data;
    }

    if (Object.keys(params).length) options.searchParams = params;

    Logger.debug('API request start', {
      name: this.name,
      method,
      url,
      params: Object.keys(params).length ? params : undefined,
      data: Object.keys(data).length ? data : undefined,
    });

    try {
      const response = await got(url, options);
      await this._increaseCounter();
      Logger.debug('API request success', {
        name: this.name,
        method,
        url,
        statusCode: response.statusCode,
        body: response.body ?? 'empty response',
      });
      return response.body;
    } catch (error) {
      Logger.error('API request failed', {
        name: this.name,
        method,
        url,
        message: error.message,
        statusCode: error.response?.statusCode,
        body: error.response?.body,
      });
      throw error;
    }
  }

  async fullAuthentication() {
    if (this.skipAuth) return "";
    let instructions = "";
    let resolve;
    const oPromise = new Promise((res, _) => {
      resolve = res;
    });
    this._tadoAuthenticationCallback = (openInBrowserInstructions) => {
      instructions = openInBrowserInstructions;
      resolve();
    };
    try {
      await Promise.race([
        this.getToken(),
        oPromise
      ]);
    } finally {
      this._tadoAuthenticationCallback = undefined;
    }
    return instructions;
  }

  async waitForAuthentication() {
    if (!this.skipAuth) await this.getToken();
    return "Authentication successful!";
  }

  async getMe() {
    return this.apiCall('/api/v2/me');
  }

  async getHome(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}`);
  }

  async getWeather(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/weather`);
  }

  async getDevices(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/devices`);
  }

  async getDeviceTemperatureOffset(device_id) {
    return this.apiCall(`/api/v2/devices/${device_id}/temperatureOffset`);
  }

  async getInstallations(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/installations`);
  }

  async getUsers(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/users`);
  }

  async getState(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/state`);
  }

  async getMobileDevices(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/mobileDevices`);
  }

  async getMobileDevice(home_id, device_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/mobileDevices/${device_id}`);
  }

  async getMobileDeviceSettings(home_id, device_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/mobileDevices/${device_id}/settings`);
  }

  async setGeoTracking(home_id, device_id, geoTrackingEnabled) {
    const settings = await this.getMobileDeviceSettings(home_id, device_id);
    settings['geoTrackingEnabled'] = geoTrackingEnabled;
    return this.apiCall(`/api/v2/homes/${home_id}/mobileDevices/${device_id}/settings`, 'PUT', settings);
  }

  async getZones(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones`);
  }

  async getZoneState(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/state`);
  }

  async getZoneStates(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zoneStates`);
  }

  async getZoneCapabilities(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/capabilities`);
  }

  async getZoneOverlay(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/overlay`).catch((error) => {
      if (error.response.status === 404) {
        return {};
      }

      throw error;
    });
  }

  async getZoneDayReport(home_id, zone_id, reportDate) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/dayReport?date=${reportDate}`);
  }

  async getTimeTables(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/schedule/activeTimetable`);
  }

  async getAwayConfiguration(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/awayConfiguration`);
  }

  async getTimeTable(home_id, zone_id, timetable_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/schedule/timetables/${timetable_id}/blocks`);
  }

  async clearZoneOverlay(home_id, zone_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/overlay`, 'DELETE');
  }

  async setZoneOverlay(home_id, zone_id, power, temperature, termination, tempUnit) {
    const zone_state = await this.getZoneState(home_id, zone_id);

    const config = {
      setting: zone_state.setting,
      termination: {},
    };

    // Fix: Use case-insensitive comparison and handle both 'ON' and 'on'
    if (power && power.toString().toLowerCase() === 'on') {
      config.setting.power = 'ON';

      if (temperature && !isNaN(temperature)) {
        if (tempUnit && tempUnit.toLowerCase() === 'fahrenheit') temperature = ((temperature - 32) * 5) / 9;

        config.setting.temperature = { celsius: temperature };
      } else {
        config.setting.temperature = null;
      }
    } else {
      config.setting.power = 'OFF';
      config.setting.temperature = null;
    }

    if (!isNaN(parseInt(termination))) {
      config.termination.type = 'TIMER';
      config.termination.durationInSeconds = termination;
    } else if (termination && termination.toLowerCase() == 'auto') {
      config.termination.type = 'TADO_MODE';
    } else if (termination && termination.toLowerCase() == 'next_time_block') {
      config.type = 'MANUAL';
      config.termination.typeSkillBasedApp = 'NEXT_TIME_BLOCK';
    } else {
      config.termination.type = 'MANUAL';
    }

    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/overlay`, 'PUT', config);
  }

  async setACZoneOverlay(home_id, zone_id, power, mode, temperature, fanSpeed, swing, termination, tempUnit) {
    // Note: fanSpeed parameter is kept for compatibility but ignored for AIR_CONDITIONING units

    // Get current zone state to understand the structure
    let zone_state;
    try {
      zone_state = await this.getZoneState(home_id, zone_id);
    } catch (error) {
      Logger.warn(`Could not get zone state: ${error.message}`, this.name);
    }

    // Preserve existing termination settings if present
    const config = {
      setting: zone_state && zone_state.setting ? { ...zone_state.setting } : {},
      termination: zone_state && zone_state.overlay && zone_state.overlay.termination ? { ...zone_state.overlay.termination } : {},
    };

    // Fix: Use case-insensitive comparison and handle both 'ON' and 'on'
    if (power && power.toString().toLowerCase() === 'on') {
      config.setting.power = 'ON';
      config.setting.mode = mode || 'COOL';

      if (temperature && !isNaN(temperature)) {
        if (tempUnit && tempUnit.toLowerCase() === 'fahrenheit') {
          temperature = ((temperature - 32) * 5) / 9;
        }

        config.setting.temperature = {
          celsius: temperature,
          fahrenheit: Math.round((temperature * 1.8) + 32)
        };
      }

      // Fan speed not supported for AIR_CONDITIONING units

      // Set swing if provided
      if (swing !== undefined && swing !== null) {
        config.setting.swing = swing;
      }
    } else {
      config.setting.power = 'OFF';
    }

    // Handle termination settings
    if (!isNaN(parseInt(termination))) {
      config.termination.type = 'TIMER';
      config.termination.durationInSeconds = termination;
    } else if (termination && termination.toLowerCase() == 'auto') {
      config.termination.type = 'TADO_MODE';
    } else if (termination && termination.toLowerCase() == 'next_time_block') {
      config.termination.type = 'MANUAL';
      config.termination.typeSkillBasedApp = 'NEXT_TIME_BLOCK';
    } else {
      config.termination.type = 'MANUAL';
    }

    // Validate that config is not empty before making API call
    if (!config.setting || Object.keys(config.setting).length === 0) {
      Logger.error(`Config setting is empty! Power: ${power}, Mode: ${mode}, Temp: ${temperature}`, this.name);
      throw new Error('AC overlay configuration is empty');
    }

    // Call API with full AC config
    // Build payload based on AirConditioningZoneSettingsBase schema
    const payload = {
      setting: {
        type: 'AIR_CONDITIONING',
        power: config.setting.power,
        mode: config.setting.mode,
        // Set temperature if ON
        ...(config.setting.power === 'ON' && config.setting.temperature && config.setting.temperature.celsius !== undefined
          ? { temperature: { celsius: config.setting.temperature.celsius } }
          : {}),
        // Fan speed removed for AIR_CONDITIONING units
      },
      termination: {
        // AIR_CONDITIONING does not have "type" key in termination
        ...(config.termination.type === 'TIMER' && config.termination.durationInSeconds !== undefined
          ? { durationInSeconds: config.termination.durationInSeconds }
          : {}),
        ...(
          config.termination.typeSkillBasedApp ?
            { typeSkillBasedApp: config.termination.typeSkillBasedApp } :
            { typeSkillBasedApp: 'MANUAL' }
        ),
      },
    };

    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/overlay`, 'PUT', payload);
  }

  async setDeviceTemperatureOffset(device_id, temperatureOffset) {
    const config = {
      celsius: temperatureOffset,
    };

    return this.apiCall(`/api/v2/devices/${device_id}/temperatureOffset`, 'PUT', config);
  }

  async identifyDevice(device_id) {
    return this.apiCall(`/api/v2/devices/${device_id}/identify`, 'POST');
  }

  async getPresenceLock(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/state`);
  }

  async setPresenceLock(home_id, presence) {
    presence = presence.toUpperCase();

    if (!['HOME', 'AWAY', 'AUTO'].includes(presence)) {
      throw new Error(`Invalid presence "${presence}" must be "HOME", "AWAY", or "AUTO"`);
    }

    const method = presence == 'AUTO' ? 'DELETE' : 'PUT';
    const config = {
      homePresence: presence,
    };

    return this.apiCall(`/api/v2/homes/${home_id}/presenceLock`, method, config);
  }

  async isAnyoneAtHome(home_id) {
    const devices = await this.getMobileDevices(home_id);

    for (const device of devices) {
      if (device.settings.geoTrackingEnabled && device.location && device.location.atHome) {
        return true;
      }
    }

    return false;
  }

  async updatePresence(home_id) {
    const isAnyoneAtHome = await this.isAnyoneAtHome(home_id);
    let isPresenceAtHome = await this.getState(home_id);
    isPresenceAtHome = isPresenceAtHome.presence === 'HOME';

    if (isAnyoneAtHome !== isPresenceAtHome) {
      return this.setPresenceLock(home_id, isAnyoneAtHome ? 'HOME' : 'AWAY');
    } else {
      return 'already up to date';
    }
  }

  async setWindowDetection(home_id, zone_id, enabled, timeout) {
    const config = {
      enabled: enabled,
      timeoutInSeconds: timeout,
    };
    return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/openWindowDetection`, 'PUT', config);
  }

  async setOpenWindowMode(home_id, zone_id, activate) {
    if (activate) {
      return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/state/openWindow/activate`, 'POST');
    } else {
      return this.apiCall(`/api/v2/homes/${home_id}/zones/${zone_id}/state/openWindow`, 'DELETE');
    }
  }

  async getAirComfort(home_id) {
    return this.apiCall(`/api/v2/homes/${home_id}/airComfort`);
  }

  async setChildLock(serialNumber, state) {
    if (!serialNumber) {
      throw new Error('Cannot change child lock state. No serialNumber is given.');
    }

    return this.apiCall(`/api/v2/devices/${serialNumber}/childLock`, 'PUT', { childLockEnabled: state });
  }

  async switchAll(home_id, zones = []) {
    const postData = {
      overlays: [],
    };

    zones.forEach((zone) => {
      const zoneData = {
        room: zone.id,
        overlay: {
          setting: {
            power: zone.power || 'OFF',
            type: zone.type || 'HEATING',
          },
        },
        termination: {
          typeSkillBasedApp: zone.termination || 'MANUAL',
        },
      };

      if (zone.maxTempInCelsius) {
        zoneData.overlay.setting.temperature = {
          celsius: zone.maxTempInCelsius,
          fahrenheit: Math.round(((zone.maxTempInCelsius * 9) / 5 + 32 + Number.EPSILON) * 100) / 100,
        };
      }

      if (zone.termination === 'TIMER') {
        zoneData.termination.durationInSeconds = zone.timer > 0 ? zone.timer * 60 : 1800;
      }

      postData.overlays.push(zoneData);
    });

    return this.apiCall(`/api/v2/homes/${home_id}/overlay`, 'POST', postData);
  }

  async resumeShedule(home_id, roomIds = []) {
    if (!roomIds.length) {
      throw new Error('Can not resume shedule for zones, no room ids given!');
    }

    const params = {
      rooms: roomIds.toString(),
    };

    return this.apiCall(`/api/v2/homes/${home_id}/overlay`, 'DELETE', {}, params);
  }

  async getRunningTime(home_id, time, from, to) {
    if (this.customTadoApiUrlActive) return;

    const period = {
      aggregate: time || 'day',
      summary_only: true,
    };

    if (from) period.from = from;

    if (to) period.to = to;

    return this.apiCall(`/v1/homes/${home_id}/runningTimes`, 'GET', {}, period, 'https://minder.tado.com');
  }
}
