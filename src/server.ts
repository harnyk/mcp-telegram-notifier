#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import axios, { AxiosRequestConfig } from 'axios';

dotenv.config();

const TELEGRAM_API_BASE = 'https://api.telegram.org';

// --- Shared Types ---
type ToolOutput = { content: [{ type: 'text'; text: string }] };
type TelegramError = { error: { status?: number; message: string } };
type TelegramSuccess<T> = { data: T };
type TelegramResponse<T> = TelegramSuccess<T> | TelegramError;

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
        return {
            error: {
                status: error.response?.status,
                message: error.response?.data || error.message,
            },
        };
    }
}

function getOrThrow<T>(result: TelegramResponse<T>): T {
    if ('error' in result) throw new Error(result.error.message);
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
        // @ts-ignore
        async (args: z.infer<Args>) => {
            try {
                const result = await logic(args);
                return format(result);
            } catch (e: any) {
                return format(`Unhandled error: ${e.message || e}`);
            }
        }
    );
}

const server = new McpServer({
    name: 'telegram-notifier',
    version: '0.1.0',
    logLevel: 'debug',
});

// --- Tool: Send Telegram Message ---
registerApiTool(
    'send_markdown_message_as_telegram_bot',
    z.object({
        messageText: z.string(),
    }),
    'Send Telegram Message in Markdown format',
    'Send a message using Telegram bot in Markdown format',
    async ({ messageText }) => {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!chatId) throw new Error('Missing TELEGRAM_CHAT_ID');

        const response = getOrThrow(
            await telegramPost<{ ok: boolean; result?: any }>(`/sendMessage`, {
                chat_id: chatId,
                text: messageText,
                parse_mode: 'MarkdownV2',
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
