import Logger from '../helper/logger.js';

export default class TemperatureAccessory {
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
    let service = this.accessory.getService(this.api.hap.Service.TemperatureSensor);

    if (!service) {
      Logger.info('Adding Temperature service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.TemperatureSensor,
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

    service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).setProps({
      minValue: -100,
      maxValue: 100,
    });
  }
}
