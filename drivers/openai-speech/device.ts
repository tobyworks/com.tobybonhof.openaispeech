'use strict';

import Homey from 'homey';
import OpenAiSpeechDriver from './driver';

export default class OpenAiSpeechDevice extends Homey.Device {

  apiKey: string = '';
  host: string = '';
  ftpPort: number = 0;
  ftpUser: string = '';
  ftpPassword: string = '';
  httpPort: string = '';

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('OpenAiSpeechDevice has been initialized');
    const downloadSpeechAction = this.homey.flow.getActionCard('download-openai-speech');
    downloadSpeechAction.registerRunListener(async (args, state) => {
      this.updateSettings(this.getSettings());
      const driver = await this.driver as OpenAiSpeechDriver;
      const {
        filename,
        sentence,
        voice,
      } = args;
      console.log(voice)
      const buffer = await driver.downloadMP3(this.apiKey, sentence, voice);
      if (buffer instanceof Buffer) {
        await driver.uploadToFTP(
          this.host,
          this.ftpPort,
          this.ftpUser,
          this.ftpPassword,
          filename,
          buffer,
        );
        return {
          audioFileUrl: `http://${this.host}:${this.httpPort}/${filename}`,
        };
      }
      return Promise.reject(buffer);
    });
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('OpenAiSpeechDevice settings where changed');
    this.updateSettings(newSettings);
  }

  updateSettings(settings: { [key: string]: boolean | string | number | undefined | null }): void {
    this.apiKey = settings.apiKey as string;
    this.host = settings.host as string;
    this.ftpPort = settings.ftpPort as number;
    this.ftpUser = settings.ftpUser as string;
    this.ftpPassword = settings.ftpPassword as string;
    this.httpPort = settings.httpPort as string;
  }

}

module.exports = OpenAiSpeechDevice;
