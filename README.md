# Bakalari MCP Server

A simple MCP (Model Context Protocol) server that lets you access Bakalari school system data.

## What is this?

This is a beginner-friendly server that connects to the Bakalari school system API and exposes tools for fetching school data like homeworks. It uses the Model Context Protocol to make this data available to AI assistants and other compatible clients.

## What You Need

- **Node.js** version 18 or newer
- **npm** (comes with Node.js)
- A Bakalari school account

## Setup Instructions

### 1. Install Dependencies

First, download all the required packages:

```bash
npm install
```

### 2. Configure Your Settings

Create a file named `.env` in the project root with your credentials:

```env
SCHOOL_URL=https://bakalari.yourschool.cz/
USERNAME=your_username
PASS=your_password
```

**Important:** Never share your `.env` file or commit it to version control!

### 3. Build the Project

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

### 4. Run the Server

Start the server:

```bash
node build/index.js
```

## Available Tools

### `get_homeworks`

Fetches homework assignments from Bakalari.

**Optional Parameters:**
- `from` - Start date in YYYY-MM-DD format (e.g., "2024-01-01")
- `to` - End date in YYYY-MM-DD format (e.g., "2024-12-31")

**Example:**
```json
{
  "from": "2024-11-01",
  "to": "2024-11-30"
}
```

## Project Structure

```
bakalari-mcp/
├── src/                  # Source code (TypeScript)
│   ├── index.ts         # Main server file
│   └── tools/           # Tool implementations
│       └── homeworks.ts # Homeworks tool
├── build/               # Compiled code (JavaScript)
├── .env                 # Your credentials (not in git)
├── package.json         # Project configuration
└── README.md           # This file
```

## How It Works

1. **Login:** The server reads your credentials from the `.env` file
2. **Authentication:** It logs into Bakalari and gets an access token
3. **Registration:** It registers available tools (like `get_homeworks`)
4. **Ready:** The server is now ready to handle requests from MCP clients

## Troubleshooting

**"Missing or empty environment variable"**
- Make sure you created a `.env` file with all required variables

**"Login failed"**
- Check that your SCHOOL_URL, USERNAME, and PASS are correct
- Make sure the school URL includes `https://` and ends with `/`

**TypeScript errors**
- Run `npm install` to make sure all dependencies are installed
- Make sure you're using Node.js version 18 or newer

## License

ISC License - see `package.json` for details
