
import Logger from '../helper/logger.js';
import got from 'got';
import path from 'path';
import fs from 'fs/promises';

const tado_url = "https://my.tado.com";
const tado_auth_url = "https://login.tado.com/oauth2";
const tado_client_id = "1bb50063-6b0c-4d11-bd99-387f4a91cc46";

export default class Tado {
  constructor(name, config, storagePath) {
    this.name = name;
    const usesExternalTokenFile = config.username?.toLowerCase().endsWith(".json");
    this._tadoExternalTokenFilePath = usesExternalTokenFile ? config.username : undefined;
    const fnSimpleHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
      }
      return (hash >>> 0).toString(36).padStart(7, '0');
    };
    this.username = usesExternalTokenFile ? undefined : config.username;
    this._tadoInternalTokenFilePath = usesExternalTokenFile ? undefined : path.join(storagePath, `.tado-token-${fnSimpleHash(config.username)}.json`);
    this._tadoApiClientId = tado_client_id;
    this._tadoTokenPromise = undefined;
    this._tadoAuthenticationCallback = undefined;
    Logger.debug("API successfull initialized", this.name);
  }

  async getToken() {
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
      throw new Error(`API call failed. Could not get access token: ${error.message || error}`);
    }
  }

  async _retrieveToken() {
    try {
      if (this._tadoBearerToken.refresh_token) return this._refreshToken(this._tadoBearerToken.refresh_token);
      await fs.access(this._tadoInternalTokenFilePath);
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
        const data = await fs.readFile(this._tadoInternalTokenFilePath, "utf8");
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
    try {
      const response = await got.post(`${tado_auth_url}/token`, {
        form: {
          client_id: this._tadoApiClientId,
          grant_type: "refresh_token",
          refresh_token: old_refresh_token
        },
        responseType: "json"
      });
      const { access_token, refresh_token } = response.body;
      if (!access_token) throw new Error("Empty access token.");
      await fs.writeFile(this._tadoInternalTokenFilePath, JSON.stringify({ access_token, refresh_token }));
      this._tadoBearerToken = { access_token, refresh_token, timestamp: Date.now() };
    } catch (error) {
      Logger.warn(`Error while refreshing token: ${error.message || error}`);
      return this._authenticateUser();
    }
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
    const { device_code, verification_uri_complete } = authResponse.body;
    if (!device_code) throw new Error("Failed to retrieve device code.");
    Logger.info(`Open the following URL in your browser, click "submit" and log in to your tado° account "${this.username}": ${verification_uri_complete}`);
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
      } catch (_error) {
        //authentication still pending -> response code 400
      }
      if (tokenResponse?.body) {
        const { access_token, refresh_token } = tokenResponse.body;
        if (access_token) {
          await fs.writeFile(this._tadoInternalTokenFilePath, JSON.stringify({ access_token, refresh_token }));
          this._tadoBearerToken = { access_token, refresh_token, timestamp: Date.now() };
          Logger.info("Authentication successful!");
          return;
        }
      }
      Logger.info("Waiting for confirmation...");
    }
    throw new Error(`Failed to authenticate after ${maxRetries} attempts.`);
  }

  async _retrieveTokenFromExternalFile() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await fs.readFile(this._tadoExternalTokenFilePath, 'utf8');
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

  async apiCall(path, method = 'GET', data = {}, params = {}, tado_url_dif, blockLog) {
    Logger.debug('Get access token...', this.name);
    const access_token = await this.getToken();

    let tadoLink = tado_url_dif || tado_url;

    Logger.debug('Using ' + tadoLink, this.name);

    Logger.debug(
      'API request ' +
      method +
      ' ' +
      path +
      ' ' +
      (data && Object.keys(data).length ? JSON.stringify(data) + ' <pending>' : '<pending>'),
      this.name
    );

    let config = {
      method: method,
      responseType: 'json',
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      timeout: {
        request: 30000
      },
      retry: {
        limit: 2,
        statusCodes: [408, 429, 503, 504],
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
      },
    };

    if (Object.keys(data).length) config.json = data;

    if (Object.keys(params).length) config.searchParams = params;

    const response = await got(tadoLink + path, config);

    Logger.debug(
      'API request ' +
      method +
      ' ' +
      path +
      ' ' +
      (data && Object.keys(data).length ? JSON.stringify(data) + ' <success>' : '<success>'),
      this.name
    );

    if (!blockLog)
      Logger.debug('API request ' + method + ' ' + path + ' <response> ' + JSON.stringify(response.body), this.name);

    return response.body;
  }

  async fullAuthentication() {
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
    await this.getToken();
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

    if (power.toLowerCase() == 'on') {
      config.setting.power = 'ON';

      if (temperature && !isNaN(temperature)) {
        if (tempUnit.toLowerCase() === 'fahrenheit') temperature = ((temperature - 32) * 5) / 9;

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

  async getWeatherAirComfort(home_id, longitude, latitude) {
    let geoLocation = {
      longitude: longitude,
      latitude: latitude,
    };

    if (!geoLocation.longitude || !geoLocation.latitude) {
      const data = await this.getHome(home_id);
      geoLocation = data.geolocation;
    }

    return this.apiCall(`/v1/homes/${home_id}/airComfort`, 'GET', {}, geoLocation, 'https://acme.tado.com');
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
    const period = {
      aggregate: time || 'day',
      summary_only: true,
    };

    if (from) period.from = from;

    if (to) period.to = to;

    return this.apiCall(`/v1/homes/${home_id}/runningTimes`, 'GET', {}, period, 'https://minder.tado.com', false);
  }
}
