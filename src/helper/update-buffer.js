import { hrtime } from "process";
import Logger from '../helper/logger.js';

export class TadoUpdateBuffer {
  constructor(sendUpdateFn, preferSiriTemperature = false, defaultTemperature = 20, minTemperature = 5, maxTemperature = null, clampToRange = false) {
    this.preferSiriTemperature = !!preferSiriTemperature;
    this.sendUpdateFn = sendUpdateFn;
    this.delay = 400;
    this.timer = null;
    this.pendingState = null;
    this.pendingTemperature = null;
    this.lastUpdateTime = null;
    this.minTemperature = Number.isFinite(Number(minTemperature)) ? Number(minTemperature) : 5;
    this.maxTemperature = Number.isFinite(Number(maxTemperature)) ? Number(maxTemperature) : null;
    this.clampToRange = !!clampToRange;

    const normalizedDefaultTemperature = this._normalizeTemperature(defaultTemperature);
    this.lastTemperature = normalizedDefaultTemperature ?? (this.clampToRange ? this.minTemperature : 20);
  }

  setState(value) {
    this.pendingState = value;
    this._schedule();
    Logger.debug("[TadoUpdateBuffer] setState", value, hrtime.bigint());
  }

  setTemperature(value) {
    this.pendingTemperature = value;
    this._schedule();
    Logger.debug("[TadoUpdateBuffer] setTemperature", value, hrtime.bigint());
  }

  _normalizeTemperature(value) {
    const temp = Number(value);
    if (!Number.isFinite(temp)) return null;

    if (temp < this.minTemperature) return this.clampToRange ? this.minTemperature : null;
    if (this.maxTemperature !== null && temp > this.maxTemperature) return this.clampToRange ? this.maxTemperature : temp;

    return parseFloat(temp.toFixed(2));
  }

  _schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this._apply(), this.delay);
  }

  _apply() {
    this.timer = null;
    const state = this.pendingState;
    const rawTemp = this.pendingTemperature;
    const siriAutoTemperature = Number(rawTemp) === 5;
    const temp = siriAutoTemperature ? 5 : this._normalizeTemperature(rawTemp);
    const tempSet = temp !== null;
    this.pendingState = null;
    this.pendingTemperature = null;
    if (tempSet && !siriAutoTemperature) this.lastTemperature = temp;

    //Siri temperature heuristic
    if (this.preferSiriTemperature && state === 3 && tempSet) {
      if (siriAutoTemperature) {
        //set auto mode on
        Logger.debug("[TadoUpdateBuffer] preferSiriTemperature active but temp=5 -> treat as auto mode");
        return this.sendUpdateFn("State", 3);
      }
      //set temperature
      Logger.debug("[TadoUpdateBuffer] Siri temperature change detected -> ignore state 3, apply temperature only");
      return this.sendUpdateFn("Temperature", temp);
    }

    //default behaviour
    if (state === 0) {
      //set heating off
      return this.sendUpdateFn("State", 0);
    } else if (state === 3) {
      //set auto mode on
      return this.sendUpdateFn("State", 3);
    } else if (tempSet) {
      //set heating on with temperature provided
      return this.sendUpdateFn("Temperature", temp);
    } else if (state === 1) {
      //heating on without temperature provided
      return this.sendUpdateFn("Temperature", this.lastTemperature);
    }
  }
}