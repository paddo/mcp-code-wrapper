# MCP Code Wrapper - Usage Guide

Generate code execution wrappers for MCP servers with automatic progressive discovery.

## Quick Start

### Project Mode (Recommended)

Point the generator at any project with a `.mcp.json`:

```bash
pnpm run generate /path/to/project
```

**What it does:**
- Discovers all MCP servers in `.mcp.json`
- Generates code wrappers in `.mcp-wrappers/`
- Creates Claude Code Skills for each MCP
- Updates `.gitignore` to exclude generated code
- Shows restart instructions

**Output:**
```
/path/to/project/
├── .mcp.json                          # Your existing config
├── .mcp-wrappers/                     # Generated wrappers
│   ├── chrome-devtools/               # 26 tools, 7 categories
│   ├── database-server-1/             # 8 database tools
│   └── database-server-2/             # 8 database tools
└── .claude/
    └── skills/                        # Generated Skills
        ├── mcp-chrome-devtools/
        ├── mcp-database-server-1/
        └── mcp-database-server-2/
```

### Global Mode

Generate wrappers for globally configured MCPs:

```bash
pnpm run generate --global
# or just:
pnpm run generate
```

**What it does:**
- Looks for `~/.claude/mcp.json` or `~/.claude/.mcp.json`
- Generates wrappers in `~/.claude/.mcp-wrappers/`
- Creates global Skills in `~/.claude/skills/`

### Disable MCPs After Import

Optionally disable MCP servers after generating wrappers:

```bash
pnpm run generate /path/to/project --disable-mcps
```

**What it does:**
- Backs up `.mcp.json` to `.mcp.json.backup`
- Adds `"disabled": true` to all MCP servers
- MCPs stop loading, Skills take over
- Restore with: `mv .mcp.json.backup .mcp.json`

## Advanced Usage

### Generate for Specific MCP

```bash
pnpm run generate --from-mcp-json /path/to/.mcp.json --server database-server
```

### Generate with Custom Command

```bash
pnpm run generate npx -y your-mcp-package --env "DB_HOST=your-host,DB_NAME=your-database"
```

### Generate with Environment Variables

```bash
DB_HOST=your-host DB_NAME=your-database pnpm run generate node /path/to/mcp-server.js
```

## After Generation

### 1. Restart Claude Code

**IMPORTANT:** Skills are only loaded on startup.

```bash
claude -c
```

### 2. Skills Redirect to Wrappers

When you invoke a Skill (e.g., `/mcp-database-server`), Claude will:
1. Read the Skill instructions
2. Explore `.mcp-wrappers/database-server/index.ts`
3. Navigate to tool categories
4. Read specific tool files on-demand
5. Use the generated API

### 3. Progressive Discovery in Action

**Before** (Direct MCP):
- All 26 Chrome DevTools tool definitions: **17,500 tokens**
- All 8 Database Server 1 tool definitions: **5,600 tokens**
- All 8 Database Server 2 tool definitions: **5,600 tokens**
- **Total: 28,700 tokens (14.5% of context)**

**After** (Progressive Discovery):
- Root index: ~100 tokens
- Category index: ~50 tokens
- 2 tool definitions: ~400 tokens
- **Total: ~550 tokens**
- **Savings: 98%** (28,150 tokens freed)

## Token Economics

| MCP Server | Tools | Direct Load | Progressive (2 tools) | Savings |
|------------|-------|-------------|----------------------|---------|
| Chrome DevTools | 26 | 17,500 tokens | ~650 tokens | 96% |
| Database (x2) | 16 | 11,200 tokens | ~900 tokens | 92% |
| **Total** | 42 | **28,700 tokens** | **~1,550 tokens** | **95%** |

Even using 10 tools from multiple MCPs still saves ~90% of context.

## Workflow Comparison

### Without Code Wrapper (Direct MCP)

```
Session Start
└─ Load ALL tool definitions (28.7k tokens)
   └─ Use 2 tools
      └─ 26.7k tokens wasted on unused tools
```

### With Code Wrapper (Progressive Discovery)

```
Session Start
└─ Load Skills (50 tokens)
   └─ Read root index (100 tokens)
      └─ Navigate to category (50 tokens)
         └─ Read 2 tool files (400 tokens)
            └─ Use tools (550 tokens total)
```

## Skills Integration

Generated Skills point to the wrappers:

```typescript
// .claude/skills/mcp-database-server/instructions.md
import { read_data } from './.mcp-wrappers/database-server/queries/read_data.js';

const result = await read_data({
  query: 'SELECT * FROM users LIMIT 10'
});
```

Claude explores the filesystem progressively:
1. Skill invoked → reads instructions
2. Discovers wrapper location
3. Reads index to see categories
4. Navigates to relevant category
5. Reads only the tools it needs

## Troubleshooting

### "No .mcp.json found"

**Project mode:** Ensure `.mcp.json` exists in the project root.

**Global mode:** Create `~/.claude/mcp.json` with your global MCP config:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    }
  }
}
```

### "Skills not loading"

Did you restart Claude Code?

```bash
claude -c
```

### "Wrappers not working"

The executor needs to be configured to read from `mcp-config.json`. This is currently implemented but requires the executor to be run in the project directory.

## Files Generated

### Code Wrappers

```typescript
// .mcp-wrappers/<server>/<category>/<tool>.ts
export async function tool_name(params: { ... }): Promise<any> {
  throw new Error('This function should be called through the MCP executor');
}

export const metadata = {
  name: 'tool_name',
  description: '...',
  inputSchema: { ... }
};
```

### Skills

```
.claude/skills/mcp-<server>/
├── skill.json           # Metadata
└── instructions.md      # Usage guide
```

### Config Files (When not using .mcp.json)

```json
// mcp-config.json
{
  "command": "node",
  "args": [".mcp-server/dist/index.js"],
  "description": "MCP server configuration"
}
```

```bash
# .env (secrets, gitignored)
DB_HOST=your-host
DB_NAME=your-database
DB_USER=your-user
DB_PASSWORD=***
```

## Examples

### Convert All MCPs in a Project

```bash
cd /Users/paddo/Projects/mcp-code-wrapper
pnpm run generate /path/to/your-project
```

Output:
```
🔍 Discovering MCP servers in /path/to/your-project
✅ Found /path/to/your-project/.mcp.json
📦 Discovered 3 MCP servers:
   - chrome-devtools
   - database-server-1
   - database-server-2

🔧 Generating wrapper for: chrome-devtools
   ✅ 26 tools in 7 categories
🎯 Creating Claude Code Skill wrapper...

🔧 Generating wrapper for: database-server-1
   ✅ 8 tools in 1 category
🎯 Creating Claude Code Skill wrapper...

🔧 Generating wrapper for: database-server-2
   ✅ 8 tools in 1 category
🎯 Creating Claude Code Skill wrapper...

✅ Generated wrappers for 3 MCP servers
📝 Updated .gitignore

⚠️  IMPORTANT: Restart Claude Code to load new Skills
   Run: claude -c
```

### Generate with MCP Disabling

```bash
pnpm run generate /path/to/project --disable-mcps
```

This creates wrappers AND disables the original MCPs, forcing all tool calls through the progressive discovery wrappers.

## Why This Matters

**Context is expensive:**
- Loading 3 MCPs = 28.7k tokens (14.5% of 200k context)
- Add more MCPs → easily hit 50k+ tokens
- Leaves less room for actual work

**Progressive discovery:**
- Load only what you need
- 95%+ token savings
- Same functionality, better context efficiency
- Skills provide seamless integration
