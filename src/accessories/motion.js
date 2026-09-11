import Logger from '../helper/logger.js';

export default class MotionAccessory {
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
    let service = this.accessory.getService(this.api.hap.Service.MotionSensor);
    let serviceOld = this.accessory.getService(this.api.hap.Service.OccupancySensor);

    if (serviceOld) {
      Logger.info('Removing Occupancy service', this.accessory.displayName);
      this.accessory.removeService(serviceOld);
    }

    if (!service) {
      Logger.info('Adding Motion service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.MotionSensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.LastActivation))
      service.addCharacteristic(this.api.hap.Characteristic.LastActivation);

    service
      .getCharacteristic(this.api.hap.Characteristic.MotionDetected)
      .on(
        'change',
        this.deviceHandler.changedStates.bind(this, this.accessory, this.accessory.displayName)
      );
  }
}
