'use strict';

import Homey from 'homey';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

export default class OpenAiSpeechDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('OpenAI Speech Driver has been initialized');
  }

  // Function to download the speechv1 MP3 from OpenAI
  async downloadMP3(
    apiKey: string,
    sentence: string,
    voice: string,
  ): Promise<Buffer | Error> {
    const url: string = 'https://api.openai.com/v1/audio/speech';

    // Data for the OpenAI request
    const openAIRequestData = {
      model: 'tts-1',
      input: sentence,
      voice: voice,
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIRequestData),
      });
      if (!response.ok) {
        return new Error(`Error from OpenAI API: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
    } catch (error) {
      return new Error(`Error downloading MP3: reason: ${(error as Error).message}`);
    }
  }

  bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Signal the end of the stream
    return stream;
  }

  async uploadToFTP(
    host: string,
    port: number,
    user: string,
    password: string,
    filename: string,
    buffer: Buffer,
  ): Promise<void> {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
      // Connect to FTP server
      await client.access({
        host,
        port,
        user,
        password,
        secure: false, // Disable secure connection (set to true if using FTPS)
      });

      console.log('Connected to FTP server.');

      // Upload the MP3 file as 'speechv1.mp3'
      await client.uploadFrom(this.bufferToStream(buffer), filename);
      console.log('MP3 file uploaded to FTP server successfully.');
    } catch (error) {
      console.error('Error uploading to FTP:', (error as Error).message);
    } finally {
      client.close();
    }
  }

}

module.exports = OpenAiSpeechDriver;
