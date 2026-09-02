import Logger from '../helper/logger.js';

export default class HumidityAccessory {
  constructor(api, accessory, accessories, tado, deviceHandler) {
    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;

    this.deviceHandler = deviceHandler;
    this.tado = tado;

    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService() {
    let service = this.accessory.getService(this.api.hap.Service.HumiditySensor);

    if (!service) {
      Logger.info('Adding HumiditySensor service', this.accessory.displayName);
      this.accessory.addService(
        this.api.hap.Service.HumiditySensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    let batteryService = this.accessory.getService(this.api.hap.Service.Battery);

    if (!this.accessory.context.config.noBattery && this.accessory.context.config.type === 'HEATING') {
      if (!batteryService) {
        Logger.info('Adding Battery service', this.accessory.displayName);
        batteryService = this.accessory.addService(this.api.hap.Service.Battery);
      }
      batteryService.setCharacteristic(
        this.api.hap.Characteristic.ChargingState,
        this.api.hap.Characteristic.ChargingState.NOT_CHARGEABLE
      );
    } else {
      if (batteryService) {
        Logger.info('Removing Battery service', this.accessory.displayName);
        this.accessory.removeService(batteryService);
      }
    }

  }
}
