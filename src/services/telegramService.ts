import axios from 'axios';
import fs from 'node:fs';
import { URL } from 'node:url';
import FormData from 'form-data';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

interface TelegramError {
  response?: {
    data?: unknown;
  };
  message: string;
}

export class TelegramService {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  private handleTelegramError(error: TelegramError, operation: string): never {
    const errorMessage = `Failed to ${operation}: ${error.message}`;
    const responseData = error.response?.data ? `\nResponse: ${JSON.stringify(error.response.data)}` : '';
    throw new Error(errorMessage + responseData);
  }

  private async isUrl(str: string): Promise<boolean> {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async sendMessage(text: string, parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'MarkdownV2'): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${this.config.token}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: this.config.chatId,
        text: text,
        parse_mode: parseMode,
      });
    } catch (error) {
      this.handleTelegramError(error as TelegramError, 'send message');
    }
  }

  async sendPhoto(
    photo: string,
    caption?: string,
    parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'MarkdownV2'
  ): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${this.config.token}/sendPhoto`;

    try {
      if (await this.isUrl(photo)) {
        // Send photo by URL
        await axios.post(url, {
          chat_id: this.config.chatId,
          photo: photo,
          caption: caption,
          parse_mode: parseMode,
        });
      } else if (await this.fileExists(photo)) {
        // Send local file using multipart/form-data
        const form = new FormData();
        form.append('chat_id', this.config.chatId);
        form.append('photo', fs.createReadStream(photo));
        if (caption) {
          form.append('caption', caption);
          form.append('parse_mode', parseMode);
        }

        await axios.post(url, form, {
          headers: form.getHeaders(),
        });
      } else {
        throw new Error(`Photo not found: ${photo}. Provide a valid file path, HTTP URL, or base64 data.`);
      }
    } catch (error) {
      if ((error as Error).message.includes('Photo not found')) {
        throw error;
      }
      this.handleTelegramError(error as TelegramError, 'send photo');
    }
  }

  async sendDocument(
    document: string,
    caption?: string,
    filename?: string,
    parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'MarkdownV2'
  ): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${this.config.token}/sendDocument`;

    try {
      if (await this.isUrl(document)) {
        // Send document by URL
        await axios.post(url, {
          chat_id: this.config.chatId,
          document: document,
          caption: caption,
          parse_mode: parseMode,
        });
      } else if (await this.fileExists(document)) {
        // Send local file using multipart/form-data
        const form = new FormData();
        form.append('chat_id', this.config.chatId);
        
        if (filename) {
          form.append('document', fs.createReadStream(document), filename);
        } else {
          form.append('document', fs.createReadStream(document));
        }
        
        if (caption) {
          form.append('caption', caption);
          form.append('parse_mode', parseMode);
        }

        await axios.post(url, form, {
          headers: form.getHeaders(),
        });
      } else {
        throw new Error(`Document not found: ${document}. Provide a valid file path or HTTP URL.`);
      }
    } catch (error) {
      if ((error as Error).message.includes('Document not found')) {
        throw error;
      }
      this.handleTelegramError(error as TelegramError, 'send document');
    }
  }

  async sendVideo(
    video: string,
    caption?: string,
    filename?: string,
    parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'MarkdownV2'
  ): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${this.config.token}/sendVideo`;

    try {
      if (await this.isUrl(video)) {
        // Send video by URL
        await axios.post(url, {
          chat_id: this.config.chatId,
          video: video,
          caption: caption,
          parse_mode: parseMode,
        });
      } else if (await this.fileExists(video)) {
        // Send local file using multipart/form-data
        const form = new FormData();
        form.append('chat_id', this.config.chatId);
        
        if (filename) {
          form.append('video', fs.createReadStream(video), filename);
        } else {
          form.append('video', fs.createReadStream(video));
        }
        
        if (caption) {
          form.append('caption', caption);
          form.append('parse_mode', parseMode);
        }

        await axios.post(url, form, {
          headers: form.getHeaders(),
        });
      } else {
        throw new Error(`Video not found: ${video}. Provide a valid file path or HTTP URL.`);
      }
    } catch (error) {
      if ((error as Error).message.includes('Video not found')) {
        throw error;
      }
      this.handleTelegramError(error as TelegramError, 'send video');
    }
  }
}