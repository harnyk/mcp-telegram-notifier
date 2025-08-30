import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

export function registerTelegramTool(server: McpServer, config: TelegramConfig) {
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
    }
  );
}