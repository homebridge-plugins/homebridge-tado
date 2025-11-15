# Changelog

## v8.7.3 - 2025-11-15
- Update dependencies due to vulnerability

## v8.7.2 - 2025-11-08
- Add notice about tado X compatibility to documentation (#179)
- Use consistent spelling for tado and Apple Home across the entire plugin

## v8.7.1 - 2025-11-04
- Add debug logs for API responses (#179)

## v8.7.0 — 2025-11-03
- Update documentation and add new config parameters with explanations (#176, #182)
- Update `example-config.json` (#182)
- Update got
- Fix: Config validation failed as minStep is typeof number (#181)
- Fix: Config-UI: Add zone type AIR_CONDITIONING (#170, #173)
- Fix: Always include typeSkillBasedApp when setting AC Zone Overlay to prevent API error (#170, #173)

## v8.6.2 — 2025-11-02
- Fix: Config-UI: Show skip auth field as checkbox and improve instruction texts

## v8.6.1 — 2025-11-01
- Fix: Improve error logging for failed API requests (#179)

## v8.6.0 — 2025-11-01
- BREAKING CHANGE: `tadoApiUrl` and `skipAuth` must now be defined under each home configuration for proper multi-home support (#176)
- New parameter `preferSiriTemperature` for improved Siri handling — allows temperature changes via Siri without forcing Auto mode (#178). See [#178 (comment)](https://github.com/homebridge-plugins/homebridge-tado/issues/178#issuecomment-3476646430) for a detailed explanation
- Restored stable update behavior from v8.3.1 and earlier while keeping Siri compatibility (#178)
- Reworked thermostat update logic: batches state and temperature updates within 400 ms for more reliable state updates (#178)
- Improved zone update and persistence handling for faster, more consistent status updates
- Optimized task queue to prevent overlapping operations and API calls
- Fixed multi-home polling and individual API handling (#176)
- Added enhanced debug logs for zone updates and API interactions
- Note: This update resets the tado API counter for the current day
- Apologies for the unexpected behavior introduced in v8.4.x–8.5.x — this release restores consistent and reliable behavior, with an optional fix for Siri users. Full statement: [#178 (comment)](https://github.com/homebridge-plugins/homebridge-tado/issues/178#issuecomment-3476646430)

## v8.5.0 - 2025-10-27
- Change minimum polling interval to 30s due to improvements made in v8.2.0

## v8.4.0 - 2025-10-26
- Improve state handling to ensure Apple Home states always reflect current tado states

## v8.3.1 - 2025-10-25
- Fix: Persist zone states only if not empty

## v8.3.0 - 2025-10-25
- Add tado API counter
- Improve task scheduling and interval handling
- Refresh history service directly after polling
- Add option to disable the history service completely
- Persist tado zone states to storage directory after every polling

## v8.2.0 - 2025-10-23
- Query all zone states in a single API request to significantly reduce the number of API calls to tado during polling
- Update zone state after clearing a zone overlay
- Skip getRunningTime call when a custom URL is used and remove obsolete getWeatherAirComfort (#176)
- Add example for tadoApiUrl in config (#176)

## v8.1.2 - 2025-10-20
- Fix: Skip auth also for config endpoints if enabled (#176)

## v8.1.1 - 2025-10-20
- Fix config UI not working on HOOBS 5 (#177)

## v8.1.0 - 2025-10-19
- Add option to use a custom tado API url (#176)
- Add option to skip authentication for tado API (#176)
- Update dependencies

## v8.0.2 - 2025-07-22
- Update dependencies
- Update form-data due to vulnerability

## v8.0.1 - 2025-06-12
- tado-API: Verify that refresh token is not empty before saving to file

## v8.0.0 - 2025-06-09
- Add support for tado AC devices

## v7.6.0 - 2025-04-24
- Fixed crash on telegram event (#164)
- Rewrote tado-Platform as ES6 class
- Updated dependencies

## v7.5.3 - 2025-03-27
- Fixed crash on startup for node 20 (unexpected token 'with')

## v7.5.2 - 2025-03-27
- Update plugin name to homebridge tado

## v7.5.1 - 2025-03-26
- Fixed package.json required node version

## v7.5.0 - 2025-03-25
- Converted package to ES module
- Activated eslint
- Updated dependencies
- Added account name to authentication url message
- Dropped support for node 18 due to got

## v7.4.3 - 2025-03-19
- Updated fakegato-history for Homebridge v2.0 support
- Removed workaround for missing perms enum values

## v7.4.2 - 2025-03-16
- Updated config.schema.json

## v7.4.1 - 2025-03-14
- Updated changelog

## v7.4.0 - 2025-03-14
- Implemented the new authentication workflow for the tado° REST API based on their [official instructions](https://support.tado.com/en/articles/8565472-how-do-i-authenticate-to-access-the-rest-API)
- Added full support for Homebridge v2.0 (it is also shown as compatible when using Homebridge v1.X)
- Updated all dependencies to their latest version
- Added new authentication workflow to config-ui
- Fixed an issue that caused Apple Home from pairing with the bridge (Error: Accessory out of compliance)
- Fixed an issue where the plugin crashed after startup due to a type error after upgrading got
- Removed AirQuality feature [homebridge-tado-platform/issues/152#issuecomment-2708942491](https://github.com/seydx/homebridge-tado-platform/issues/152#issuecomment-2708942491)
- Fixed an issue where the current temperature has been set to the target temperature after changing the target temperature through Apple Home
- Fixed an issue that caused Apple Home from pairing with the bridge (Error: Accessory out of compliance)
- Fixed an issue where the plugin crashed after startup due to errors after upgrading got
- Fixed minor bugs

## v6.0.14 - 2021-05-19
- Fixed an issue where the thermostat displayed wrong room temperature due to wrong celsius/fahrenheit calculation
- Bump dependencies

## v6.0.13 - 2021-05-16
- Fix [#79](https://github.com/SeydX/homebridge-tado-platform/issues/79), [#80](https://github.com/SeydX/homebridge-tado-platform/issues/80)
- Minor bugfixes and improvements

## v6.0.12 - 2021-04-26
- Fixed a bug with windowSwitchAccessory
- Less error messages

## v6.0.11 - 2021-03-22
- Fixed a bug with an empty temperature value which threw an error during setting up with config-ui-x
- Fixed minValue for LightSensor
- Fixed a bug with "easyMode" enabled heater

## v6.0.10 - 2021-03-22
- Changed dummySwitch to stateful

## v6.0.9 - 2021-03-22
- Added "Dummy Switch" option to Central Switch
- Added new accessory type option (LightSensor) to Solar Intensity Accessory
- Added new mode (CUSTOM) to HOT_WATER devices
- Fixed current state of HeaterCooler if temperature is reached
- Fixed AUTO mode for HOT_WATER devices
- Bugfixes
- Bump deps

## v6.0.8 - 2021-03-19
- Bugfixes

## v6.0.7 - 2021-03-18
- Bugfixes

## v6.0.6 - 2021-03-16
- Added minValue, maxValue, minStep options to config
- Fixed target temperature for HOT_WATER if power = "ON"
- Other little bugfixes & improvements

## v6.0.5 - 2021-03-16
- Hot Water auto mode bugfixes

## v6.0.4 - 2021-03-16
- Removed "CoolingThresholdTemperature" from HeaterCooler Accessory
- Changed target state to auto when switching on HeaterCooler if mode = "AUTO"

## v6.0.3 - 2021-03-16
- Removed unnecessary log

## v6.0.2 - 2021-03-16
- Fixed zoneOverlay (temperature)

## v6.0.1 - 2021-03-15
- Fixed a bug with faucet accessory appearing as air quality sensor
- Fixed a bug for HOT_WATER devices without temperature support
- Improvements

**Note:**

Hot water devices show 0° when they are first started in Apple Home if they are in "OFF" mode. The reason for this is that in "OFF" mode there is no temperature value in the API. When you turn on the device, the plugin saves the value for the further use case.

**IMPORTANT:**

If you previously used your "HOT_WATER" device/zone as a faucet, then disable the zone after the update and restart Homebridge pls. After the restart, you can enable the zone with the faucet again.

## v6.0.0 - 2021-03-14
**<u>NOTE:</u>** Updating from **<= v5.x** to **v6.x** will crash your homebridge, please **REMOVE** the old version first and check also the new [example-config.json](https://github.com/homebridge-plugins/homebridge-tado/blob/latest/example-config.json) 

- Config UI X support (config.schema.json)
- Custom UI
- Support for non config ui x user
- Auto-fill config for non config ui x user
- HB 1.3 support
  - Support new onGet/onSet event
- Refactored code
- Multiple tado accounts
  - Possibility to control multiple homes
- Customizable temperature unit via Apple Home
- Customizable Modes (AUTO | HEAT | COOL | OFF) or (ON | OFF)
- Deactivatable battery indicator (support for old gen thermostats)
- Customizable zone termination, separate for each zone
- Delay Switch
  - Delay as switch characteristic with adjustable timer characteristic for automations
  - Auto turn off options
- Separate humidity sensor
- Separate temperature sensor
- Boiler with adjustable accessory type
  - Switch (if no temperature is supported) 
  - Faucet (if no temperature supported)
  - HeaterCooler (if temperature supported)
- Grouped Central Switch with custom characteristics 
  - Overall heat in h for day/month/year
  - Thermostat/Boiler states (manual, auto, off)
  - Boost trigger switch
  - Resume shedule trigger switch
  - Turn off trigger switch
- OpenWindow
  - Grouped Switch: Enables open window and trigger open window detection
  - Contact: Read-only open window state as contact sensor
- Presence Lock
  - As Security System
  - As Grouped Switch Accessory 
- Air Quality
  - Weather
  - Zones
- FakeGato
  - Thermostats
  - HeaterCooler
  - Temperature sensors
  - Humidity sensors
  - Contact sensors (window)
- Telegram
  - Presence
  - OpenWindow
- Child Lock Switches as Grouped Switch Accessory
- Better error handling

## v5.1.5 - 2019-04-27
- Refactored HOTWATER Accessory (*)
- Bugfixes
- Cleanup code

## v5.1.4 - 2019-04-25
- Bugfixes

## v5.1.2 - 2019-04-22
- [NEW] Added Valve (Faucet Type) for Hotwater without temp adjustment possibility
- Bugfixes
- Code Cleanup

## v5.0.5 - 2019-04-22
- Code cleanup
- Bugfixes

## v5.0.3 - 2019-04-17
- Bugfixes
- Added new parameter into config.json (overrideMode) to set up the mode after temperature changement (manual or auto)
- Cleanup code

## v5.0.0
- Initial release