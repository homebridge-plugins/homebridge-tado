
export default {
  registerWith: function (hap) {
    const { Characteristic, Service, Formats, Perms } = hap;

    // AutoThermostats Characteristic
    class AutoThermostats extends Characteristic {
      constructor() {
        super('Mode Auto', '12edece0-36c8-427f-895c-3b88ea186388');
        this.setProps({
          format: Formats.INT,
          maxValue: 100,
          minValue: 0,
          minStep: 1,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    AutoThermostats.UUID = '12edece0-36c8-427f-895c-3b88ea186388';
    Characteristic.AutoThermostats = AutoThermostats;

    // ManualThermostats Characteristic
    class ManualThermostats extends Characteristic {
      constructor() {
        super('Mode Manual', '2be09385-4dc3-4438-9fee-b5b2e0642004');
        this.setProps({
          format: Formats.INT,
          maxValue: 100,
          minValue: 0,
          minStep: 1,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    ManualThermostats.UUID = '2be09385-4dc3-4438-9fee-b5b2e0642004';
    Characteristic.ManualThermostats = ManualThermostats;

    // OfflineThermostats Characteristic
    class OfflineThermostats extends Characteristic {
      constructor() {
        super('Mode Off', '93131984-615c-401b-84ac-54e22db492c6');
        this.setProps({
          format: Formats.INT,
          maxValue: 100,
          minValue: 0,
          minStep: 1,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    OfflineThermostats.UUID = '93131984-615c-401b-84ac-54e22db492c6';
    Characteristic.OfflineThermostats = OfflineThermostats;

    // OverallHeatDay Characteristic
    class OverallHeatDay extends Characteristic {
      constructor() {
        super('Activity Day', '43c89074-b70a-480c-8239-51697a9db445');
        this.setProps({
          format: Formats.FLOAT,
          maxValue: 99999,
          minValue: 0,
          minStep: 0.01,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    OverallHeatDay.UUID = '43c89074-b70a-480c-8239-51697a9db445';
    Characteristic.OverallHeatDay = OverallHeatDay;

    // OverallHeatMonth Characteristic
    class OverallHeatMonth extends Characteristic {
      constructor() {
        super('Activity Month', '1874332a-d7dd-4e45-9d65-a4baa6d11121');
        this.setProps({
          format: Formats.FLOAT,
          maxValue: 99999,
          minValue: 0,
          minStep: 0.01,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    OverallHeatMonth.UUID = '1874332a-d7dd-4e45-9d65-a4baa6d11121';
    Characteristic.OverallHeatMonth = OverallHeatMonth;

    // OverallHeatYear Characteristic
    class OverallHeatYear extends Characteristic {
      constructor() {
        super('Activity Year', 'd105b9f7-afe7-44a2-9cbe-f079ba499733');
        this.setProps({
          format: Formats.FLOAT,
          maxValue: 99999,
          minValue: 0,
          minStep: 0.01,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    OverallHeatYear.UUID = 'd105b9f7-afe7-44a2-9cbe-f079ba499733';
    Characteristic.OverallHeatYear = OverallHeatYear;

    // DelaySwitch Characteristic
    class DelaySwitch extends Characteristic {
      constructor() {
        super('Delay', 'b7c9db1a-e54e-4f4f-b3b4-17a19b2c4631');
        this.setProps({
          format: Formats.BOOL,
          perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    DelaySwitch.UUID = 'b7c9db1a-e54e-4f4f-b3b4-17a19b2c4631';
    Characteristic.DelaySwitch = DelaySwitch;

    // DelayTimer Characteristic
    class DelayTimer extends Characteristic {
      constructor() {
        super('Timer', '2e4eb630-62ab-41fe-bcc1-ea5c3cf98508');
        this.setProps({
          format: Formats.INT,
          maxValue: 120,
          minValue: 0,
          minStep: 10,
          perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    DelayTimer.UUID = '2e4eb630-62ab-41fe-bcc1-ea5c3cf98508';
    Characteristic.DelayTimer = DelayTimer;

    // Thermostat Service
    class ThermostatService extends Service {
      constructor(displayName, subtype) {
        super(displayName, '0000004A-0000-1000-8000-0026BB765291', subtype);


        // Required Characteristics
        this.addCharacteristic(Characteristic.CurrentHeatingCoolingState);
        this.addCharacteristic(Characteristic.TargetHeatingCoolingState);
        this.addCharacteristic(Characteristic.CurrentTemperature);
        this.addCharacteristic(Characteristic.TargetTemperature);
        this.addCharacteristic(Characteristic.TemperatureDisplayUnits);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
        this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
        this.addOptionalCharacteristic(Characteristic.TargetRelativeHumidity);
        this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature);
        this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
      }
    }
    ThermostatService.UUID = '0000004A-0000-1000-8000-0026BB765291';
    Service.Thermostat = ThermostatService;

    // HeaterCooler Service
    class HeaterCoolerService extends Service {
      constructor(displayName, subtype) {
        super(displayName, '000000BC-0000-1000-8000-0026BB765291', subtype);


        // Required Characteristics
        this.addCharacteristic(Characteristic.Active);
        this.addCharacteristic(Characteristic.CurrentHeaterCoolerState);
        this.addCharacteristic(Characteristic.TargetHeaterCoolerState);
        this.addCharacteristic(Characteristic.CurrentTemperature);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
        this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
        this.addOptionalCharacteristic(Characteristic.LockPhysicalControls);
        this.addOptionalCharacteristic(Characteristic.RotationSpeed);
        this.addOptionalCharacteristic(Characteristic.SwingMode);
        this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature);
        this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
        this.addOptionalCharacteristic(Characteristic.TemperatureDisplayUnits);
      }
    }
    HeaterCoolerService.UUID = '000000BC-0000-1000-8000-0026BB765291';
    Service.HeaterCooler = HeaterCoolerService;

    // Faucet Service
    class FaucetService extends Service {
      constructor(displayName, subtype) {
        super(displayName, '000000D7-0000-1000-8000-0026BB765291', subtype);


        // Required Characteristics
        this.addCharacteristic(Characteristic.Active);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
        this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        this.addOptionalCharacteristic(Characteristic.IsConfigured);
        this.addOptionalCharacteristic(Characteristic.RemainingDuration);
        this.addOptionalCharacteristic(Characteristic.ServiceLabelIndex);
        this.addOptionalCharacteristic(Characteristic.SetDuration);
        this.addOptionalCharacteristic(Characteristic.StatusFault);
      }
    }
    FaucetService.UUID = '000000D7-0000-1000-8000-0026BB765291';
    Service.Faucet = FaucetService;

    // Valve Service
    class ValveService extends Service {
      constructor(displayName, subtype) {
        super(displayName, '000000D0-0000-1000-8000-0026BB765291', subtype);


        // Required Characteristics
        this.addCharacteristic(Characteristic.Active);
        this.addCharacteristic(Characteristic.InUse);
        this.addCharacteristic(Characteristic.ValveType);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
        this.addOptionalCharacteristic(Characteristic.StatusFault);
        this.addOptionalCharacteristic(Characteristic.CurrentTemperature);
        this.addOptionalCharacteristic(Characteristic.CurrentHeaterCoolerState);
        this.addOptionalCharacteristic(Characteristic.TargetHeaterCoolerState);
        this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
      }
    }
    ValveService.UUID = '000000D0-0000-1000-8000-0026BB765291';
    Service.Valve = ValveService;
  }
};