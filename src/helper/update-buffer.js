import { hrtime } from "process";
import Logger from '../helper/logger.js';

export class TadoUpdateBuffer {
  constructor(sendUpdateFn, preferSiriTemperature = false) {
    this.preferSiriTemperature = !!preferSiriTemperature;
    this.sendUpdateFn = sendUpdateFn;
    this.delay = 400;
    this.timer = null;
    this.pendingState = null;
    this.pendingTemperature = null;
    this.lastUpdateTime = null;
    this.lastTemperature = 20;
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

  _schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this._apply(), this.delay);
  }

  _apply() {
    this.timer = null;
    const state = this.pendingState;
    const temp = this.pendingTemperature;
    const tempSet = temp !== null && temp !== undefined && temp >= 5;
    this.pendingState = null;
    this.pendingTemperature = null;
    if (tempSet) this.lastTemperature = temp;

    //Siri temperature heuristic
    if (this.preferSiriTemperature && state === 3 && tempSet) {
      if (temp === 5) {
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