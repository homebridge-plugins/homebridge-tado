import DeviceHandler from './helper/handler.js';
import Logger from './helper/logger.js';
import packageFile from '../package.json' with { type: 'json' };
import TadoConfig from './tado/tado-config.js';
import fakeGatoHistory from 'fakegato-history';

// Accessories
import ContactAccessory from './accessories/contact.js';
import FaucetAccessory from './accessories/faucet.js';
import HeaterCoolerAccessory from './accessories/heatercooler.js';
import HumidityAccessory from './accessories/humidity.js';
import MotionAccessory from './accessories/motion.js';
import OccupancyAccessory from './accessories/occupancy.js';
import SecurityAccessory from './accessories/security.js';
import SolarLightbulbAccessory from './accessories/lightbulb.js';
import SolarLightsensorAccessory from './accessories/lightsensor.js';
import SwitchAccessory from './accessories/switch.js';
import TemperatureAccessory from './accessories/temperature.js';
import ThermostatAccessory from './accessories/thermostat.js';

// Custom Types
import CustomTypes from './types/custom.js';
import EveTypes from './types/eve.js';

const PLUGIN_NAME = '@homebridge-plugins/homebridge-tado';
const PLATFORM_NAME = 'TadoPlatform';

var Accessory, UUIDGen, FakeGatoHistoryService;

export default function (homebridge) {
  Accessory = homebridge.platformAccessory;
  UUIDGen = homebridge.hap.uuid;

  return TadoPlatform;
};

function TadoPlatform(log, config, api) {
  if (!api || !config) return;

  //init logger
  Logger.init(log, config.debug);

  //init types/fakegato
  CustomTypes.registerWith(api.hap);
  EveTypes.registerWith(api.hap);
  FakeGatoHistoryService = fakeGatoHistory(api);

  this.api = api;
  this.accessories = [];
  this.config = config;

  this.user = [];

  const storagePath = this.api.user.storagePath();

  //setup config/plugin
  this.setupPlugin(storagePath);

  if (!this.user.length) this.setupConfig(storagePath);

  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
}

TadoPlatform.prototype = {
  setupPlugin: async function (storagePath) {
    try {
      if (this.config.user && this.config.user.length) {
        for (const credentials of this.config.user) {
          let error = false;

          if (!credentials.username) {
            Logger.warn('There is no username configured for the user. This user will be skipped.');
            error = true;
          } else if (credentials.reconfigure === false) {
            error = true;
          }

          if (!error) {
            this.user.push({
              username: credentials.username
            });
          }
        }
      }

      if (this.user.length) {
        for (const user of this.user) {
          if (user.reconfigure || user.reconfigure === undefined) {
            if (this.config.homes && this.config.homes.length) {
              let foundHome = this.config.homes.filter((home) => home && home.username === user.username);

              if (foundHome.length) {
                //refresh
                if (foundHome[0].name && foundHome[0].username) {
                  Logger.info('Refreshing home...', foundHome[0].name);
                  this.config = await TadoConfig.refresh(foundHome[0].name, this.config, {
                    username: foundHome[0].username
                  }, storagePath);
                }
              } else {
                Logger.info('Generating new home...', user.username);
                this.config = await TadoConfig.add(this.config, [user], storagePath);
              }
            } else {
              Logger.info('Generating new home...', user.username);
              this.config = await TadoConfig.add(this.config, [user], storagePath);
            }
          }
        }

        //store config
        Logger.info('Storing config...');

        this.config.user = this.user
          .map((user) => {
            return {
              reconfigure: false,
              username: user.username
            };
          })
          .filter((user) => user);

        await TadoConfig.store(this.config, storagePath);

        Logger.info('Done!');

        //setup config
        this.user = [];
        this.setupConfig(storagePath);

        //configure accessories
        this.accessories.forEach((accessory) => {
          this.configureAccessory(accessory, true);
        });

        //finish
        this.didFinishLaunching();
      }
    } catch (err) {
      Logger.error('An error occured during setting up plugin!');
      Logger.error(err);
    }

    return;
  },

  setupConfig: function (storagePath) {
    try {
      const { config, devices, deviceHandler, telegram } = TadoConfig.setup(this.config, UUIDGen, storagePath);

      this.config = config;
      this.devices = devices;
      this.deviceHandler = deviceHandler;
      this.telegram = telegram;
    } catch (err) {
      Logger.error('An error occured during setting up plugin!');
      Logger.error(err);
    }

    return;
  },

  didFinishLaunching: function () {
    if (this.user.length) return;

    for (const entry of this.devices.entries()) {
      let uuid = entry[0];
      let device = entry[1];

      const cachedAccessory = this.accessories.find((curAcc) => curAcc.UUID === uuid);

      if (!cachedAccessory) {
        const accessory = new Accessory(device.name, uuid);

        Logger.info('Configuring new accessory...', accessory.displayName);

        this.setupAccessory(accessory, device);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

        this.accessories.push(accessory);
      }
    }

    this.accessories.forEach((accessory) => {
      const device = this.devices.get(accessory.UUID);

      try {
        if (!device) this.removeAccessory(accessory);
      } catch (err) {
        Logger.info('It looks like the device has already been removed. Skip removing.', device.name);
        Logger.debug(err);
      }
    });

    for (const entry of this.deviceHandler.entries()) {
      const name = entry[0];
      const config = entry[1];

      const tado = config.tado;
      delete config.tado;

      let accessories = this.accessories.filter((acc) => acc && acc.context.config.homeName === name);

      const deviceHandler = DeviceHandler(this.api, accessories, config, tado, this.telegram);
      deviceHandler.getStates();
    }
  },

  setupAccessory: function (accessory, device) {
    accessory.on('identify', () => {
      Logger.info('Identify requested.', accessory.displayName);
    });

    const manufacturer = 'Tado';

    const model = device.model ? device.model : device.subtype;

    const serialNumber = device.serialNumber ? device.serialNumber : '123456789';

    const AccessoryInformation = accessory.getService(this.api.hap.Service.AccessoryInformation);

    AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model, model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, packageFile.version);

    const tado = device.tado;

    delete device.tado;
    delete device.geolocation;
    delete device.zones;
    delete device.presence;
    delete device.anyone;
    delete device.weather;
    delete device.extras;
    delete device.childLock;

    accessory.context.config = device;

    const configHandler = this.deviceHandler.get(accessory.context.config.homeName);
    const deviceHandler = DeviceHandler(this.api, false, configHandler, tado, this.telegram);

    switch (device.subtype) {
      case 'zone-thermostat':
        new ThermostatAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'zone-heatercooler':
      case 'zone-heatercooler-boiler':
        new HeaterCoolerAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'zone-switch':
      case 'zone-window-switch':
      case 'extra-childswitch':
      case 'extra-cntrlswitch':
      case 'extra-boost':
      case 'extra-shedule':
      case 'extra-turnoff':
      case 'extra-plockswitch':
        new SwitchAccessory(this.api, accessory, this.accessories, tado, deviceHandler);
        break;
      case 'zone-faucet':
        new FaucetAccessory(this.api, accessory, this.accessories, tado, deviceHandler);
        break;
      case 'zone-window-contact':
        new ContactAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'zone-temperature':
        new TemperatureAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'zone-humidity':
        new HumidityAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'presence-motion':
        new MotionAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'presence-occupancy':
        new OccupancyAccessory(this.api, accessory, this.accessories, tado, deviceHandler);
        break;
      case 'weather-temperature':
        new TemperatureAccessory(this.api, accessory, this.accessories, tado, deviceHandler, FakeGatoHistoryService);
        break;
      case 'weather-lightbulb':
        new SolarLightbulbAccessory(this.api, accessory, this.accessories, tado);
        break;
      case 'weather-lightsensor':
        new SolarLightsensorAccessory(this.api, accessory, this.accessories, tado);
        break;
      case 'extra-plock':
        new SecurityAccessory(this.api, accessory, this.accessories, tado, deviceHandler);
        break;
      default:
        Logger.warn('Unknown accessory type: ' + device.subtype, accessory.displayName);
        break;
    }

    return;
  },

  configureAccessory: function (accessory, refresh) {
    if (!this.user.length) {
      const device = this.devices.get(accessory.UUID);

      if (device) {
        Logger.info('Configuring accessory...', accessory.displayName);
        this.setupAccessory(accessory, device);
      }
    }

    if (!refresh) this.accessories.push(accessory);
  },

  removeAccessory: function (accessory) {
    Logger.info('Removing accessory...', accessory.displayName);

    let accessories = this.accessories.map((cachedAccessory) => {
      if (cachedAccessory.displayName !== accessory.displayName) {
        return cachedAccessory;
      }
    });

    this.accessories = accessories.filter(function (el) {
      return el != null;
    });

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  },
};
