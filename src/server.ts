#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerTelegramTool } from './tools/telegram.js';

const server = new McpServer({
    name: 'telegram-notifier',
    version: '0.1.0',
    title: 'Telegram Notifier Server',
});

registerTelegramTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);