# MCP Code Wrapper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/mcp-code-wrapper.svg)](https://www.npmjs.com/package/mcp-code-wrapper)
[![GitHub issues](https://img.shields.io/github/issues/paddo/mcp-code-wrapper)](https://github.com/paddo/mcp-code-wrapper/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Transform MCP tool definitions into progressive discovery APIs (96% context savings)**

Generate code execution wrappers for Model Context Protocol servers with automatic progressive tool discovery. Reduces context usage by up to 96% while maintaining full MCP functionality.

## The Problem

Loading MCP servers directly into Claude Code bloats context with ALL tool definitions:

```
Chrome DevTools MCP:    17,500 tokens (26 tools)
MSSQL Database (×2):    11,200 tokens (16 tools)
─────────────────────────────────────────────
Total:                  28,700 tokens (14.5% of 200k context)
```

With 3-4 MCP servers, you easily hit 50k+ tokens before doing any actual work.

## The Solution

**Progressive Discovery via Filesystem Structure**

Instead of loading all tools upfront, present them as a TypeScript API filesystem that Claude explores on-demand:

```
api-universal/
├── index.ts              # Root discovery (~100 tokens)
├── navigation/           # 6 tools
│   ├── navigate_page.ts  # Load only when needed
│   └── index.ts
├── debugging/            # 5 tools
└── ...
```

**Claude reads only what it needs:**
1. Read root index → discover categories
2. Explore category → see available tools
3. Read specific tools → get documentation
4. Use the APIs → execute via MCP

**Result**: ~550 tokens for a typical 2-tool task (vs 28,700 tokens)

## Quick Start

### Install

```bash
# Via npx (no install needed)
npx mcp-code-wrapper /path/to/project

# Or clone and run locally
git clone https://github.com/paddo/mcp-code-wrapper
cd mcp-code-wrapper
pnpm install
pnpm run generate /path/to/project
```

### Usage

**Project Mode** (converts all MCPs in a project):

```bash
npx mcp-code-wrapper /Users/me/my-project
```

What it does:
1. Discovers all MCP servers in `.mcp.json`
2. Generates code wrappers in `.mcp-wrappers/`
3. Creates Claude Code Skills for each MCP
4. Disables MCPs (keeps config for executor)
5. Updates `.gitignore`

**Global Mode** (converts globally configured MCPs):

```bash
npx mcp-code-wrapper
# or
npx mcp-code-wrapper --global
```

Looks for `~/.claude/mcp.json` and generates wrappers in `~/.claude/.mcp-wrappers/`

### After Generation

**Restart Claude Code to load new Skills:**

```bash
claude -c
```

Skills will use `.mcp.json` config to spawn servers on-demand with progressive discovery.

## Token Economics

### Real-World Example (famecake project)

**Before** (Direct MCP):
- Chrome DevTools: 26 tools = 17,500 tokens
- MSSQL-main: 8 tools = 5,600 tokens
- MSSQL-media: 8 tools = 5,600 tokens
- **Total: 28,700 tokens (14.5% of context)**

**After** (Progressive Discovery):
- Root indexes: ~200 tokens
- 2 tool definitions: ~350 tokens
- **Total: ~550 tokens**
- **Savings: 98%** (28,150 tokens freed)

### Scalability

| Workflow | Tools Used | Direct MCP | Progressive | Savings |
|----------|-----------|------------|-------------|---------|
| Simple task | 2 tools | 28,700 tokens | 550 tokens | **98%** |
| Medium task | 5 tools | 28,700 tokens | 950 tokens | **97%** |
| Complex task | 10 tools | 28,700 tokens | 1,650 tokens | **94%** |

**Even complex workflows save 90%+ of context.**

## How It Works

### 1. Add MCPs to Your Project

```json
// .mcp.json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    },
    "mssql-main": {
      "type": "stdio",
      "command": "node",
      "args": [".mcp-server/dist/index.js"],
      "env": {
        "SERVER_NAME": "localhost",
        "DATABASE_NAME": "mydb",
        "SQL_USER": "sa",
        "SQL_PASSWORD": "***"
      }
    }
  }
}
```

### 2. Generate Wrappers

```bash
npx mcp-code-wrapper /path/to/project
```

Output:
```
🔍 Discovering MCP servers in /path/to/project
✅ Found .mcp.json

📦 Discovered 2 MCP servers:
   - chrome-devtools
   - mssql-main

🔧 Generating wrapper for: chrome-devtools
   ✅ 26 tools in 7 categories
🎯 Creating Claude Code Skill wrapper...

🔧 Generating wrapper for: mssql-main
   ✅ 8 tools in 1 category
🎯 Creating Claude Code Skill wrapper...

✅ Generated wrappers for 2 MCP servers
📁 Output: /path/to/project/.mcp-wrappers/

💾 Created backup: .mcp.json.backup
🔕 Disabled 2 MCP servers
   MCPs stay in .mcp.json for executor reference

⚠️  IMPORTANT: Restart Claude Code to load new Skills
   Run: claude -c
```

### 3. Generated Structure

```
/path/to/project/
├── .mcp.json                    # MCPs disabled, config preserved
├── .mcp.json.backup             # Original config (restore if needed)
├── .mcp-wrappers/               # Generated code wrappers
│   ├── chrome-devtools/
│   │   ├── navigation/
│   │   │   ├── navigate_page.ts
│   │   │   ├── take_screenshot.ts
│   │   │   └── index.ts
│   │   ├── debugging/
│   │   └── index.ts
│   └── mssql-main/
│       ├── other/
│       │   ├── read_data.ts
│       │   ├── insert_data.ts
│       │   └── index.ts
│       └── index.ts
└── .claude/
    └── skills/                  # Auto-generated Skills
        ├── mcp-chrome-devtools/
        │   ├── skill.json
        │   └── instructions.md
        └── mcp-mssql-main/
            ├── skill.json
            └── instructions.md
```

### 4. Progressive Discovery in Action

When you invoke a Skill:

```typescript
// Claude reads root index (100 tokens)
import * as mssql from './.mcp-wrappers/mssql-main/index.ts';
// Discovers: { other: {...} }

// Explores category (50 tokens)
import * as other from './.mcp-wrappers/mssql-main/other/index.ts';
// Discovers: { read_data, insert_data, ... }

// Reads specific tool (200 tokens)
import { read_data } from './.mcp-wrappers/mssql-main/other/read_data.ts';
// Gets full documentation and API

// Uses tool
const result = await read_data({ query: 'SELECT * FROM users' });
```

**Total**: 350 tokens (vs 5,600 tokens loading all tools)

## Key Features

✅ **Universal**: Works with ANY MCP server (npm, Python, binaries, custom)
✅ **Auto-discovery**: Finds all MCPs in `.mcp.json` automatically
✅ **Skills integration**: Auto-generates Claude Code Skills
✅ **Config preservation**: Disables MCPs but keeps config for executor
✅ **Token efficient**: 96%+ context savings
✅ **Git-safe**: Auto-updates `.gitignore` for generated code
✅ **No secrets committed**: Env vars stay in `.mcp.json` (not tracked)

## Use Cases

### 1. Multi-Database Projects

Convert multiple database MCPs without context bloat:

```bash
# Project with 3 database connections
npx mcp-code-wrapper /path/to/project

# Before: 3 databases × 5.6k tokens = 16.8k tokens
# After: Root + 3 tools = ~800 tokens
# Savings: 95%
```

### 2. Browser Automation

Use Chrome DevTools MCP without loading all 26 tools:

```bash
# Before: 17.5k tokens
# After (using 2 tools): 650 tokens
# Savings: 96%
```

### 3. Global MCP Management

Convert all your global MCPs once:

```bash
npx mcp-code-wrapper --global

# Skills available in all projects
# MCPs disabled globally
# Context savings across all sessions
```

## Advanced Usage

### Restore Original MCPs

```bash
cd /path/to/project
mv .mcp.json.backup .mcp.json
claude -c
```

### Generate for Specific MCP

```bash
# Traditional command mode (for testing)
pnpm run generate --from-mcp-json /path/to/.mcp.json --server mssql-main
```

### Generate with Custom Environment

```bash
SERVER_NAME=localhost DATABASE_NAME=test pnpm run generate node /path/to/mcp-server.js
```

## Project Structure

```
mcp-code-wrapper/
├── src/
│   ├── cli.ts                    # npx entry point
│   ├── generator-universal.ts    # Universal MCP generator
│   ├── executor.ts               # MCP client & code executor
│   ├── measure-tokens.ts         # Token comparison tool
│   └── index.ts                  # Demo workflow
├── USAGE.md                      # Detailed usage guide
├── FINDINGS.md                   # Experiment analysis
├── CONTEXT.md                    # Project context
└── UNIVERSAL_GENERATOR.md        # Technical details
```

## Documentation

- **[USAGE.md](./USAGE.md)** - Complete usage guide with examples
- **[FINDINGS.md](./FINDINGS.md)** - Experiment results and analysis
- **[CONTEXT.md](./CONTEXT.md)** - Project overview and next steps
- **[UNIVERSAL_GENERATOR.md](./UNIVERSAL_GENERATOR.md)** - How the generator works

## Workflow Comparison

### Without Code Wrapper

```
Session Start
└─ Load all MCP tool definitions (28.7k tokens)
   └─ Use 2 tools
      └─ 26.7k tokens wasted on unused tools
```

### With Code Wrapper

```
Session Start
└─ Load Skills (50 tokens)
   └─ Read root index (100 tokens)
      └─ Navigate to category (50 tokens)
         └─ Read 2 tool files (350 tokens)
            └─ Use tools
Total: 550 tokens (98% savings)
```

## Requirements

- Node.js 18+
- Claude Code (for Skills integration)
- Project with `.mcp.json` or global `~/.claude/mcp.json`

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

This is an experimental project. See [CONTEXT.md](./CONTEXT.md) for current status and next steps.

## License

MIT

## Related Work

- [MCP Context Isolation](https://paddo.dev/blog/mcp-context-isolation) - Infrastructure-level solution
- [Skills Controllability](https://paddo.dev/blog/claude-code-skills-lack-invocation-control) - Why Skills need explicit control
- [Stop Speedrunning Claude Code](https://paddo.dev/blog/stop-speedrunning-claude-code) - Context discipline matters

## Credits

Built by [@paddo](https://github.com/paddo) based on Anthropic's [code execution pattern](https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/code_execution_via_mcp).
