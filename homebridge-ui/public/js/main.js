/*global $, homebridge, fetchDevicesBar, schema*/

const pageNavigation = {
  currentContent: false,
  previousContent: []
};

let customSchemaActive = false;
let pluginConfig = false;
let activeIndex = 0;
let currentHome = false;

function bridgeLabel(entry, i) {
  const name = entry && entry.name;
  const childUsername = entry && entry._bridge && entry._bridge.username;
  if (name && childUsername) return `${name} (child bridge ${childUsername})`;
  if (name) return name;
  if (childUsername) return `Child bridge ${childUsername}`;
  return `Bridge ${i + 1}`;
}

async function chooseActiveBridge() {
  if (!pluginConfig || pluginConfig.length <= 1) return;
  const $select = $('#bridgeSelectChoice');
  $select.empty();
  pluginConfig.forEach((entry, i) => {
    const homeCount = (entry && entry.homes && entry.homes.length) || 0;
    const homesLabel = `${homeCount} home${homeCount === 1 ? '' : 's'}`;
    $select.append(`<option value="${i}">${bridgeLabel(entry, i)} — ${homesLabel}</option>`);
  });
  $select.val(String(activeIndex));
  await new Promise(resolve => {
    $('#bridgeSelectContinue').off('click').on('click', () => {
      const parsed = parseInt($select.val(), 10);
      activeIndex = Number.isInteger(parsed) ? parsed : 0;
      $('#selectBridge').hide();
      resolve();
    });
    $('#selectBridge').fadeIn(250);
  });
}

const TIMEOUT = (ms) => new Promise((res) => setTimeout(res, ms));

function toggleContent() {

  $('#header').hide();
  $('#main').show();

  return;

}

async function showOldSchema(oldVersion) {

  let config = await homebridge.getPluginConfig();

  if (oldVersion) {

    $('#main').removeClass('pb-5');
    $('#notSupported').show();

    setTimeout(() => {
      $('#main').fadeOut(500);
    }, 5000);

  } else {

    let activeContent = $('#notConfigured').css('display') !== 'none'
      ? '#notConfigured'
      : '#isConfigured';

    transPage($('#main, ' + activeContent), $('#headerOld'), false, true);

  }

  if (!config.length)
    homebridge.updatePluginConfig([{}]);

  homebridge.showSchemaForm();

  return;

}

function transPage(cur, next, removed, showSchema) {

  if (showSchema) {

    cur.hide();
    next.show();

    //pageNavigation.previousContent.push($('#isConfigured'));
    pageNavigation.previousContent.push(cur);
    pageNavigation.currentContent = next;

    return;

  } else {

    toggleContent();

  }

  if (cur) {

    cur.fadeOut(500, () => {

      next.fadeIn(500);

      if (!removed)
        pageNavigation.previousContent.push(cur);

      pageNavigation.currentContent = next;

    });

  } else {

    next.fadeIn(500);

    if (!removed)
      pageNavigation.previousContent.push(next);

    pageNavigation.currentContent = next;

  }

  if (customSchemaActive)
    customSchemaActive.end();

  homebridge.hideSchemaForm();

  return;

}

function goBack(index) {

  if (pageNavigation.previousContent.length && pageNavigation.currentContent) {

    index = index === undefined
      ? pageNavigation.previousContent.length - 1
      : index;

    transPage(pageNavigation.currentContent, pageNavigation.previousContent[index], true);
    //pageNavigation.currentContent = pageNavigation.previousContent[index];
    pageNavigation.previousContent.splice(index, 1);

    if (customSchemaActive)
      customSchemaActive.end();

  }

  return;

}

async function createCustomSchema(home) {

  //schema.layout.homes.forEach()

  customSchemaActive = homebridge.createForm(schema, {
    name: pluginConfig[activeIndex].name,
    debug: pluginConfig[activeIndex].debug,
    disableHistoryService: pluginConfig[activeIndex].disableHistoryService,
    preferSiriTemperature: pluginConfig[activeIndex].preferSiriTemperature,
    homes: home
  });

  customSchemaActive.onChange(async config => {

    pluginConfig[activeIndex].name = config.name;
    pluginConfig[activeIndex].debug = config.debug;
    pluginConfig[activeIndex].disableHistoryService = config.disableHistoryService;
    pluginConfig[activeIndex].preferSiriTemperature = config.preferSiriTemperature;
    pluginConfig[activeIndex].homes = pluginConfig[activeIndex].homes.map(myHome => {
      if (myHome.name === config.homes.name) {
        myHome = config.homes;
      }
      return myHome;
    });

    try {

      await homebridge.updatePluginConfig(pluginConfig);

    } catch (err) {

      console.log(err);
      homebridge.toast.error(err.message, 'Error');

    }

  });

  return;

}

async function resetUI() {

  homebridge.request('/reset');

  resetForm();
  resetSchema();

  currentHome = false;

  return;

}

function resetForm() {

  $('#homeUsername').val('');
  $('#homeTadoApiUrl').val('');
  $('#homeSkipAuth').prop('checked', false);

  if (fetchDevicesBar)
    fetchDevicesBar.set(0);

  return;

}

function resetSchema() {

  if (customSchemaActive) {
    customSchemaActive.end();
    customSchemaActive = false;
  }

  return;

}

function addDeviceToList(home) {

  let name = home.name;
  let owner = home.username;

  $('#deviceSelect').append('<option value="' + name + '">' + name + ' &lt;' + owner + '&gt;' + '</option>');

  return;

}

function removeDeviceFromList(home) {

  let name = typeof home === 'string' ? home : home.name;
  $('#deviceSelect option[value=\'' + name + '\']').remove();

  return;

}

async function addNewDeviceToConfig(config, refresh, resync) {

  try {

    for (const i in config[activeIndex].homes) {

      let found = false;

      for (const j in pluginConfig[activeIndex].homes)
        if (config[activeIndex].homes[i].name === pluginConfig[activeIndex].homes[j].name)
          found = true;

      if (!found) {
        addDeviceToList(config[activeIndex].homes[i]);
        homebridge.toast.success(config[activeIndex].homes[i].name + ' added to config!', 'Success');
      } else if (refresh) {
        homebridge.toast.success(config[activeIndex].homes[i].name + ' refreshed!', 'Success');
      } else if (resync) {
        homebridge.toast.success(config[activeIndex].homes[i].name + ' resynchronized!', 'Success');
      }

    }

    pluginConfig = JSON.parse(JSON.stringify(config));

    await homebridge.updatePluginConfig(pluginConfig);
    await homebridge.savePluginConfig();

  } catch (err) {

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

  }

  return;

}

async function removeDeviceFromConfig(name) {

  currentHome = name || currentHome;

  let foundIndex;
  let pluginConfigBkp = JSON.parse(JSON.stringify(pluginConfig));

  pluginConfig[activeIndex].homes.forEach((home, index) => {
    if (home.name === currentHome) {
      foundIndex = index;
    }
  });

  if (foundIndex !== undefined) {

    try {

      pluginConfig[activeIndex].homes.splice(foundIndex, 1);
      removeDeviceFromList(currentHome);

      if (!pluginConfig[activeIndex].homes.length) {
        delete pluginConfig[activeIndex].debug;
        delete pluginConfig[activeIndex].disableHistoryService;
        delete pluginConfig[activeIndex].preferSiriTemperature;
      }

      await homebridge.updatePluginConfig(pluginConfig);
      await homebridge.savePluginConfig();

      homebridge.toast.success(currentHome + ' removed from config!', 'Success');

    } catch (err) {

      pluginConfig = JSON.parse(JSON.stringify(pluginConfigBkp));

      throw err;

    }

  } else {

    throw new Error('No home found in config to remove!');

  }

  return;

}

async function fetchDevices(auth, refresh, resync) {

  if (!auth && !resync)
    return homebridge.toast.error('No credentials!', 'Error');

  const config = JSON.parse(JSON.stringify(pluginConfig));

  try {
    const fnAuthenticate = async (params) => {
      homebridge.request('/authenticate', params);
      const instructionsURL = await homebridge.request('/exec', { dest: 'fullAuthentication' });
      if (instructionsURL && instructionsURL !== "") {
        $("#fetchDevices #authenticationInstructions").html(
          `<strong style="color:#c00;">Important:</strong> open this URL in a <strong>private / incognito window</strong>` +
          ` (or sign out of <a href="https://app.tado.com" target="_blank">app.tado.com</a> first).` +
          `<br>If your browser is still signed in as a different tado° account, clicking "Submit" will silently confirm THAT account — not <strong>${params.username}</strong>.` +
          `<br><br>Sign in as <strong>${params.username}</strong> and click "Submit":` +
          `<br><a href="${instructionsURL}" target="_blank" rel="noopener noreferrer">${instructionsURL}</a>`
        );
        $("#fetchDevices #authenticationInstructions").css("display", "block");
        homebridge.toast.info("Open the link in a private/incognito window and confirm your login.");
        const authenticationSuccessful = await homebridge.request('/exec', { dest: 'waitForAuthentication' });
        $("#fetchDevices #authenticationInstructions").html("");
        $("#fetchDevices #authenticationInstructions").css("display", "none");
        homebridge.toast.success(authenticationSuccessful);
      }
    }

    if (!resync) {
      //Init API with credentials
      await fnAuthenticate(auth);

      await TIMEOUT(2000);

      fetchDevicesBar.animate(0.20);
    }

    if (refresh) {

      //refresh selected home

      //Home Informations
      let home = config[activeIndex].homes.find(home => home && home.name === currentHome);

      if (!home)
        return homebridge.toast.error('Cannot refresh ' + currentHome + '. Not found in config!', 'Error');

      if (!home.id) {
        homebridge.toast.info('No Home ID defined in config. Getting Home ID for ' + home.name, auth.username);
        const me = await homebridge.request('/exec', { dest: 'getMe' });
        me.homes.map(foundHome => {
          if (foundHome.name === home.name)
            home.id = foundHome.id;
        });
        await TIMEOUT(1000);
        if (!home.id)
          return homebridge.toast.error('Cannot get a Home ID for ' + home.name + '. ' + home.name + ' not found for this user!', auth.username);
      }

      await TIMEOUT(2000);

      fetchDevicesBar.animate(0.40);

      const homeInfo = await homebridge.request('/exec', { dest: 'getHome', data: home.id });

      for (let [i, home] of config[activeIndex].homes.entries()) {

        if (config[activeIndex].homes[i].name === homeInfo.name) {

          config[activeIndex].homes[i].id = homeInfo.id;
          config[activeIndex].homes[i].username = auth.username;
          config[activeIndex].homes[i].tadoApiUrl = auth.tadoApiUrl;
          config[activeIndex].homes[i].skipAuth = auth.skipAuth;
          config[activeIndex].homes[i].temperatureUnit = homeInfo.temperatureUnit || 'CELSIUS';
          config[activeIndex].homes[i].zones = config[activeIndex].homes[i].zones || [];

          if (homeInfo.geolocation)
            config[activeIndex].homes[i].geolocation = {
              longitude: homeInfo.geolocation.longitude.toString(),
              latitude: homeInfo.geolocation.latitude.toString()
            };

          //init devices for childLock
          config[activeIndex].homes[i].extras = config[activeIndex].homes[i].extras || {};
          config[activeIndex].homes[i].extras.childLockSwitches = config[activeIndex].homes[i].extras.childLockSwitches || [];

          let allFoundDevices = [];

          await TIMEOUT(2000);

          fetchDevicesBar.animate(0.60);

          //Mobile Devices Informations
          const mobileDevices = await homebridge.request('/exec', { dest: 'getMobileDevices', data: home.id });

          if (!config[activeIndex].homes[i].presence)
            config[activeIndex].homes[i].presence = {
              anyone: false,
              accTypeAnyone: 'OCCUPANCY',
              user: []
            };

          //Remove not registred devices
          config[activeIndex].homes[i].presence.user.forEach((user, index) => {
            let found = false;
            mobileDevices.forEach(foundUser => {
              if (foundUser.name === user.name) {
                found = true;
              }
            });
            if (!found) {
              homebridge.toast.info(user.name + ' removed from config!', auth.username);
              config[activeIndex].homes[i].presence.user.splice(index, 1);
            }
          });

          //Check for new registred devices
          if (config[activeIndex].homes[i].presence.user.length) {
            for (const foundUser of mobileDevices) {
              let userIndex;
              config[activeIndex].homes[i].presence.user.forEach((user, index) => {
                if (user.name === foundUser.name) {
                  userIndex = index;
                }
              });
              if (userIndex === undefined) {
                config[activeIndex].homes[i].presence.user.push({
                  active: false,
                  name: foundUser.name,
                  accType: 'OCCUPANCY'
                });
              }
            }
          } else {
            config[activeIndex].homes[i].presence.user = mobileDevices.map(user => {
              return {
                active: false,
                name: user.name,
                accType: 'OCCUPANCY'
              };
            });
          }

          await TIMEOUT(2000);

          fetchDevicesBar.animate(0.80);

          //Zone Informations
          const zones = await homebridge.request('/exec', { dest: 'getZones', data: home.id });

          //Remove not available zones
          config[activeIndex].homes[i].zones.forEach((zone, index) => {
            let found = false;
            zones.forEach(foundZone => {
              if (foundZone.name === zone.name) {
                found = true;
              }
            });
            if (!found) {
              homebridge.toast.info(zone.name + ' removed from config!', auth.username);
              config[activeIndex].homes[i].zones.splice(index, 1);
            }
          });

          //Check for new zones or refresh exist one
          if (config[activeIndex].homes[i].zones.length) {
            for (const foundZone of zones) {

              const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [home.id, foundZone.id] }) || {};

              let minTempValue = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.min
                  : capabilities.temperatures.fahrenheit.min
                : foundZone.type === 'HOT_WATER'
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? 30
                    : 86
                  : homeInfo.temperatureUnit === 'CELSIUS'
                    ? 5
                    : 41;

              let maxTempValue = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.max
                  : capabilities.temperatures.fahrenheit.max
                : foundZone.type === 'HOT_WATER'
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? 65
                    : 149
                  : homeInfo.temperatureUnit === 'CELSIUS'
                    ? 27
                    : 77;

              let minTempStep = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.step
                  : capabilities.temperatures.fahrenheit.step
                : 1;

              if (foundZone.devices)
                foundZone.devices.forEach(dev => {
                  if (dev.deviceType && (dev.deviceType.includes('VA01') || dev.deviceType.includes('VA02')))
                    allFoundDevices.push({
                      name: foundZone.name + ' ' + dev.shortSerialNo,
                      serialNumber: dev.shortSerialNo
                    });
                });

              let zoneIndex;
              config[activeIndex].homes[i].zones.forEach((zone, index) => {
                if (zone.name === foundZone.name) {
                  zoneIndex = index;
                }
              });
              if (zoneIndex !== undefined) {
                config[activeIndex].homes[i].zones[zoneIndex].id = foundZone.id;
                config[activeIndex].homes[i].zones[zoneIndex].type = foundZone.type;
                config[activeIndex].homes[i].zones[zoneIndex].minValue = minTempValue;
                config[activeIndex].homes[i].zones[zoneIndex].maxValue = maxTempValue;
                config[activeIndex].homes[i].zones[zoneIndex].minStep = minTempStep;
              } else {
                config[activeIndex].homes[i].zones.push({
                  active: true,
                  id: foundZone.id,
                  name: foundZone.name,
                  type: foundZone.type,
                  delaySwitch: false,
                  autoOffDelay: false,
                  noBattery: false,
                  mode: 'MANUAL',
                  modeTimer: 30,
                  minValue: minTempValue,
                  maxValue: maxTempValue,
                  minStep: minTempStep,
                  easyMode: false,
                  openWindowSensor: false,
                  openWindowSwitch: false,
                  separateTemperature: false,
                  separateHumidity: false,
                  accTypeBoiler: 'SWITCH',
                  boilerTempSupport: false
                });
              }
            }
          } else {

            for (const zone of zones) {

              const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [home.id, zone.id] }) || {};

              let minTempValue = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.min
                  : capabilities.temperatures.fahrenheit.min
                : zone.type === 'HOT_WATER'
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? 30
                    : 86
                  : homeInfo.temperatureUnit === 'CELSIUS'
                    ? 5
                    : 41;

              let maxTempValue = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.max
                  : capabilities.temperatures.fahrenheit.max
                : zone.type === 'HOT_WATER'
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? 65
                    : 149
                  : homeInfo.temperatureUnit === 'CELSIUS'
                    ? 27
                    : 77;

              let minTempStep = capabilities.temperatures
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? capabilities.temperatures.celsius.step
                  : capabilities.temperatures.fahrenheit.step
                : 1;

              if (zone.devices)
                zone.devices.forEach(dev => {
                  allFoundDevices.push({
                    name: zone.name + ' ' + dev.shortSerialNo,
                    serialNumber: dev.shortSerialNo
                  });
                });

              config[activeIndex].homes[i].zones.push({
                active: true,
                id: zone.id,
                name: zone.name,
                type: zone.type,
                delaySwitch: false,
                autoOffDelay: false,
                noBattery: false,
                mode: 'MANUAL',
                modeTimer: 30,
                minValue: minTempValue,
                maxValue: maxTempValue,
                minStep: minTempStep,
                easyMode: false,
                openWindowSensor: false,
                openWindowSwitch: false,
                separateTemperature: false,
                separateHumidity: false,
                accTypeBoiler: 'SWITCH',
                boilerTempSupport: false
              });

            }
          }

          //remove non existing childLockSwitches
          config[activeIndex].homes[i].extras.childLockSwitches.forEach((childLockSwitch, index) => {
            let found = false;
            allFoundDevices.forEach(foundDevice => {
              if (foundDevice.serialNumber === childLockSwitch.serialNumber) {
                found = true;
              }
            });
            if (!found) {
              homebridge.toast.info(childLockSwitch.name + ' removed from config!', auth.username);
              config[activeIndex].homes[i].extras.childLockSwitches.splice(index, 1);
            }
          });

          //check for new childLockSwitches
          if (config[activeIndex].homes[i].extras.childLockSwitches.length) {
            for (const foundDevice of allFoundDevices) {
              let found = false;
              config[activeIndex].homes[i].extras.childLockSwitches.forEach(childLockSwitch => {
                if (childLockSwitch.serialNumber === foundDevice.serialNumber) {
                  found = true;
                }
              });
              if (!found) {
                config[activeIndex].homes[i].extras.childLockSwitches.push({
                  active: false,
                  name: foundDevice.name,
                  serialNumber: foundDevice.serialNumber
                });
              }
            }
          } else {
            config[activeIndex].homes[i].extras.childLockSwitches = allFoundDevices.map(device => {
              return {
                active: false,
                name: device.name,
                serialNumber: device.serialNumber
              };
            });
          }

        }

      }

    } else if (resync) {

      homebridge.toast.info('Checking for available homes for given user...', 'Info');

      const availableHomesInApis = [];

      for (let home of config[activeIndex].homes) {

        if (home.name && home.username) {

          //Init API with credentials
          await fnAuthenticate({
            username: home.username,
            tadoApiUrl: home.tadoApiUrl,
            skipAuth: home.skipAuth
          });

          //resync home (refresh/remove)
          const me = await homebridge.request('/exec', { dest: 'getMe' });

          me.homes.forEach(foundHome => {
            availableHomesInApis.push({
              id: foundHome.id,
              name: foundHome.name,
              username: home.username,
              tadoApiUrl: home.tadoApiUrl,
              skipAuth: home.skipAuth
            });
          });

        }

      }

      await TIMEOUT(2000);

      homebridge.toast.info('Found ' + availableHomesInApis.length + ' in total!', 'Info');

      await TIMEOUT(2000);

      homebridge.toast.info('Search for homes in the config to remove that were not found in the API...', 'Info');

      let removedHomes = 0;

      //remove non exist homes from config that doesnt exist in api
      for (let [i, home] of config[activeIndex].homes.entries()) {

        if (home.name && home.username) {

          //Init API with credentials
          await fnAuthenticate({
            username: home.username,
            tadoApiUrl: home.tadoApiUrl,
            skipAuth: home.skipAuth
          });

          let foundHome;

          for (const apiHome of availableHomesInApis) {
            if (home.name === apiHome.name || home.id === apiHome.id) {
              foundHome = apiHome;
            }
          }

          if (!foundHome) {

            homebridge.toast.info(home.name + ' removed from config!', home.username);

            await removeDeviceFromConfig(home.name);
            config[activeIndex].homes.splice(i, 1);

            removedHomes += 1;

            await TIMEOUT(2000);

          }

        }

      }

      if (!removedHomes)
        await TIMEOUT(2000);

      homebridge.toast.info(removedHomes + ' removed from config in total!', 'Info');

      await TIMEOUT(2000);

      //refresh existing homes
      for (let [i, home] of config[activeIndex].homes.entries()) {

        if (home.name && home.username) {

          //Init API with credentials
          await fnAuthenticate({
            username: home.username,
            tadoApiUrl: home.tadoApiUrl,
            skipAuth: home.skipAuth
          });

          let foundHome;

          for (const apiHome of availableHomesInApis) {
            if (home.name === apiHome.name || home.id === apiHome.id) {
              foundHome = apiHome;
              home.id = apiHome.id;
            }
          }

          if (foundHome) {

            homebridge.toast.info(home.name + ' resynchronizing...', home.username);

            const homeInfo = await homebridge.request('/exec', { dest: 'getHome', data: home.id });

            config[activeIndex].homes[i].id = homeInfo.id;
            config[activeIndex].homes[i].username = foundHome.username;
            config[activeIndex].homes[i].tadoApiUrl = foundHome.tadoApiUrl;
            config[activeIndex].homes[i].skipAuth = foundHome.skipAuth;
            config[activeIndex].homes[i].temperatureUnit = homeInfo.temperatureUnit || 'CELSIUS';
            config[activeIndex].homes[i].zones = config[activeIndex].homes[i].zones || [];

            if (homeInfo.geolocation)
              config[activeIndex].homes[i].geolocation = {
                longitude: homeInfo.geolocation.longitude.toString(),
                latitude: homeInfo.geolocation.latitude.toString()
              };

            //init devices for childLock
            config[activeIndex].homes[i].extras = config[activeIndex].homes[i].extras || {};
            config[activeIndex].homes[i].extras.childLockSwitches = config[activeIndex].homes[i].extras.childLockSwitches || [];

            let allFoundDevices = [];

            //Mobile Devices Informations
            const mobileDevices = await homebridge.request('/exec', { dest: 'getMobileDevices', data: home.id });

            if (!config[activeIndex].homes[i].presence)
              config[activeIndex].homes[i].presence = {
                anyone: false,
                accTypeAnyone: 'OCCUPANCY',
                user: []
              };

            //Remove not registred devices
            config[activeIndex].homes[i].presence.user.forEach((user, index) => {
              let found = false;
              mobileDevices.forEach(foundUser => {
                if (foundUser.name === user.name) {
                  found = true;
                }
              });
              if (!found) {
                homebridge.toast.info(user.name + ' removed from config!', home.username);
                config[activeIndex].homes[i].presence.user.splice(index, 1);
              }
            });

            //Check for new registred devices
            if (config[activeIndex].homes[i].presence.user.length) {
              for (const foundUser of mobileDevices) {
                let userIndex;
                config[activeIndex].homes[i].presence.user.forEach((user, index) => {
                  if (user.name === foundUser.name) {
                    userIndex = index;
                  }
                });
                if (userIndex === undefined) {
                  config[activeIndex].homes[i].presence.user.push({
                    active: false,
                    name: foundUser.name,
                    accType: 'OCCUPANCY'
                  });
                }
              }
            } else {
              config[activeIndex].homes[i].presence.user = mobileDevices.map(user => {
                return {
                  active: false,
                  name: user.name,
                  accType: 'OCCUPANCY'
                };
              });
            }

            //Zone Informations
            const zones = await homebridge.request('/exec', { dest: 'getZones', data: home.id });

            //Remove not available zones
            config[activeIndex].homes[i].zones.forEach((zone, index) => {
              let found = false;
              zones.forEach(foundZone => {
                if (foundZone.name === zone.name) {
                  found = true;
                }
              });
              if (!found) {
                homebridge.toast.info(zone.name + ' removed from config!', home.username);
                config[activeIndex].homes[i].zones.splice(index, 1);
              }
            });

            //Check for new zones or refresh exist one
            if (config[activeIndex].homes[i].zones.length) {
              for (const foundZone of zones) {

                const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [home.id, foundZone.id] }) || {};

                let minTempValue = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.min
                    : capabilities.temperatures.fahrenheit.min
                  : foundZone.type === 'HOT_WATER'
                    ? homeInfo.temperatureUnit === 'CELSIUS'
                      ? 30
                      : 86
                    : homeInfo.temperatureUnit === 'CELSIUS'
                      ? 5
                      : 41;

                let maxTempValue = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.max
                    : capabilities.temperatures.fahrenheit.max
                  : foundZone.type === 'HOT_WATER'
                    ? homeInfo.temperatureUnit === 'CELSIUS'
                      ? 65
                      : 149
                    : homeInfo.temperatureUnit === 'CELSIUS'
                      ? 27
                      : 77;

                let minTempStep = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.step
                    : capabilities.temperatures.fahrenheit.step
                  : 1;

                if (foundZone.devices)
                  foundZone.devices.forEach(dev => {
                    if (dev.deviceType && (dev.deviceType.includes('VA01') || dev.deviceType.includes('VA02')))
                      allFoundDevices.push({
                        name: foundZone.name + ' ' + dev.shortSerialNo,
                        serialNumber: dev.shortSerialNo
                      });
                  });

                let zoneIndex;
                config[activeIndex].homes[i].zones.forEach((zone, index) => {
                  if (zone.name === foundZone.name) {
                    zoneIndex = index;
                  }
                });
                if (zoneIndex !== undefined) {
                  config[activeIndex].homes[i].zones[zoneIndex].id = foundZone.id;
                  config[activeIndex].homes[i].zones[zoneIndex].type = foundZone.type;
                  config[activeIndex].homes[i].zones[zoneIndex].minValue = minTempValue;
                  config[activeIndex].homes[i].zones[zoneIndex].maxValue = maxTempValue;
                  config[activeIndex].homes[i].zones[zoneIndex].minStep = minTempStep;
                } else {
                  config[activeIndex].homes[i].zones.push({
                    active: true,
                    id: foundZone.id,
                    name: foundZone.name,
                    type: foundZone.type,
                    delaySwitch: false,
                    autoOffDelay: false,
                    noBattery: false,
                    mode: 'MANUAL',
                    modeTimer: 30,
                    minValue: minTempValue,
                    maxValue: maxTempValue,
                    minStep: minTempStep,
                    easyMode: false,
                    openWindowSensor: false,
                    openWindowSwitch: false,
                    separateTemperature: false,
                    separateHumidity: false,
                    accTypeBoiler: 'SWITCH',
                    boilerTempSupport: false
                  });
                }
              }
            } else {

              for (const zone of zones) {

                const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [home.id, zone.id] }) || {};

                let minTempValue = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.min
                    : capabilities.temperatures.fahrenheit.min
                  : zone.type === 'HOT_WATER'
                    ? homeInfo.temperatureUnit === 'CELSIUS'
                      ? 30
                      : 86
                    : homeInfo.temperatureUnit === 'CELSIUS'
                      ? 5
                      : 41;

                let maxTempValue = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.max
                    : capabilities.temperatures.fahrenheit.max
                  : zone.type === 'HOT_WATER'
                    ? homeInfo.temperatureUnit === 'CELSIUS'
                      ? 65
                      : 149
                    : homeInfo.temperatureUnit === 'CELSIUS'
                      ? 27
                      : 77;

                let minTempStep = capabilities.temperatures
                  ? homeInfo.temperatureUnit === 'CELSIUS'
                    ? capabilities.temperatures.celsius.step
                    : capabilities.temperatures.fahrenheit.step
                  : 1;

                if (zone.devices)
                  zone.devices.forEach(dev => {
                    if (dev.deviceType && (dev.deviceType.includes('VA01') || dev.deviceType.includes('VA02')))
                      allFoundDevices.push({
                        name: zone.name + ' ' + dev.shortSerialNo,
                        serialNumber: dev.shortSerialNo
                      });
                  });

                config[activeIndex].homes[i].zones.push({
                  active: true,
                  id: zone.id,
                  name: zone.name,
                  type: zone.type,
                  delaySwitch: false,
                  autoOffDelay: false,
                  noBattery: false,
                  mode: 'MANUAL',
                  modeTimer: 30,
                  minValue: minTempValue,
                  maxValue: maxTempValue,
                  minStep: minTempStep,
                  easyMode: false,
                  openWindowSensor: false,
                  openWindowSwitch: false,
                  separateTemperature: false,
                  separateHumidity: false,
                  accTypeBoiler: 'SWITCH',
                  boilerTempSupport: false
                });

              }
            }

            //remove non existing childLockSwitches
            config[activeIndex].homes[i].extras.childLockSwitches.forEach((childLockSwitch, index) => {
              let found = false;
              allFoundDevices.forEach(foundDevice => {
                if (foundDevice.serialNumber === childLockSwitch.serialNumber) {
                  found = true;
                }
              });
              if (!found) {
                homebridge.toast.info(childLockSwitch.serialNumber + ' removed from config!', home.username);
                config[activeIndex].homes[i].extras.childLockSwitches.splice(index, 1);
              }
            });

            //check for new childLockSwitches
            if (config[activeIndex].homes[i].extras.childLockSwitches.length) {
              for (const foundDevice of allFoundDevices) {
                let found = false;
                config[activeIndex].homes[i].extras.childLockSwitches.forEach(childLockSwitch => {
                  if (childLockSwitch.serialNumber === foundDevice.serialNumber) {
                    found = true;
                  }
                });
                if (!found) {
                  config[activeIndex].homes[i].extras.childLockSwitches.push({
                    active: false,
                    name: foundDevice.name,
                    serialNumber: foundDevice.serialNumber
                  });
                }
              }
            } else {
              config[activeIndex].homes[i].extras.childLockSwitches = allFoundDevices.map(device => {
                return {
                  active: false,
                  name: device.name,
                  serialNumber: device.serialNumber
                };
              });
            }

            await TIMEOUT(2000);

            homebridge.toast.info(home.name + ' resynchronized!', home.username);

            await TIMEOUT(2000);


          }

        }

      }

      homebridge.toast.info('Looking for homes which are found in the API but are not configured...', 'Info');

      await TIMEOUT(2000);

      let addedHomes = 0;

      //add new homes from API that doesnt exist in config
      for (const foundHome of availableHomesInApis) {

        let found = false;

        config[activeIndex].homes.forEach(home => {
          if (home.name === foundHome.name || home.id === foundHome.id)
            found = true;
        });

        if (!found) {

          homebridge.toast.info('Found ' + foundHome.name, foundHome.username);

          addedHomes += 1;

          //Init API with credentials
          await fnAuthenticate({
            username: foundHome.username,
            tadoApiUrl: foundHome.tadoApiUrl,
            skipAuth: foundHome.skipAuth
          });

          const homeConfig = {
            id: foundHome.id,
            name: foundHome.name,
            username: foundHome.username,
            tadoApiUrl: foundHome.tadoApiUrl,
            skipAuth: foundHome.skipAuth,
            addJitter: false,
            polling: 300,
            nightPolling: 300,
            zones: [],
            presence: {
              anyone: false,
              accTypeAnyone: 'OCCUPANCY',
              user: []
            },
            weather: {
              temperatureSensor: false,
              solarIntensity: false,
              accTypeSolarIntensity: 'LIGHTBULB'
            },
            extras: {
              centralSwitch: false,
              runningInformation: false,
              boostSwitch: false,
              sheduleSwitch: false,
              turnoffSwitch: false,
              presenceLock: false,
              accTypePresenceLock: 'ALARM',
              childLockSwitches: []
            },
            telegram: {
              active: false
            }
          };

          //Home Informations
          const homeInfo = await homebridge.request('/exec', { dest: 'getHome', data: foundHome.id });

          homeConfig.temperatureUnit = homeInfo.temperatureUnit;
          homeConfig.geolocation = {
            longitude: homeInfo.geolocation.longitude.toString(),
            latitude: homeInfo.geolocation.latitude.toString()
          };

          //Mobile Devices Informations
          const mobileDevices = await homebridge.request('/exec', { dest: 'getMobileDevices', data: foundHome.id });

          homeConfig.presence.user = mobileDevices.map(user => {
            return {
              active: false,
              name: user.name,
              accType: 'OCCUPANCY'
            };
          });

          //Zone Informations
          const zones = await homebridge.request('/exec', { dest: 'getZones', data: foundHome.id });

          for (const zone of zones) {

            const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [homeInfo.id, zone.id] }) || {};

            let minTempValue = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.min
                : capabilities.temperatures.fahrenheit.min
              : zone.type === 'HOT_WATER'
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? 30
                  : 86
                : homeInfo.temperatureUnit === 'CELSIUS'
                  ? 5
                  : 41;

            let maxTempValue = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.max
                : capabilities.temperatures.fahrenheit.max
              : zone.type === 'HOT_WATER'
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? 65
                  : 149
                : homeInfo.temperatureUnit === 'CELSIUS'
                  ? 27
                  : 77;

            let minTempStep = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.step
                : capabilities.temperatures.fahrenheit.step
              : 1;

            if (zone.devices)
              zone.devices.forEach(device => {
                if (device.deviceType && (device.deviceType.includes('VA01') || device.deviceType.includes('VA02')))
                  homeConfig.extras.childLockSwitches.push({
                    active: false,
                    name: zone.name + ' ' + device.shortSerialNo,
                    serialNumber: device.shortSerialNo
                  });
              });

            homeConfig.zones.push({
              active: true,
              id: zone.id,
              name: zone.name,
              type: zone.type,
              delaySwitch: false,
              autoOffDelay: false,
              noBattery: false,
              mode: 'MANUAL',
              modeTimer: 30,
              minValue: minTempValue,
              maxValue: maxTempValue,
              minStep: minTempStep,
              easyMode: false,
              openWindowSensor: false,
              openWindowSwitch: false,
              separateTemperature: false,
              separateHumidity: false,
              accTypeBoiler: 'SWITCH',
              boilerTempSupport: false
            });

          }

          config[activeIndex].homes.push(homeConfig);

          await TIMEOUT(2000);

          homebridge.toast.info(foundHome.name + ' added to config.json!', foundHome.username);

          await TIMEOUT(2000);

        }

      }

      if (!addedHomes)
        await TIMEOUT(2000);

      homebridge.toast.info(removedHomes + ' new homes configured!', 'Info');

    } else {

      //add new account/home 

      const me = await homebridge.request('/exec', { dest: 'getMe' });

      for (const foundHome of me.homes) {

        let homeIndex;
        config[activeIndex].homes.forEach((home, index) => {
          if (home.name === foundHome.name || home.id === foundHome.id) {
            homeIndex = index;
          }
        });

        if (homeIndex === undefined) {

          const homeConfig = {
            id: foundHome.id,
            name: foundHome.name,
            username: auth.username,
            tadoApiUrl: auth.tadoApiUrl,
            skipAuth: auth.skipAuth,
            addJitter: false,
            polling: 300,
            nightPolling: 300,
            zones: [],
            presence: {
              anyone: false,
              accTypeAnyone: 'OCCUPANCY',
              user: []
            },
            weather: {
              temperatureSensor: false,
              solarIntensity: false,
              accTypeSolarIntensity: 'LIGHTBULB'
            },
            extras: {
              centralSwitch: false,
              runningInformation: false,
              boostSwitch: false,
              sheduleSwitch: false,
              turnoffSwitch: false,
              presenceLock: false,
              accTypePresenceLock: 'ALARM',
              childLockSwitches: []
            },
            telegram: {
              active: false
            }
          };

          await TIMEOUT(2000);

          fetchDevicesBar.animate(0.40);

          //Home Informations
          const homeInfo = await homebridge.request('/exec', { dest: 'getHome', data: foundHome.id });

          homeConfig.temperatureUnit = homeInfo.temperatureUnit;
          homeConfig.geolocation = {
            longitude: homeInfo.geolocation.longitude.toString(),
            latitude: homeInfo.geolocation.latitude.toString()
          };

          await TIMEOUT(2000);

          fetchDevicesBar.animate(0.60);

          //Mobile Devices Informations
          const mobileDevices = await homebridge.request('/exec', { dest: 'getMobileDevices', data: foundHome.id });

          homeConfig.presence.user = mobileDevices.map(user => {
            return {
              active: false,
              name: user.name,
              accType: 'OCCUPANCY'
            };
          });

          await TIMEOUT(2000);

          fetchDevicesBar.animate(0.80);

          //Zone Informations
          const zones = await homebridge.request('/exec', { dest: 'getZones', data: foundHome.id });

          for (const zone of zones) {

            const capabilities = await homebridge.request('/exec', { dest: 'getZoneCapabilities', data: [homeInfo.id, zone.id] }) || {};

            let minTempValue = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.min
                : capabilities.temperatures.fahrenheit.min
              : zone.type === 'HOT_WATER'
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? 30
                  : 86
                : homeInfo.temperatureUnit === 'CELSIUS'
                  ? 5
                  : 41;

            let maxTempValue = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.max
                : capabilities.temperatures.fahrenheit.max
              : zone.type === 'HOT_WATER'
                ? homeInfo.temperatureUnit === 'CELSIUS'
                  ? 65
                  : 149
                : homeInfo.temperatureUnit === 'CELSIUS'
                  ? 27
                  : 77;

            let minTempStep = capabilities.temperatures
              ? homeInfo.temperatureUnit === 'CELSIUS'
                ? capabilities.temperatures.celsius.step
                : capabilities.temperatures.fahrenheit.step
              : 1;

            if (zone.devices)
              zone.devices.forEach(device => {
                if (device.deviceType && (device.deviceType.includes('VA01') || device.deviceType.includes('VA02')))
                  homeConfig.extras.childLockSwitches.push({
                    active: false,
                    name: zone.name + ' ' + device.shortSerialNo,
                    serialNumber: device.shortSerialNo
                  });
              });

            homeConfig.zones.push({
              active: true,
              id: zone.id,
              name: zone.name,
              type: zone.type,
              delaySwitch: false,
              autoOffDelay: false,
              noBattery: false,
              mode: 'MANUAL',
              modeTimer: 30,
              minValue: minTempValue,
              maxValue: maxTempValue,
              minStep: minTempStep,
              easyMode: false,
              openWindowSensor: false,
              openWindowSwitch: false,
              separateTemperature: false,
              separateHumidity: false,
              accTypeBoiler: 'SWITCH',
              boilerTempSupport: false
            });

          }


          config[activeIndex].homes.push(homeConfig);

        }

      }

    }

    await TIMEOUT(2000);

    fetchDevicesBar.animate(1.00);

    if (resync)
      homebridge.toast.info('Resynchronized!', auth.username);

    await TIMEOUT(2000);

    return config;

  } catch (err) {

    fetchDevicesBar.set(0);
    fetchDevicesBar.setText('Error!');

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

    await TIMEOUT(2000);
    return false;

  }

}

(async () => {

  try {

    //check version before load ui
    //eslint-disable-next-line no-undef
    if (window.homebridge.serverEnv.env && window.compareVersions(window.homebridge.serverEnv.env.packageVersion, '4.34.0') < 0) {
      await showOldSchema(true);
      return;
    }

    pluginConfig = await homebridge.getPluginConfig();

    if (!pluginConfig.length) {

      pluginConfig = [{
        platform: 'TadoPlatform',
        name: 'TadoPlatform',
        homes: []
      }];

      transPage(false, $('#notConfigured'));

    } else {

      // When the user runs this plugin as multiple platform entries (typical
      // with child bridges), let them pick which one this UI session will
      // configure. Otherwise every "+" still goes to platforms[0] and the
      // other entries silently stay empty.
      await chooseActiveBridge();

      if (!pluginConfig[activeIndex].homes || (pluginConfig[activeIndex].homes && !pluginConfig[activeIndex].homes.length)) {
        pluginConfig[activeIndex].homes = [];
        return transPage(false, $('#notConfigured'));
      }

      pluginConfig[activeIndex].homes.forEach(home => {
        $('#deviceSelect').append('<option value="' + home.name + '">' + home.name + ' &lt;' + home.username + '&gt;</option>');
      });

      transPage(false, $('#isConfigured'));

    }

  } catch (err) {

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

  }

})();

//jquery listener

$('.back').on('click', () => {
  goBack();
});

$('.oldConfig').on('click', async () => {
  await showOldSchema(false);
});

$('#start, #addDevice').on('click', () => {

  resetUI();

  let activeContent = $('#notConfigured').css('display') !== 'none' ? $('#notConfigured') : $('#isConfigured');

  transPage(activeContent, $('#configureDevice'));

});

$('#reSync').on('click', async () => {

  try {

    homebridge.showSpinner();

    const config = await fetchDevices(false, false, true);

    if (config) {
      await addNewDeviceToConfig(config, false, true);
      resetUI();
    }

    homebridge.hideSpinner();

  } catch (err) {

    homebridge.hideSpinner();

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

  }

});

$('#auth').on('click', async () => {

  try {

    let auth = {
      username: $('#homeUsername').val(),
      tadoApiUrl: $('#homeTadoApiUrl').val(),
      skipAuth: $('#homeSkipAuth').prop('checked')
    };

    transPage($('#configureDevice'), $('#fetchDevices'));

    const config = await fetchDevices(auth, false, false);

    if (config) {
      await addNewDeviceToConfig(config, false, false);
      transPage($('#fetchDevices'), $('#isConfigured'));
      resetUI();
    }

  } catch (err) {

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

  }

});

$('#editDevice').on('click', () => {

  resetUI();

  currentHome = $('#deviceSelect option:selected').val();
  let home = pluginConfig[activeIndex].homes.find(home => home.name === currentHome);

  if (!home)
    return homebridge.toast.error('Can not find selected home!', 'Error');

  createCustomSchema(home);

  transPage($('#main, #isConfigured'), $('#header'), false, true);

});

$('#refreshDevice').on('click', async () => {

  if (customSchemaActive && currentHome) {

    resetSchema();

    let home = pluginConfig[activeIndex].homes.find(home => home.name === currentHome);

    if (!home)
      return homebridge.toast.error('Can not find home in config!', 'Error');

    transPage($('#isConfigured'), $('#fetchDevices'));

    const config = await fetchDevices({
      username: home.username,
      tadoApiUrl: home.tadoApiUrl,
      skipAuth: home.skipAuth
    }, true, false);

    if (config) {
      await addNewDeviceToConfig(config, true, false);
      transPage($('#fetchDevices'), $('#isConfigured'));
      resetUI();
    }

  } else {

    homebridge.toast.error('No home selected to refresh!', 'Error');

  }

});

$('#removeDevice').on('click', async () => {

  try {

    await removeDeviceFromConfig();

    resetUI();

    transPage(false, pluginConfig[activeIndex].homes.length ? $('#isConfigured') : $('#notConfigured'));

  } catch (err) {

    console.log(err);
    homebridge.toast.error(err.message, 'Error');

  }

});
