# Universal MCP Filesystem Generator

**Generate progressive discovery APIs for ANY MCP server**

This generator works with any MCP server by querying via the MCP protocol instead of reading source code. It's implementation-agnostic and works with npm packages, Python servers, compiled binaries, or any MCP-compatible server.

## How It Works

1. **Start the MCP server** with the command you provide
2. **Query via MCP protocol** (`tools/list` request)
3. **Extract tool definitions** (names, descriptions, JSON Schema)
4. **Generate TypeScript API** with progressive discovery structure
5. **Auto-categorize tools** based on naming patterns

## Usage

### Chrome DevTools MCP (default)

```bash
pnpm run generate:universal
```

### Any npm-based MCP

```bash
pnpm run generate:universal npx -y @modelcontextprotocol/server-filesystem
```

### Python-based MCP

```bash
pnpm run generate:universal uvx mcp-server-git
```

### Local MCP server

```bash
pnpm run generate:universal node /path/to/your/mcp-server.js
```

### With custom output directory

```bash
OUTPUT_DIR=api-custom pnpm run generate:universal
```

### With custom server name

```bash
SERVER_NAME="My Custom MCP" pnpm run generate:universal
```

## What Gets Generated

### Full JSON Schema Support

The universal generator extracts the **complete JSON Schema** from the MCP server:

```typescript
// Generated from MCP protocol response
export const metadata = {
  name: 'navigate_page',
  description: 'Navigates the currently selected page to a URL.',
  parameters: ["type", "url", "ignoreCache", "timeout"],
  inputSchema: {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["url", "back", "forward", "reload"],
        "description": "Navigate the page by URL, back or forward in history, or reload."
      },
      "url": {
        "type": "string",
        "description": "Target URL (only type=url)"
      },
      // ... full schema
    }
  }
};
```

### Type-Safe Parameters

Generated functions have proper TypeScript types extracted from JSON Schema:

```typescript
export async function navigate_page(params: {
  type?: string;
  url?: string;
  ignoreCache?: boolean;
  timeout?: number;
}): Promise<any> {
  // ...
}
```

### Auto-Categorization

Tools are automatically organized by naming patterns:

- **navigation**: navigate, page, goto
- **input**: click, fill, type, drag, hover
- **debugging**: console, evaluate, screenshot, debug
- **network**: network, request
- **performance**: performance, trace, profile
- **emulation**: emulate, device, viewport
- **other**: anything else

## Examples

### Filesystem MCP

```bash
# Generate API for filesystem MCP
pnpm run generate:universal npx -y @modelcontextprotocol/server-filesystem /tmp

# Use the generated API
import { readFile } from './api-universal/files/read_file.js';
await readFile({ path: '/tmp/test.txt' });
```

### Git MCP

```bash
# Generate API for git MCP
pnpm run generate:universal uvx mcp-server-git --repository /path/to/repo

# Use the generated API
import { git_log } from './api-universal/git/git_log.js';
await git_log({ limit: 10 });
```

### Database MCP

```bash
# Generate API for postgres MCP
pnpm run generate:universal npx -y @modelcontextprotocol/server-postgres

# Use the generated API
import { query } from './api-universal/database/query.js';
await query({ sql: 'SELECT * FROM users LIMIT 10' });
```

## Advantages Over Source-Based Generation

| Aspect | Universal (Protocol) | Source-Based | Hand-Coded |
|--------|---------------------|--------------|------------|
| **Works with any MCP** | ✅ Yes | ❌ npm only | ❌ Manual |
| **Implementation agnostic** | ✅ Yes | ❌ JS/TS only | ❌ Per-tool |
| **Auto-updates** | ✅ Query live | ❌ Rebuild needed | ❌ Manual |
| **Python MCPs** | ✅ Yes | ❌ No | ❌ Manual |
| **Binaries** | ✅ Yes | ❌ No | ❌ Manual |
| **Custom MCPs** | ✅ Yes | ❌ Depends | ❌ Manual |
| **Full schemas** | ✅ JSON Schema | ⚠️ Partial | ❌ Simplified |

## Token Savings

The generated filesystem structure provides the same **96% token reduction** regardless of which MCP server you use:

- **Before**: Load all tool definitions via MCP (~17.5k tokens for Chrome DevTools)
- **After**: Progressive discovery (667 tokens for typical 2-tool task)

This works because the pattern is universal - only the tool definitions change, not the approach.

## Technical Details

### MCP Protocol Communication

```typescript
// 1. Start server
const server = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

// 2. Send tools/list request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

// 3. Parse response
{
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "description": "What it does",
        "inputSchema": { /* JSON Schema */ }
      }
    ]
  }
}
```

### JSON Schema to TypeScript

The generator converts JSON Schema types to TypeScript:

- `string` → `string`
- `number`, `integer` → `number`
- `boolean` → `boolean`
- `array` → `any[]`
- `object` → `Record<string, any>`

### Category Detection

Tools are categorized by analyzing their names:

```typescript
function categorizeTools(tools) {
  if (name.includes('navigate')) return 'navigation';
  if (name.includes('click')) return 'input';
  if (name.includes('console')) return 'debugging';
  // ... etc
}
```

## Limitations

- **Type precision**: Uses simplified TypeScript types (could be improved with json-schema-to-typescript)
- **Category detection**: Heuristic-based (might miscategorize some tools)
- **No nested schemas**: Flattens complex object types
- **No validation**: Generated functions don't validate parameters at runtime

## Future Enhancements

1. **Full TypeScript type generation** from JSON Schema using json-schema-to-typescript
2. **Runtime validation** with generated Zod schemas
3. **Better categorization** with LLM-based classification
4. **Documentation extraction** from schema descriptions
5. **IDE autocomplete** with JSDoc from schemas

## Comparison Table

| Generator | Input | Works With | Schema Accuracy | Maintenance |
|-----------|-------|-----------|-----------------|-------------|
| **Hand-coded** | Manual definitions | Chrome DevTools only | Simplified | Manual updates |
| **Source-based** | npm package internals | npm JS/TS packages | Good (if importable) | Rebuild on update |
| **Universal** | MCP protocol | ANY MCP server | Excellent (JSON Schema) | Query live server |

## Try It

```bash
# Chrome DevTools MCP
pnpm run generate:universal

# Browse the generated API
ls api-universal/

# See what was extracted
cat api-universal/index.ts
cat api-universal/navigation/navigate_page.ts
```

**This is the approach that scales to any MCP ecosystem.**
