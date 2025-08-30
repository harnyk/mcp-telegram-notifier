# Telegram Notifier MCP Server

A Model Context Protocol (MCP) server that enables AI agents to send messages via Telegram bot. Perfect for notifications, alerts, and real-time communication from your AI applications.

## Features

- 📱 Send messages to Telegram channels/chats via bot
- 🎨 Support for multiple formatting modes (Markdown, MarkdownV2, HTML)

## Quick Start

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command and follow instructions
3. Save the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Chat ID

**For personal messages:**
1. Message your bot first
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find the `chat.id` value

**For channels:**
1. Add your bot to the channel as admin
2. Send a message to the channel
3. Visit the same URL and find the `chat.id` (negative number for channels)

### 3. Install and Configure

```bash
# Install the package
npm install -g @harnyk/telegram-notifier-mcp

# Or clone and build locally
git clone <repository-url>
cd mcp-telegram-notifier
pnpm install
pnpm build
pnpm link
```

### 4. Add to Your MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "telegram-notifier": {
      "command": "node",
      "args": ["/path/to/mcp-telegram-notifier/dist/server.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_bot_token_here",
        "TELEGRAM_CHAT_ID": "your_chat_id_here"
      }
    }
  }
}
```

**Or using npx:**

```json
{
  "mcpServers": {
    "telegram-notifier": {
      "command": "npx",
      "args": ["-y", "@harnyk/telegram-notifier-mcp"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_bot_token_here", 
        "TELEGRAM_CHAT_ID": "your_chat_id_here"
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run type checking  
pnpm typecheck
```

## Configuration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "telegram-notifier": {
      "command": "node",
      "args": ["path/to/dist/server.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
        "TELEGRAM_CHAT_ID": "-1001234567890"
      }
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run `pnpm lint` and `pnpm typecheck`
6. Submit a pull request

## License

WTFPL - Do What the Fuck You Want to Public License
