#!/usr/bin/env node
/* eslint-disable no-undef */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import process from 'node:process';

import { registerTelegramTool } from './tools/telegram.js';

// Validate required environment variables early
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN environment variable is required');
    process.exit(1);
}

const chatId = process.env.TELEGRAM_CHAT_ID;
if (!chatId) {
    console.error('Error: TELEGRAM_CHAT_ID environment variable is required');
    process.exit(1);
}

const server = new McpServer({
    name: 'telegram-notifier',
    version: '0.1.0',
    title: 'Telegram Notifier Server',
});

registerTelegramTool(server, { token, chatId });

const transport = new StdioServerTransport();
await server.connect(transport);