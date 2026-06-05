<p align="center">
  <img src="https://github.com/homebridge-plugins/homebridge-tado/blob/latest/images/tado_logo.png?raw=true" height="200">
</p>

# homebridge-tado

[![npm](https://img.shields.io/npm/v/@homebridge-plugins/homebridge-tado.svg?style=flat-square)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-tado)
[![npm](https://img.shields.io/npm/dt/@homebridge-plugins/homebridge-tado.svg?style=flat-square)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-tado)
[![GitHub last commit](https://img.shields.io/github/last-commit/homebridge-plugins/homebridge-tado.svg?style=flat-square)](https://github.com/homebridge-plugins/homebridge-tado)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Donate](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/smart7324)

## Info

This plugin has originally been created by [Seydx](https://github.com/seydx/). Donate to him: [![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NP4T3KASWQLD8). It is currently maintained by [smart7324](https://buymeacoffee.com/smart7324).

**Homebridge tado** is possibly the biggest homebridge plugin for tado devices. 

**Multiple home Support**

The plugin even offers support for multiple houses. So it is finally possible to create multiple houses and control them together.

**Full Apple Home Support**

Most features that tado offers are fully supported and can be displayed through this plugin in Apple Home. The thermostat buttons themselves have custom characteristics. Full hot water support, weather temperature, solar intensity, weather, tado quick actions, child lock, presence lock, Air Conditioning and much more awaits you with this plugin!

## Installation

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g @homebridge-plugins/homebridge-tado@latest```

## Documentation

- [Example config.json](https://github.com/homebridge-plugins/homebridge-tado/blob/latest/example-config.json)
- [Config UI](#config-ui)
- [Non Config Ui X User?](#non-config-ui-x-user)
- [Configuration](#configuration)
  - [Authentication](#authentication)
    - [Custom API Configuration](#custom-api-configuration)
  - [Polling Behavior Configuration](#polling-behavior-configuration)
  - [Thermostat](#thermostat)
    - [Open Window](#open-window)
  - [Air Conditioning](#air-conditioning)
  - [Hot Water](#hot-water)
  - [Presence](#presence)
  - [Weather](#weather)
  - [Special Settings](#special-settings)
    - [Prefer Siri Temperature](#prefer-siri-temperature)
  - [Extras](#extras)
    - [Central Switch](#central-switch)
      - [Boost Switch](#boost-switch)
      - [Shedule Switch](#shedule-switch)
      - [Turnoff Switch](#turnoff-switch)
      - [Dummy Switch](#dummy-switch)
    - [Presence Lock](#presence-lock)
    - [Child Lock](#child-lock)
  - [History Service](#history-service)
  - [Telegram](#telegram)
- [Supported Clients](#supported-clients)
- [tado X Compatibility](#tado-x-compatibility)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Config UI

Unlike other plugins, this plugin allows you to manually enable/disable each zone, thermostat, user and everything you see in Apple Home via config.json.

The `config.json` offers a lot of configuration options. And if, as recommended, you use Config UI X, the plugin will be all the better.

It supports the full potential of Config UI X and makes configuring the plugin much easier. With it, you can create a "home" in no time and control everything through Config UI X. From logging in to creating config.json works fully automatically with Config UI X!

<img src="https://i.ibb.co/tL955Lg/hb-tadoplatform-ui-test.gif" align="center" alt="CustomUI">

_(In the section below you can find more information about the functions.)_
 
## Non Config Ui X User?

The plugin can also work without config ui x or a custom ui. If you want the config.json auto-fill feature, you have to put the following part in your config.json. This will generate a ready to use config.json with all options disabled except thermostats. After the first start, this user will get ``"reconfigure": false``. If you want to refresh a home, just enable ``"reconfigure"`` for the user and restart homebridge. If you want to add an another home, add the user credentials (username) to the array. The Plugin can handle multiple accounts. 

**Note:**

If you on HOOBS, you need to reboot the HOOBS server to get your first start config changes instead of restarting Homebridge/HOOBS service.

```
{
  "bridge": {
    ...
  },
  "accessories": [
    ...
  ],
  "platforms": [
    {
      "name": "TadoPlatform",
      "platform": "TadoPlatform",
      "debug": false,
      "user": [
        {
          "username": "mail@example.com"
        }
      ]
    }
  ]
}
```
See [Example Config](https://github.com/homebridge-plugins/homebridge-tado/blob/latest/example-config.json) for more details

## Configuration

## Authentication

This plugin implements the tado-supported authentication using the [Device Code Grant Flow](https://support.tado.com/en/articles/8565472-how-do-i-authenticate-to-access-the-rest-api).

During the initial setup, the plugin will prompt you to open a specific URL in your web browser. You will then be asked to log in with your tado account and grant access to the new device. Once this process has been completed successfully, the plugin automatically handles all subsequent authentication tasks, including secure token storage, token refresh, and renewal. This ensures continuous access to the tado API v2 without further user interaction.

### Custom API Configuration

For advanced use cases, the plugin allows overriding the default tado API endpoint by specifying a custom API URL through the `tadoApiUrl` parameter within each home configuration.

Additionally, it is possible to disable the built-in authentication flow entirely by setting the `skipAuth` parameter to `true`. When enabled, all API requests will be sent without an authentication token.

**Important:** Use `skipAuth` only if you are certain that your setup does not require token-based authentication. Improper use may result in limited or failed communication with the tado API.

For further details and configuration examples, refer to the related discussion:  
[homebridge-tado issue #176 – Authentication Options](https://github.com/homebridge-plugins/homebridge-tado/issues/176#issuecomment-3419839118)

## Polling Behavior Configuration

To better control API usage and reduce unnecessary load, the plugin provides additional polling-related options:

When `addJitter` is enabled, a random ±10% jitter is applied to the polling interval.

The setting `nightPolling` optionally defines a longer polling interval during nighttime hours (00:00–06:00, local time). This reduces overnight API activity while maintaining normal polling behavior during the day.

## Thermostat

Each zone in the config.json with ``"type": "HEATING"`` and ``"easyMode": false`` is exposed to Apple Home as a thermostat accessory with the following features:

- Current Mode: OFF | COOLING | HEATING | AUTO
- Target Mode: OFF | HEATING | AUTO
- Curent Temperature
- Target Temperature
- Built-in humidity sensor
- Separate Humidity (if ``"separateHumidity": true``)
- Separate Temperature Sensor (if ``"separateTemperature": true``)
- Battery state (if ``noBattery: false``)
- Delay Switch characteristic with timer (if ``"delaySwitch": true``)
- Elgato EVE history feature (FakeGato)

**Delay Switch**
The Delay Switch (characteristic) can be used for eg. if you have an automation with `Open Window => Thermostat Off / Close Window => Thermostat On` and you want avoid multiple state changes, u can set ``"delaySwitch": true``in your config and change the timer (in seconds) via a third party app. If setted correctly, the thermostat will wait eg 60 seconds before switching to ON. It can also be used for own automations if you need a switch that turns off automatically after the given perioswithout affecting your thermostats (``"autoOffDelay": true``)

**Mode / Mode Timer**
``mode`` for the commands to be sent with. can be 'MANUAL' for manual control until ended by the user, 'AUTO' for manual control until next schedule change in tado° app OR 'TIMER' for manual control until timer ends. ``modeTimer`` for the ``MANUAL`` mode in minutes.

Each zone in the config.json with ``type: HEATING`` and ``easyMode: true`` is exposed to Apple Home as a HeaterCooler accessory with the features as above and some minor changes:

- Active: ON | OFF
- Target Mode: HEATING
- **NO** Elgato EVE history feature (FakeGato)

You can also adjust the minimum temperature step ``"minStep"``, minimum temperature value ``"minValue"`` or maximum temperature value ``"maxValue"`` via config.json. 

- **minValue**: By default, HEATING devices, also this plugin, supports a minValue of 5° Celsius / 41° Fahrenheit. If your device has a different minValue, you can set it up here. (Incorrect minValue may cause problems!)
- **maxValue**: By default, HEATING devices, also this plugin, supports a maxValue of 25° Celsius / 77° Fahrenheit by default. If your device has a different minValue, you can set it up here. (Incorrect maxValue may cause problems!)
- **minStep**: Minimum step for temperature adjustment. (Default: 1, must be between 0 - 1)

```
"homes": [
  {
    "zones": [
      {
        "active": true,
        "id": 32,
        "name": "Living Room",
        "type": "HEATING",
        "mode": "MANUAL",
        "modeTimer": 30,
        "delaySwitch": true,
        "autoOffDelay": false,
        "openWindowSensor": true,
        "openWindowSwitch": false,
        "separateTemperature": false,
        "separateHumidity": true,
        "mode": "MANUAL",
        "modeTimer": 30,
        "minValue": 5,
        "maxValue": 25,
        "minStep": 0.5,
        "easyMode": false,
        "noBattery": false
      }
      ...
    ]
  }
  ...
]
```

#### Open Window:

Each zone with ``"type": "HEATING"`` also has the possibility to display "OpenWindow" contact sensors or switches in Apple Home with the following features:

- Switch to enable disable open window for the zone or trigger the open window state of the zone
- Contact sensor to show the open window state

```
"homes": [
  {
    "zones": [
      {
        "active": true,
        "name": "Living Room",
        "type": "HEATING",
        "mode": "AUTO"
        "openWindowSensor": true,
        "openWindowSwitch": true
        ...
      }
      ...
    ]
  }
  ...
]
```

## Air Conditioning

Each zone in the config.json with `"type": "AIR_CONDITIONING"` is exposed to Apple Home as a HeaterCooler accessory with the following features:

- Current Mode: OFF | IDLE | HEATING | COOLING
- Target Mode: OFF | HEATING | COOLING | AUTO
- Current Temperature
- Target Temperature (Heating/Cooling with CoolingThresholdTemperature support)
- Built-in humidity sensor
- Separate Humidity (if `"separateHumidity": true`)
- Separate Temperature Sensor (if `"separateTemperature": true`)
- Battery state (if `"noBattery": false`)
- Delay Switch characteristic with timer (if `"delaySwitch": true`)
- Elgato EVE history feature (FakeGato)

**AC-Specific Features**
Air conditioning zones support both heating and cooling modes with dedicated cooling threshold temperature control. Fan speed and swing controls are handled through the tado app, while Apple Home integration focuses on temperature and mode control for optimal compatibility. Note that the RotationSpeed characteristic is not supported for AC units.

**Mode / Mode Timer**
`mode` for the commands to be sent with. can be 'MANUAL' for manual control until ended by the user, 'AUTO' for manual control until next schedule change in tado° app OR 'TIMER' for manual control until timer ends. `modeTimer` for the `MANUAL` mode in minutes.

You can also adjust the minimum temperature step `"minStep"`, minimum temperature value `"minValue"` or maximum temperature value `"maxValue"` via config.json if needed.

- **minStep**: Minimum step for temperature adjustment. (Default: 1, must be between 0 - 1)

```json
"homes": [
  {
    "zones": [
      {
        "active": true,
        "id": 45,
        "name": "Living Room AC",
        "type": "AIR_CONDITIONING",
        "mode": "MANUAL",
        "modeTimer": 30,
        "delaySwitch": true,
        "autoOffDelay": false,
        "separateTemperature": false,
        "separateHumidity": true,
        "minStep": 1,
        "noBattery": false
      }
      ...
    ]
  }
  ...
]
```

## Hot Water

Each zone in the config.json with ``"type": HOT_WATER`` and ``"boilerTempSupport": false`` is exposed to Apple Home as a switch (``"accTypeBoiler: "SWITCH"``) or faucet (``"accTypeBoiler: "FAUCET"``) accessory with the following features:

- Active: ON | OFF

Each zone in the config.json with ``type: HOT_WATER`` and ``boilerTempSupport: true`` is exposed to Apple Home as a HeaterCooler accessory with the following features:

- Current Mode: OFF | ON
- Target Mode: OFF | ON
- Curent Temperature
- Target Temperature
- Separate Temperature Sensor (if ``separateTemperature: true``)

You can also adjust the minimum temperature step ``"minStep"``, minimum temperature value ``"minValue"`` or maximum temperature value ``"maxValue"`` via config.json. 

- **minValue**: By default, HOT WATER devices, also this plugin, supports a minValue of 30° Celsius / 86° Fahrenheit. If your device has a different minValue, you can set it up here. (Incorrect minValue may cause problems!)
- **maxValue**: By default, HOT WATER devices, also this plugin, supports a maxValue of 65° Celsius / 149° Fahrenheit by default. If your device has a different minValue, you can set it up here. (Incorrect maxValue may cause problems!)
- **minStep**: Minimum step for temperature adjustment. (Default: 1, must be between 0 - 1)

```
"homes": [
  {
    "zones": [
      {
        "active": true,
        "id": 1,
        "name": "Bathroom",
        "type": "HOT_WATER",
        "mode": "MANUAL",
        "modeTimer": 30,
        "minValue": 30,
        "maxValue": 65,
        "minStep": 1,
        "separateTemperature": true,
        "boilerTempSupport": false,
        "accTypeBoiler": "SWITCH"
      }
      ...
    ]
  }
  ...
]
```

## Presence

Each user or anyone sensor in the config.json is exposed to Apple Home as a occupancy (``"accType: "OCCUPANCY"``) or motion (``"accType: "MOTION"``) accessory. 

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": {
      "anyone": true,
      "accTypeAnyone": "MOTION",
      "user": [
        {
          "active": true,
          "name": "Buddy 1",
          "accType": "MOTION"
        },
        {
          "active": true,
          "name": "Buddy 2",
          "accType": "OCCUPANCY"
        }
      ]
    }
    ...
  }
]
```

## Weather

Weather settings allow you to display a sensor for temperature, a light bulb (```"accTypeSolarIntensity": "LIGHTBULB"```)  or light sensor (```"accTypeSolarIntensity": "SENSOR"```) for sun intensity in Apple Home.

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": {
      "temperatureSensor": true,
      "solarIntensity": true,
      "accTypeSolarIntensity": "LIGHTBULB"
    }
    ...
  }
  ...
]
```

```
"homes": [
  {
    "geolocation": {
      "longitude": "10.1234567",
      "latitude": "23.4567890"
    },
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... }
    ...
  }
  ...
]
```

## Special Settings

### Prefer Siri Temperature

The `preferSiriTemperature` parameter controls how the plugin interprets combined **state + temperature** updates received from Apple Home. It was introduced in version **v8.6.0** to address inconsistent behavior between **Siri commands** and **Apple Home scenes**.

**Background**

Apple Home and Siri both send temperature and state changes simultaneously — especially if a thermostat is currently turned off.
Prior to this improvement, the plugin always switched thermostats to **AUTO** mode when a state update to AUTO and a temperature update was received simultaneously, which occasionally led to conflicts and unexpected behaviour. With `preferSiriTemperature`, users can fine-tune how these combined updates are handled, allowing a more predictable and user-friendly experience depending on whether they primarily use **Siri voice control** or **Apple Home scenes**.

**Configuration**

To enable this behavior, add the parameter to your configuration:

```json
"preferSiriTemperature": true
```

This option changes how combined state + temperature updates are interpreted:

| Situation | Apple Home sends | Default behavior | With `preferSiriTemperature: true` |
|------------|----------------|------------------|------------------------------------|
| Siri: “Set to 7 °C” (while off) | `AUTO + 7 °C` | Switches to Auto | Only sets temperature to 7 °C |
| Scene: “Auto 21 °C” | `AUTO + 21 °C` | Switches to Auto | Only sets temperature to 21 °C |
| Scene: “Auto 5 °C” | `AUTO + 5 °C` | Switches to Auto | Switches to Auto *(fallback)* |

- By default, the plugin behaves as it did prior to v8.4.0, maintaining full compatibility with existing automations and Apple Home scenes.
- If you frequently control your thermostats via Siri, enabling `preferSiriTemperature` may provide a smoother and more natural experience.
- If your setup relies heavily on scenes or automations, leaving this option disabled is recommended to preserve predictable mode transitions.

## Extras

### Central Switch
Shows a switch accessory with additional switches in Apple Home which mimics the "Boost" and "Turnoff" switch from tado. It also shows the Heater Running information as a custom characteristic for the month (in hours) and it shows also how many thermostats are in auto, manual or off mode. Its also possible to show a dummy switch withiun the central switch for eg. automation purposes.

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "centralSwitch": true,
      "runningInformation": true
    }
    ...
  }
  ...
]
```

#### Boost Switch
Shows a switch accessory in Apple Home (added to central switch) which mimics the "Boost" switch from tado and switches all heaters to max temperature. 
_Note: Central Switch needs to be truned on._

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "centralSwitch": true,
      "boostSwitch": true
    }
    ...
  }
  ...
]
```

#### Shedule Switch
Shows a switch accessory in Apple Home (added to central switch) which mimics the "Shedule" switch from tado and switches all heaters to their default shedule
_Note: Central Switch needs to be truned on._

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "centralSwitch": true,
      "sheduleSwitch": true
    }
    ...
  }
  ...
]
```

#### Turnoff Switch
Shows a switch accessory in Apple Home (added to central switch) which mimics the "Turn Off" switch from tado and switches all heaters off
_Note: Central Switch needs to be truned on._

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "centralSwitch": true,
      "turnoffSwitch": true
    }
    ...
  }
  ...
]
```


#### Dummy Switch
Shows a dummy switch accessory in Apple Home (added to central switch) without any functions. Can be used for eg automation purposes.
_Note: Central Switch needs to be truned on._

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "centralSwitch": true,
      "dummySwitch": true
    }
    ...
  }
  ...
]
```

### Presence Lock
Shows a switch with to sub switchs within the main accessory (``"accTypePresenceLock": "SWITCH"``) or security (``"accTypePresenceLock": "ALARM"``) accessory in Apple Home with following features: HOME | AWAY | DISABLED

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "presenceLock": true,
      "accTypePresenceLock": "SWITCH"
    }
    ...
  }
  ...
]
```

### Child Lock
Each device with ``"type": "HEATING"`` and child lock support can be exposed to Apple Home as a "sub" switch to the main switch accessory which can show you if child lock is enabled or you can also enable/disable child lock.

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "extras": {
      "childLockSwitches": [
        {
        "active": true,
        "name": "Living Room Heater",
        "serialNumber": "VA1234567890"
        },
        {
        "active": true,
        "name": "Sleeping Room Heater",
        "serialNumber": "VA1234567890"
        }
      ]
    }
    ...
  }
  ...
]
```

## History Service

Every temperature sensor, humidity sensor, contact sensor, motion sensor, and thermostat provides a **history service** compatible with the **Elgato EVE** app. This allows you to view historical data directly within the EVE interface.

During each polling cycle, all history-enabled accessories are updated with the latest sensor values.  
These updates are persisted to the local **file storage**, ensuring that the history remains accurate and consistent even across restarts.

**disableHistoryService**

For users who do not require historical tracking, the history feature can be completely disabled by setting the following parameter:

```json
"disableHistoryService": true
```

When this option is enabled, no history entries will be recorded or stored, reducing file I/O and memory usage.

## Telegram

You can set up the notifier to get a Telegram notification with customized messages and markdown capability when user arrives/leaves or open window detection triggers. Before you can use the "Telegram Notification" functionality, you need to set up a bot. Here you can find more information: [Setup Telegram Bot](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Telegram.md)

**Hint:**
To better customize the messages, special characters can be set so that the plugin replaces them.

**@** character will be replaced by the Accessory name

**%** character will be replaced by the house name

```
"homes": [
  {
    "zones": [ ... ],
    "extras": { ... },
    "presence": { ... },
    "weather": { ... },
    "telegram": {
      "active": true,
      "token": "136373846:HKAHEVbsuwxl0uCSIi8kdFJsheköjezz72525",
      "chatID": "-123456789",
      "messages": {
        "presence": {
          "user_in": "%: Welcome @",
          "user_out": "%: Bye Bye @",
          "anyone_in": "%: Anyone at home.",
          "anyone_out": "%: Nobody at home."
        },
        "openWindow": {
          "opened": "%: Open Window activated from @!",
          "closed": "%: Open Window deactivated from @!"
        }
      }
    }
  }
  ...
]
```

## Supported clients

This plugin has been verified to work with the latest versions of:

* Apple Home (Apple HomeKit)
* 3rd party apps like Elgato Eve
* Homebridge

## tado X Compatibility

**tado X devices are not supported.**

The new generation of tado X devices uses a completely different API endpoint (`https://hops.tado.com`) and communication methods that are not compatible with the existing tado API (`https://my.tado.com/api/v2`) used by this plugin.

Supporting tado X devices would require a full integration of the new API, which is currently **not planned** due to the significant development effort involved.

For more technical details about the tado X API, see:
- [tado X – API differences (wiki)](https://github.com/kritsel/tado-openapispec-v2/wiki/tado-X)  
- [Swagger documentation](https://kritsel.github.io/tado-openapispec-v2/swagger.html#/)  
- [Postman collection & additional resources](https://github.com/gedhi/tadox-postman-collection?tab=readme-ov-file#additional-resources)

If you are using tado X devices, please note that this plugin will **not be able to control or display** those devices at the moment.

## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/homebridge-plugins/homebridge-tado/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/homebridge-plugins/homebridge-tado/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.

## Troubleshooting

If you have any issues with the plugin, you can enable the debug mode, which will provide some additional information. This might be useful for debugging issues. Open your config.json and set ``"debug": true``

## Disclaimer

All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.