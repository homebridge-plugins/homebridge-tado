import Logger from './logger.js';

export default class Telegram {
  constructor(options, messages) {
    this.token = options.token;
    this.chatID = options.chatID;
    this.messages = messages;

    this.url = `https://api.telegram.org/bot${this.token}/sendMessage`;
  }

  send(target, dest, replacer, additional) {
    if (this.messages[target] && this.messages[target][dest]) {
      let message =
        this.messages[target][dest].includes('@') && replacer
          ? this.messages[target][dest].replace('@', replacer)
          : this.messages[target][dest];

      message = message.includes('%') && additional ? message.replace('%', additional) : message;

      const form = new FormData();

      form.append('chat_id', this.chatID);
      form.append('parse_mode', 'Markdown');
      form.append('text', message);

      Logger.debug('Telegram: Sending Message: ' + message);

      fetch(this.url, { method: 'POST', body: form })
        .then((res) => {
          if (res.status < 200 || res.status > 200) {
            Logger.error('A response error occured during sending telegram message!');
            Logger.error({
              code: res.status,
              message: res.statusText,
            });
          }
        })
        .catch((err) => {
          Logger.error('An error occured during sending telegram message!');
          Logger.error(err);
        });
    } else {
      Logger.debug('Telegram: Skip sending, no message defined for ' + target);
    }
  }
}
