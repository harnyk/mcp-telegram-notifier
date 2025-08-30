import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';
import { TelegramService, type TelegramConfig } from '../services/telegramService.js';

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


export function registerTelegramTool(server: McpServer, config: TelegramConfig) {
  const telegramService = new TelegramService(config);
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
      await telegramService.sendMessage(messageText, parseMode);

      return {
        content: [
          {
            type: 'text',
            text: 'Message sent successfully',
          },
        ],
      };
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
      await telegramService.sendPhoto(photo, caption, parseMode || 'MarkdownV2');

      return {
        content: [
          {
            type: 'text',
            text: 'Photo sent successfully',
          },
        ],
      };
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
      await telegramService.sendDocument(document, caption, filename, parseMode || 'MarkdownV2');

      return {
        content: [
          {
            type: 'text',
            text: 'Document sent successfully',
          },
        ],
      };
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
      await telegramService.sendVideo(video, caption, filename, parseMode || 'MarkdownV2');

      return {
        content: [
          {
            type: 'text',
            text: 'Video sent successfully',
          },
        ],
      };
    }
  );
}