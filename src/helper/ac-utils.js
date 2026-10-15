// tado exposes fan levels either as "fanSpeeds" (older AC controllers, setting key "fanSpeed")
// or as "fanLevel" (newer AC controllers, setting key "fanLevel")
const FAN_LEVEL_ORDER = ['SILENT', 'LOW', 'LEVEL1', 'MIDDLE', 'LEVEL2', 'LEVEL3', 'HIGH', 'LEVEL4', 'LEVEL5'];

function _getFanLevelRank(level) {
  const rank = FAN_LEVEL_ORDER.indexOf(level);
  return rank === -1 ? FAN_LEVEL_ORDER.length : rank;
}

export function getACFanSettingKey(modeCapabilities) {
  if (Array.isArray(modeCapabilities?.fanLevel)) return 'fanLevel';
  if (Array.isArray(modeCapabilities?.fanSpeeds)) return 'fanSpeed';
  return undefined;
}

export function getACFanLevels(modeCapabilities) {
  if (Array.isArray(modeCapabilities?.fanLevel)) return modeCapabilities.fanLevel;
  if (Array.isArray(modeCapabilities?.fanSpeeds)) return modeCapabilities.fanSpeeds;
  return [];
}

// Fan levels in HomeKit RotationSpeed order: manual levels ascending, AUTO (if supported) at 100%
export function getACFanSteps(modeCapabilities) {
  const levels = getACFanLevels(modeCapabilities);
  const manualLevels = levels.filter((level) => level !== 'AUTO').sort((a, b) => _getFanLevelRank(a) - _getFanLevelRank(b));

  return levels.includes('AUTO') ? [...manualLevels, 'AUTO'] : manualLevels;
}

export function fanLevelToRotationSpeed(steps, level) {
  const index = steps.indexOf(level);
  if (index === -1) return undefined;

  return Math.round(((index + 1) * 100) / steps.length);
}

export function rotationSpeedToFanLevel(steps, rotationSpeed) {
  if (!steps.length || !(rotationSpeed > 0)) return undefined;

  // nearest step, so the percentages from fanLevelToRotationSpeed map back to the same level
  const index = Math.min(Math.max(Math.round((rotationSpeed * steps.length) / 100) - 1, 0), steps.length - 1);

  return steps[index];
}
