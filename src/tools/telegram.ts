import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { URL } from 'node:url';
import FormData from 'form-data';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

// Load MarkdownV2 documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const docsPath = join(__dirname, '../../llm-texts/MarkdownV2Documentation.txt');
const mdv2docs = fs.readFileSync(docsPath, 'utf-8');

const TEXT_FORMATTING_REFERENCE = `Message text with formatting. Examples:
HTML: <b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strike</s>, <code>code</code>
Markdown: *bold*, _italic_, \`code\`, [link](url)
MarkdownV2: *bold*, _italic_, __underline__, ~strike~, ||spoiler||, \`code\`

Prefer MarkdownV2.

Read the documentation on MarkdownV2 formatting below:

${mdv2docs}`;

interface TelegramConfig {
  token: string;
  chatId: string;
}

interface TelegramError {
  response?: {
    data?: unknown;
  };
  message: string;
}

function handleTelegramError(error: TelegramError, operation: string): never {
  const errorMessage = `Failed to ${operation}: ${error.message}`;
  const responseData = error.response?.data ? `\nResponse: ${JSON.stringify(error.response.data)}` : '';
  throw new Error(errorMessage + responseData);
}

async function isUrl(str: string): Promise<boolean> {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function registerTelegramTool(server: McpServer, config: TelegramConfig) {
  // Text message tool
  server.registerTool(
    'send_markdown_message_as_telegram_bot',
    {
      title: 'Send Telegram Message in Markdown format',
      description: 'Send a message using Telegram bot in Markdown format',
      inputSchema: {
        messageText: z.string().describe(TEXT_FORMATTING_REFERENCE),
        parseMode: z
          .enum(['Markdown', 'MarkdownV2', 'HTML'])
          .default('MarkdownV2')
          .describe('Message formatting mode: Markdown (legacy), MarkdownV2 (comprehensive), or HTML (tag-based)'),
      },
    },
    async ({ messageText, parseMode = 'MarkdownV2' }) => {
      const url = `${TELEGRAM_API_BASE}/bot${config.token}/sendMessage`;
      try {
        await axios.post(url, {
          chat_id: config.chatId,
          text: messageText,
          parse_mode: parseMode,
        });

        return {
          content: [
            {
              type: 'text',
              text: 'Message sent successfully',
            },
          ],
        };
      } catch (error) {
        handleTelegramError(error as TelegramError, 'send message');
      }
    }
  );

  // Photo upload tool
  server.registerTool(
    'send_telegram_photo',
    {
      title: 'Send Telegram Photo',
      description: 'Send a photo/image via Telegram bot',
      inputSchema: {
        photo: z.string().describe('File path, HTTP URL, or base64 encoded image data'),
        caption: z.string().optional().describe('Photo caption with formatting support'),
        parseMode: z
          .enum(['Markdown', 'MarkdownV2', 'HTML'])
          .default('MarkdownV2')
          .optional()
          .describe('Caption formatting mode'),
      },
    },
    async ({ photo, caption, parseMode }) => {
      const url = `${TELEGRAM_API_BASE}/bot${config.token}/sendPhoto`;

      try {
        if (await isUrl(photo)) {
          // Send photo by URL
          await axios.post(url, {
            chat_id: config.chatId,
            photo: photo,
            caption: caption,
            parse_mode: parseMode,
          });
        } else if (await fileExists(photo)) {
          // Send local file using multipart/form-data
          const form = new FormData();
          form.append('chat_id', config.chatId);
          form.append('photo', fs.createReadStream(photo));
          if (caption) {
            form.append('caption', caption);
            form.append('parse_mode', parseMode || 'MarkdownV2');
          }

          await axios.post(url, form, {
            headers: form.getHeaders(),
          });
        } else {
          throw new Error(`Photo not found: ${photo}. Provide a valid file path, HTTP URL, or base64 data.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Photo sent successfully',
            },
          ],
        };
      } catch (error) {
        if ((error as Error).message.includes('Photo not found')) {
          throw error;
        }
        handleTelegramError(error as TelegramError, 'send photo');
      }
    }
  );

  // Document upload tool
  server.registerTool(
    'send_telegram_document',
    {
      title: 'Send Telegram Document',
      description: 'Send a document/file via Telegram bot',
      inputSchema: {
        document: z.string().describe('File path or HTTP URL to the document'),
        caption: z.string().optional().describe('Document caption with formatting support'),
        filename: z.string().optional().describe('Custom filename for the document'),
        parseMode: z
          .enum(['Markdown', 'MarkdownV2', 'HTML'])
          .default('MarkdownV2')
          .optional()
          .describe('Caption formatting mode'),
      },
    },
    async ({ document, caption, filename, parseMode }) => {
      const url = `${TELEGRAM_API_BASE}/bot${config.token}/sendDocument`;

      try {
        if (await isUrl(document)) {
          // Send document by URL
          await axios.post(url, {
            chat_id: config.chatId,
            document: document,
            caption: caption,
            parse_mode: parseMode,
          });
        } else if (await fileExists(document)) {
          // Send local file using multipart/form-data
          const form = new FormData();
          form.append('chat_id', config.chatId);
          
          if (filename) {
            form.append('document', fs.createReadStream(document), filename);
          } else {
            form.append('document', fs.createReadStream(document));
          }
          
          if (caption) {
            form.append('caption', caption);
            form.append('parse_mode', parseMode || 'MarkdownV2');
          }

          await axios.post(url, form, {
            headers: form.getHeaders(),
          });
        } else {
          throw new Error(`Document not found: ${document}. Provide a valid file path or HTTP URL.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Document sent successfully',
            },
          ],
        };
      } catch (error) {
        if ((error as Error).message.includes('Document not found')) {
          throw error;
        }
        handleTelegramError(error as TelegramError, 'send document');
      }
    }
  );

  // Video upload tool
  server.registerTool(
    'send_telegram_video',
    {
      title: 'Send Telegram Video',
      description: 'Send a video via Telegram bot',
      inputSchema: {
        video: z.string().describe('File path or HTTP URL to the video'),
        caption: z.string().optional().describe('Video caption with formatting support'),
        filename: z.string().optional().describe('Custom filename for the video'),
        parseMode: z
          .enum(['Markdown', 'MarkdownV2', 'HTML'])
          .default('MarkdownV2')
          .optional()
          .describe('Caption formatting mode'),
      },
    },
    async ({ video, caption, filename, parseMode }) => {
      const url = `${TELEGRAM_API_BASE}/bot${config.token}/sendVideo`;

      try {
        if (await isUrl(video)) {
          // Send video by URL
          await axios.post(url, {
            chat_id: config.chatId,
            video: video,
            caption: caption,
            parse_mode: parseMode,
          });
        } else if (await fileExists(video)) {
          // Send local file using multipart/form-data
          const form = new FormData();
          form.append('chat_id', config.chatId);
          
          if (filename) {
            form.append('video', fs.createReadStream(video), filename);
          } else {
            form.append('video', fs.createReadStream(video));
          }
          
          if (caption) {
            form.append('caption', caption);
            form.append('parse_mode', parseMode || 'MarkdownV2');
          }

          await axios.post(url, form, {
            headers: form.getHeaders(),
          });
        } else {
          throw new Error(`Video not found: ${video}. Provide a valid file path or HTTP URL.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Video sent successfully',
            },
          ],
        };
      } catch (error) {
        if ((error as Error).message.includes('Video not found')) {
          throw error;
        }
        handleTelegramError(error as TelegramError, 'send video');
      }
    }
  );
}