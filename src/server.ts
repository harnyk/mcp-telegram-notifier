#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

// --- Shared Types ---
type ToolOutput = { content: [{ type: 'text'; text: string }] };
type TelegramError = { error: { status?: number; message: string } };
type TelegramSuccess<T> = { data: T };
type TelegramResponse<T> = TelegramSuccess<T> | TelegramError;

// --- Error formatter ---
function normalizeError(e: unknown): string {
    if (e instanceof Error) {
        return e.message;
    } else if (typeof e === 'string') {
        return e;
    } else {
        try {
            return JSON.stringify(e, null, 2);
        } catch {
            return String(e);
        }
    }
}

// --- Telegram API helpers ---
async function telegramPost<T>(
    path: string,
    data: unknown,
    config: AxiosRequestConfig = {}
): Promise<TelegramResponse<T>> {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
        const url = `${TELEGRAM_API_BASE}/bot${token}${path}`;
        const response = await axios.post<T>(url, data, {
            headers: {
                ...config.headers,
            },
            responseType: config.responseType || 'json',
        });
        return { data: response.data };
    } catch (error: any) {
        const status = error.response?.status;
        const rawMessage = error.response?.data || error.message;
        const message =
            typeof rawMessage === 'string'
                ? rawMessage
                : JSON.stringify(rawMessage, null, 2);

        return {
            error: {
                status,
                message,
            },
        };
    }
}

function getOrThrow<T>(result: TelegramResponse<T>): T {
    if ('error' in result) {
        throw new Error(result.error.message);
    }
    return result.data;
}

function format(data: unknown): ToolOutput {
    const text =
        typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return { content: [{ type: 'text', text }] };
}

// --- Tool registration helper ---
function registerApiTool<Args extends z.ZodObject<any>>(
    name: string,
    schema: Args,
    title: string,
    description: string,
    logic: (args: z.infer<Args>) => Promise<unknown>
) {
    server.registerTool(
        name,
        { title, description, inputSchema: schema.shape },
        async (args: z.infer<Args>) => {
            try {
                const result = await logic(args);
                return format(result);
            } catch (e) {
                return format(`Unhandled error:\n${normalizeError(e)}`);
            }
        }
    );
}

const server = new McpServer({
    name: 'telegram-notifier',
    version: '0.1.0',
    logLevel: 'debug',
});

const docsPath = new URL('../mdv2docs.txt', import.meta.url).pathname;

const mdv2docs = fs.readFileSync(docsPath, 'utf-8');


// --- Tool: Send Telegram Message ---
registerApiTool(
    'send_markdown_message_as_telegram_bot',
    z.object({
        messageText: z.string()
            .describe(`Message text with formatting. Examples:
HTML: <b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strike</s>, <code>code</code>
Markdown: *bold*, _italic_, \`code\`, [link](url)
MarkdownV2: *bold*, _italic_, __underline__, ~strike~, ||spoiler||, \`code\`

Prefer MarkdownV2.

Read the documentation on MarkdownV2 formatting below:

${mdv2docs}
`),
        parseMode: z
            .enum(['Markdown', 'MarkdownV2', 'HTML'])
            .default('MarkdownV2')
            .describe(
                'Message formatting mode: Markdown (legacy), MarkdownV2 (comprehensive), or HTML (tag-based)'
            ),
    }),
    'Send Telegram Message in Markdown format',
    'Send a message using Telegram bot in Markdown format',
    async ({ messageText, parseMode }) => {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!chatId) throw new Error('Missing TELEGRAM_CHAT_ID');

        const response = getOrThrow(
            await telegramPost<{ ok: boolean; result?: any }>(`/sendMessage`, {
                chat_id: chatId,
                text: messageText,
                parse_mode: parseMode,
            })
        );

        if (!response.ok) {
            throw new Error(`Telegram API returned ok=false`);
        }

        return 'Message sent successfully ✅';
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
