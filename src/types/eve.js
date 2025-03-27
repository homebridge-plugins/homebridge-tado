
export default {
  registerWith: function (hap) {
    const { Characteristic, Service, Formats, Perms, Units } = hap;

    /// /////////////////////////////////////////////////////////////////////////
    // ResetTotal
    /// /////////////////////////////////////////////////////////////////////////
    class ResetTotal extends Characteristic {
      constructor() {
        super('Reset Total', 'E863F112-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT32,
          unit: Units.SECONDS,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    ResetTotal.UUID = 'E863F112-079E-48FF-8F27-9C2605A29F52';
    Characteristic.ResetTotal = ResetTotal;

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryStatus
    /// /////////////////////////////////////////////////////////////////////////
    class HistoryStatus extends Characteristic {
      constructor() {
        super('History Status', 'E863F116-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    HistoryStatus.UUID = 'E863F116-079E-48FF-8F27-9C2605A29F52';
    Characteristic.HistoryStatus = HistoryStatus;

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryEntries
    /// /////////////////////////////////////////////////////////////////////////
    class HistoryEntries extends Characteristic {
      constructor() {
        super('History Entries', 'E863F117-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    HistoryEntries.UUID = 'E863F117-079E-48FF-8F27-9C2605A29F52';
    Characteristic.HistoryEntries = HistoryEntries;

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryRequest
    /// /////////////////////////////////////////////////////////////////////////
    class HistoryRequest extends Characteristic {
      constructor() {
        super('History Request', 'E863F11C-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    HistoryRequest.UUID = 'E863F11C-079E-48FF-8F27-9C2605A29F52';
    Characteristic.HistoryRequest = HistoryRequest;

    /// /////////////////////////////////////////////////////////////////////////
    // SetTime
    /// /////////////////////////////////////////////////////////////////////////
    class SetTime extends Characteristic {
      constructor() {
        super('Set Time', 'E863F121-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    SetTime.UUID = 'E863F121-079E-48FF-8F27-9C2605A29F52';
    Characteristic.SetTime = SetTime;

    /// /////////////////////////////////////////////////////////////////////////
    // LastActivation
    /// /////////////////////////////////////////////////////////////////////////
    class LastActivation extends Characteristic {
      constructor() {
        super('Last Activation', 'E863F11A-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT32,
          unit: Units.SECONDS,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    LastActivation.UUID = 'E863F11A-079E-48FF-8F27-9C2605A29F52';
    Characteristic.LastActivation = LastActivation;

    /// /////////////////////////////////////////////////////////////////////////
    // TimesOpened
    /// /////////////////////////////////////////////////////////////////////////
    class TimesOpened extends Characteristic {
      constructor() {
        super('Times Opened', 'E863F129-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT32,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    TimesOpened.UUID = 'E863F129-079E-48FF-8F27-9C2605A29F52';
    Characteristic.TimesOpened = TimesOpened;

    /// /////////////////////////////////////////////////////////////////////////
    // OpenDuration
    /// /////////////////////////////////////////////////////////////////////////
    class OpenDuration extends Characteristic {
      constructor() {
        super('Open Duration', 'E863F118-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT32,
          unit: Units.SECONDS,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    OpenDuration.UUID = 'E863F118-079E-48FF-8F27-9C2605A29F52';
    Characteristic.OpenDuration = OpenDuration;

    /// /////////////////////////////////////////////////////////////////////////
    // ClosedDuration
    /// /////////////////////////////////////////////////////////////////////////
    class ClosedDuration extends Characteristic {
      constructor() {
        super('Closed Duration', 'E863F119-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT32,
          unit: Units.SECONDS,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY, Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    ClosedDuration.UUID = 'E863F119-079E-48FF-8F27-9C2605A29F52';
    Characteristic.ClosedDuration = ClosedDuration;

    /// /////////////////////////////////////////////////////////////////////////
    // CurrentConsumption
    /// /////////////////////////////////////////////////////////////////////////
    class CurrentConsumption extends Characteristic {
      constructor() {
        super('Current Consumption', 'E863F10D-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.FLOAT,
          unit: 'W',
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    CurrentConsumption.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
    Characteristic.CurrentConsumption = CurrentConsumption;

    /// /////////////////////////////////////////////////////////////////////////
    // TotalConsumption
    /// /////////////////////////////////////////////////////////////////////////
    class TotalConsumption extends Characteristic {
      constructor() {
        super('Total Consumption', 'E863F10C-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.FLOAT,
          unit: 'kWh',
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    TotalConsumption.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
    Characteristic.TotalConsumption = TotalConsumption;

    /// /////////////////////////////////////////////////////////////////////////
    // Volts
    /// /////////////////////////////////////////////////////////////////////////
    class Volts extends Characteristic {
      constructor() {
        super('Volts', 'E863F10A-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.FLOAT,
          unit: 'V',
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    Volts.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';
    Characteristic.Volts = Volts;

    /// /////////////////////////////////////////////////////////////////////////
    // Amperes
    /// /////////////////////////////////////////////////////////////////////////
    class Amperes extends Characteristic {
      constructor() {
        super('Amperes', 'E863F126-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.FLOAT,
          unit: 'A',
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    Amperes.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';
    Characteristic.Amperes = Amperes;

    /// /////////////////////////////////////////////////////////////////////////
    // ValvePosition
    /// /////////////////////////////////////////////////////////////////////////
    class ValvePosition extends Characteristic {
      constructor() {
        super('Valve Position', 'E863F12E-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.UINT8,
          unit: Units.PERCENTAGE,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    ValvePosition.UUID = 'E863F12E-079E-48FF-8F27-9C2605A29F52';
    Characteristic.ValvePosition = ValvePosition;

    /// /////////////////////////////////////////////////////////////////////////
    // ProgramCommand
    /// /////////////////////////////////////////////////////////////////////////
    class ProgramCommand extends Characteristic {
      constructor() {
        super('Program Command', 'E863F12C-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_WRITE],
        });
        this.value = this.getDefaultValue();
      }
    }
    ProgramCommand.UUID = 'E863F12C-079E-48FF-8F27-9C2605A29F52';
    Characteristic.ProgramCommand = ProgramCommand;

    /// /////////////////////////////////////////////////////////////////////////
    // ProgramData
    /// /////////////////////////////////////////////////////////////////////////
    class ProgramData extends Characteristic {
      constructor() {
        super('Program Data', 'E863F12F-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
          format: Formats.DATA,
          perms: [Perms.PAIRED_READ, Perms.NOTIFY],
        });
        this.value = this.getDefaultValue();
      }
    }
    ProgramData.UUID = 'E863F12F-079E-48FF-8F27-9C2605A29F52';
    Characteristic.ProgramData = ProgramData;

    /// /////////////////////////////////////////////////////////////////////////
    // Outlet
    /// /////////////////////////////////////////////////////////////////////////
    class Outlet extends Service {
      constructor(displayName, subtype) {
        super(displayName, '00000047-0000-1000-8000-0026BB765291', subtype);

        // Required Characteristics
        this.addCharacteristic(Characteristic.On);
        this.addCharacteristic(Characteristic.OutletInUse);

        // Optional Characteristics EVE
        this.addOptionalCharacteristic(Characteristic.CurrentConsumption);
        this.addOptionalCharacteristic(Characteristic.TotalConsumption);
        this.addOptionalCharacteristic(Characteristic.Volts);
        this.addOptionalCharacteristic(Characteristic.Amperes);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
      }
    }
    Outlet.UUID = '00000047-0000-1000-8000-0026BB765291';
    Service.Outlet = Outlet;

    /// /////////////////////////////////////////////////////////////////////////
    // Thermostat
    /// /////////////////////////////////////////////////////////////////////////
    class Thermostat extends Service {
      constructor(displayName, subtype) {
        super(displayName, '0000004A-0000-1000-8000-0026BB765291', subtype);

        // Required Characteristics
        this.addCharacteristic(Characteristic.CurrentHeatingCoolingState);
        this.addCharacteristic(Characteristic.TargetHeatingCoolingState);
        this.addCharacteristic(Characteristic.CurrentTemperature);
        this.addCharacteristic(Characteristic.TargetTemperature);
        this.addCharacteristic(Characteristic.TemperatureDisplayUnits);

        // Optional Characteristics EVE
        this.addOptionalCharacteristic(Characteristic.ValvePosition);
        this.addOptionalCharacteristic(Characteristic.ProgramCommand);
        this.addOptionalCharacteristic(Characteristic.ProgramData);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
        this.addOptionalCharacteristic(Characteristic.TargetRelativeHumidity);
        this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature);
        this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
        this.addOptionalCharacteristic(Characteristic.Name);
      }
    }
    Thermostat.UUID = '0000004A-0000-1000-8000-0026BB765291';
    Service.Thermostat = Thermostat;

    /// /////////////////////////////////////////////////////////////////////////
    // ContactSensor
    /// /////////////////////////////////////////////////////////////////////////
    class ContactSensor extends Service {
      constructor(displayName, subtype) {
        super(displayName, '00000080-0000-1000-8000-0026BB765291', subtype);

        // Required Characteristics
        this.addCharacteristic(Characteristic.ContactSensorState);

        // Optional Characteristics EVE
        this.addOptionalCharacteristic(Characteristic.TimesOpened);
        this.addOptionalCharacteristic(Characteristic.OpenDuration);
        this.addOptionalCharacteristic(Characteristic.ClosedDuration);
        this.addOptionalCharacteristic(Characteristic.LastActivation);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.StatusActive);
        this.addOptionalCharacteristic(Characteristic.StatusFault);
        this.addOptionalCharacteristic(Characteristic.StatusTampered);
        this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
        this.addOptionalCharacteristic(Characteristic.Name);
      }
    }
    ContactSensor.UUID = '00000080-0000-1000-8000-0026BB765291';
    Service.ContactSensor = ContactSensor;

    /// /////////////////////////////////////////////////////////////////////////
    // MotionSensor
    /// /////////////////////////////////////////////////////////////////////////
    class MotionSensor extends Service {
      constructor(displayName, subtype) {
        super(displayName, '00000085-0000-1000-8000-0026BB765291', subtype);

        // Required Characteristics
        this.addCharacteristic(Characteristic.MotionDetected);

        // Optional Characteristics EVE
        this.addOptionalCharacteristic(Characteristic.LastActivation);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.StatusActive);
        this.addOptionalCharacteristic(Characteristic.StatusFault);
        this.addOptionalCharacteristic(Characteristic.StatusTampered);
        this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
        this.addOptionalCharacteristic(Characteristic.Name);
      }
    }
    MotionSensor.UUID = '00000085-0000-1000-8000-0026BB765291';
    Service.MotionSensor = MotionSensor;
  }
};