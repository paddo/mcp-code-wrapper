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
npx mcp-code-wrapper .                # Current directory
npx mcp-code-wrapper /path/to/project # Specific project
npx mcp-code-wrapper --global         # Global ~/.claude/ MCPs
npx mcp-code-wrapper --help           # Show help

# Or clone and run locally
git clone https://github.com/paddo/mcp-code-wrapper
cd mcp-code-wrapper
pnpm install
pnpm run generate /path/to/project
```

### Usage

**Project Mode** (converts MCPs in a project):

```bash
npx mcp-code-wrapper .                # Current directory (interactive selection)
npx mcp-code-wrapper /path/to/project # Specific directory (interactive selection)
npx mcp-code-wrapper . --all          # Generate all servers without prompting
npx mcp-code-wrapper . --servers mssql-main,chrome-devtools  # Specific servers
```

**Interactive mode** (default):
- Shows list of available MCP servers
- Select which servers to generate wrappers for
- Useful when you only want specific MCPs

**All mode** (`--all` flag):
- Generates wrappers for all MCPs without prompting
- Useful for automation/scripts

What it does:
1. Discovers all MCP servers in `.mcp.json`
2. Prompts for server selection (unless `--all` flag)
3. Generates code wrappers in `.mcp-wrappers/`
4. Creates Claude Code Skills for each MCP
5. Disables MCPs (keeps config for executor)
6. Updates `.gitignore`

**Global Mode** (explicit flag required):

```bash
npx mcp-code-wrapper --global
```

Looks for `~/.claude/mcp.json` and generates wrappers in `~/.claude/.mcp-wrappers/`

### After Generation

**Restart Claude Code to load new Skills:**

```bash
claude -c
```

**⚠️ Important:** When Claude Code restarts and prompts to enable MCPs, **decline/toggle them OFF**. The Skills use progressive discovery - MCPs stay disabled and are spawned on-demand by the wrapper.

Skills will use `.mcp.json` config to spawn servers on-demand with progressive discovery.

### Verify Skills Are Loaded

After restarting, ask Claude what skills it has:

```
> what skills do you have?

I have access to three specialized skills:

1. mcp-chrome-devtools - Browser automation and testing
   - Navigate pages, fill forms, take screenshots
   - Inspect network traffic, debug JavaScript

2. mcp-mssql-dev - Database operations on 'app_dev' database
   - Execute SQL queries, read/write data
   - Manage tables and schemas

3. mcp-mssql-prod - Database operations on 'app_prod' database
   - Same SQL capabilities, production database
```

## Token Economics

### Real-World Example

**Before** (Direct MCP):
- Chrome DevTools: 26 tools = 17,500 tokens
- Database Server 1: 8 tools = 5,600 tokens
- Database Server 2: 8 tools = 5,600 tokens
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
    "database-server": {
      "type": "stdio",
      "command": "node",
      "args": [".mcp-server/dist/index.js"],
      "env": {
        "DB_HOST": "your-host",
        "DB_NAME": "your-database",
        "DB_USER": "your-user",
        "DB_PASSWORD": "***"
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
   - database-server

🔧 Generating wrapper for: chrome-devtools
   ✅ 26 tools in 7 categories
🎯 Creating Claude Code Skill wrapper...

🔧 Generating wrapper for: database-server
   ✅ 8 tools in 1 category
🎯 Creating Claude Code Skill wrapper...

✅ Generated wrappers for 2 MCP servers
📁 Output: /path/to/project/.mcp-wrappers/

🔕 Disabled 2 MCP servers in .mcp.json
🔕 Disabled MCPs in settings.local.json
   MCPs stay in .mcp.json for executor reference
   Restore with: npx mcp-code-wrapper --restore

⚠️  IMPORTANT: Restart Claude Code to load new Skills
   Run: claude -c
```

### 3. Generated Structure

```
/path/to/project/
├── .mcp.json                    # MCPs disabled (in-place)
├── .mcp-wrappers/               # Generated code wrappers
│   ├── chrome-devtools/
│   │   ├── navigation/
│   │   │   ├── navigate_page.ts
│   │   │   ├── take_screenshot.ts
│   │   │   └── index.ts
│   │   ├── debugging/
│   │   └── index.ts
│   └── database-server/
│       ├── queries/
│       │   ├── read_data.ts
│       │   ├── insert_data.ts
│       │   └── index.ts
│       └── index.ts
└── .claude/
    ├── settings.local.json      # MCPs disabled (in-place)
    └── skills/                  # Auto-generated Skills
        ├── mcp-chrome-devtools/
        │   ├── skill.json
        │   └── instructions.md
        └── mcp-database-server/
            ├── skill.json
            └── instructions.md
```

### 4. Progressive Discovery in Action

When you invoke a Skill:

```typescript
// Claude reads root index (100 tokens)
import * as db from './.mcp-wrappers/database-server/index.ts';
// Discovers: { queries: {...} }

// Explores category (50 tokens)
import * as queries from './.mcp-wrappers/database-server/queries/index.ts';
// Discovers: { read_data, insert_data, ... }

// Reads specific tool (200 tokens)
import { read_data } from './.mcp-wrappers/database-server/queries/read_data.ts';
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
✅ **Auto-normalized responses**: Runtime executor automatically unwraps MCP response formats

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

Remove all generated wrappers and Skills, re-enable MCPs:

```bash
# Restore current directory
npx mcp-code-wrapper --restore

# Restore specific project
npx mcp-code-wrapper --restore /path/to/project
```

This will:
- Remove `.mcp-wrappers/` directory
- Remove all `mcp-*` Skills from `.claude/skills/`
- Re-enable MCPs in `.mcp.json` (removes `"disabled": true`)
- Re-enable MCPs in `.claude/settings.local.json`

**No backup files created** - operates on config in-place to avoid accidentally committing secrets.

### Keep MCPs Enabled

By default, MCPs are disabled after wrapper generation. To keep them enabled:

```bash
npx mcp-code-wrapper /path/to/project --no-disable
```

This generates wrappers but leaves MCPs active in both `.mcp.json` and `.claude/settings.local.json`.

### Generate All Without Prompting

To skip interactive server selection and generate all at once:

```bash
npx mcp-code-wrapper /path/to/project --all
```

This is useful for automation, CI/CD, or when you always want all MCPs wrapped.

### Generate Specific Servers

To generate wrappers for specific servers without prompting:

```bash
npx mcp-code-wrapper /path/to/project --servers mssql-main,chrome-devtools
```

This is useful when you:
- Only want specific MCPs wrapped
- Are automating wrapper generation in scripts
- Want to regenerate just one server without interactive prompts

### Generate for Specific MCP

```bash
# Traditional command mode (for testing)
pnpm run generate --from-mcp-json /path/to/.mcp.json --server database-server
```

### Generate with Custom Environment

```bash
DB_HOST=your-host DB_NAME=your-database pnpm run generate node /path/to/mcp-server.js
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
