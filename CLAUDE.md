# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Build the project
pnpm build

# Development with auto-reload
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Start production server
pnpm start
```

## Architecture Overview

This is a Model Context Protocol (MCP) server that enables AI agents to send messages via Telegram bot. The codebase follows a clean service-oriented architecture:

### Core Components

- **`src/server.ts`**: Main MCP server entry point that validates environment variables (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) and initializes the server
- **`src/services/telegramService.ts`**: Core service class that handles all Telegram API interactions using axios
- **`src/tools/telegram.ts`**: MCP tool registration layer that exposes Telegram functionality as MCP tools

### Key Services

**TelegramService** (`src/services/telegramService.ts`):
- Handles message, photo, document, and video sending
- Supports both local files and HTTP URLs for media
- Uses multipart/form-data for file uploads
- Provides comprehensive error handling with Telegram API response details
- Supports all Telegram formatting modes (Markdown, MarkdownV2, HTML)

### Environment Configuration

Required environment variables:
- `TELEGRAM_BOT_TOKEN`: Bot token from @BotFather
- `TELEGRAM_CHAT_ID`: Target chat/channel ID (negative for channels)

### MCP Tools

The server exposes four MCP tools:
1. `send_markdown_message_as_telegram_bot` - Send formatted text messages
2. `send_telegram_photo` - Send images with optional captions
3. `send_telegram_document` - Send files with custom filenames
4. `send_telegram_video` - Send videos with captions

All tools support comprehensive error handling and return success/failure status to the MCP client.

## Package Information

- Published as `@harnyk/telegram-notifier-mcp` on npm
- Built with TypeScript using ES modules
- Uses pnpm for package management
- Supports Node.js 18+
- Main entry point: `dist/server.js` (compiled from TypeScript)