import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
import TadoApi from '../src/tado/tado-api.js';

class UiServer extends HomebridgePluginUiServer {
  constructor() {

    super();

    this.onRequest('/authenticate', this.authenticate.bind(this));
    this.onRequest('/exec', this.exec.bind(this));
    this.onRequest('/reset', this.reset.bind(this));

    // Track instances per username so two concurrent settings panels
    // (or two child-bridge configurations) don't clobber each other's API.
    this.tadoInstances = new Map();
    this.activeUsername = undefined;

    this.ready();
  }

  authenticate(config) {

    const username = config?.username;
    if (!username) throw new RequestError('Username is required for authentication.');

    const instance = new TadoApi('Config UI X', {
      username: username,
      tadoApiUrl: config.tadoApiUrl,
      skipAuth: config.skipAuth
    }, this.homebridgeStoragePath, false);

    this.tadoInstances.set(username, instance);
    this.activeUsername = username;

    return;
  }

  reset(payload) {

    const username = payload?.username;
    if (username) {
      this.tadoInstances.delete(username);
      if (this.activeUsername === username) this.activeUsername = undefined;
    } else {
      this.tadoInstances.clear();
      this.activeUsername = undefined;
    }

    return;
  }

  async exec(payload) {

    const username = payload?.username || this.activeUsername;
    const tado = username ? this.tadoInstances.get(username) : undefined;

    if (!tado) throw new RequestError('API not initialized!');

    try {

      console.log('Executing /' + payload.dest + (username ? ` for ${username}` : ''));

      let value1, value2, value3;

      if (payload.data) {
        if (typeof payload.data === 'object') {
          value1 = payload.data[0];
          value2 = payload.data[1];
          value3 = payload.data[2];
        } else {
          value1 = payload.data;
        }
      }

      const data = await tado[payload.dest](value1, value2, value3);

      return data;

    } catch (err) {

      console.log(err);

      throw new RequestError(err.message);

    }

  }

}

(() => {
  return new UiServer;
})();
