/**
 * v7
 *
 * @url https://github.com/homebridge-plugins/homebridge-tado
 * @author maintained by smart7324 <34960772+smart7324@users.noreply.github.com> - author SeydX <seyd55@outlook.de>
 *
 **/

import TadoPlatformModule from './src/platform.js';

export default function (homebridge) {
  let TadoPlatform = TadoPlatformModule(homebridge);
  homebridge.registerPlatform('@homebridge-plugins/homebridge-tado', 'TadoPlatform', TadoPlatform, true);
};