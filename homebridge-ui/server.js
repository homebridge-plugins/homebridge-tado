import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
import TadoApi from '../src/tado/tado-api.js';

class UiServer extends HomebridgePluginUiServer {
  constructor() {

    super();

    this.onRequest('/authenticate', this.authenticate.bind(this));
    this.onRequest('/exec', this.exec.bind(this));
    this.onRequest('/reset', this.reset.bind(this));

    this.tado = false;

    this.ready();
  }

  authenticate(config) {

    this.tado = new TadoApi('Config UI X', { username: config.username }, this.homebridgeStoragePath);

    return;

  }

  reset() {

    this.tado = false;

    return;

  }

  async exec(payload) {

    if (this.tado) {

      try {

        console.log('Executing /' + payload.dest);

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

        const data = await this.tado[payload.dest](value1, value2, value3);

        return data;

      } catch (err) {

        console.log(err);

        throw new RequestError(err.message);

      }

    } else {

      throw new RequestError('API not initialized!');

    }

  }

}

(() => {
  return new UiServer;
})();
