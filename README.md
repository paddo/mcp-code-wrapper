# MCP Code Execution Wrapper

**Experimental implementation of Anthropic's code execution with MCP pattern**

This project explores progressive tool discovery for Chrome DevTools MCP, addressing the context bloat problem documented in [Isolating MCP Context in Claude Code](https://paddo.dev/blog/claude-code-mcp-context-isolation).

## The Problem

Chrome DevTools MCP loads **17,500 tokens** of tool definitions upfront before you use any tools (measured via `/context` in Claude Code). With multiple MCP servers, you can easily consume 50k+ tokens just from schemas, leaving limited context for actual coding tasks.

## The Solution (Proposed by Anthropic)

Instead of loading all tool definitions upfront, present MCP tools as a **filesystem of code APIs**. Claude explores the structure progressively, reading only the tools it needs.

## This Implementation

### Generated Filesystem Structure

```
api/
├── index.ts                    # Root discovery (~100 tokens)
├── input/                      # 8 tools
│   ├── click.ts
│   ├── fill.ts
│   └── ...
├── navigation/                 # 6 tools
│   ├── navigate_page.ts
│   ├── take_screenshot.ts
│   └── ...
├── debugging/                  # 5 tools
├── performance/                # 3 tools
├── network/                    # 2 tools
└── emulation/                  # 2 tools
```

### Token Economics

**Before (Direct MCP):**
- Tool definitions: 17,500 tokens upfront (measured via `/context` in Claude Code)
- Average per tool: ~673 tokens (ranging from 580-830 tokens)
- Total for simple task: ~17,700 tokens

**After (Code Execution):**
- Root index: 279 tokens
- Category exploration: 87 tokens
- Tool documentation (2 tools): ~256 tokens (concise TypeScript docs)
- User code execution: 45 tokens
- **Total for simple task: 667 tokens**

**Savings: 96.2% reduction in context usage**

## How It Works

1. **Progressive Discovery**: Claude reads the filesystem structure to discover available tools
2. **On-Demand Loading**: Only reads documentation for tools it actually needs
3. **Code Execution**: Writes code that calls API functions
4. **MCP Mapping**: Executor intercepts calls and maps them to actual MCP tool invocations

## Usage

### Generate Filesystem Structure

```bash
# Generate from Chrome DevTools MCP (default)
pnpm run generate

# Or from any other MCP server
pnpm run generate npx -y @modelcontextprotocol/server-filesystem /tmp
```

This creates the `api-universal/` directory with TypeScript files for all MCP tools.

**Works with ANY MCP server** - uses the MCP protocol to extract tool definitions.

### Run Test

```bash
pnpm run dev
```

This starts the MCP client, demonstrates progressive discovery, and executes example code.

### Example Workflow

```typescript
// 1. Claude reads api/index.ts to discover categories
// Discovers: input, navigation, debugging, performance, network, emulation

// 2. Claude reads api/navigation/index.ts to see available navigation tools
// Discovers: navigate_page, new_page, close_page, etc.

// 3. Claude reads api/navigation/navigate_page.ts for detailed docs
// Learns: function signature, parameters, usage

// 4. Claude writes code using the discovered APIs
const result = await api.navigation.navigate_page('http://localhost:4321');
const screenshot = await api.debugging.take_screenshot({ fullPage: true });

// 5. Executor maps these calls to actual MCP tool invocations
// Returns results back to Claude
```

## Project Structure

- `src/generator.ts` - Generates filesystem structure from tool definitions
- `src/executor.ts` - MCP client and code execution environment
- `src/index.ts` - Main entry point for testing
- `api/` - Generated filesystem structure (gitignored)

## Testing the Theory

This implementation lets us answer key questions:

1. **Does progressive discovery actually save tokens?** (Measure it)
2. **Can Claude effectively navigate the filesystem?** (Test it)
3. **What's the overhead of code execution?** (Benchmark it)
4. **Is the complexity worth it?** (Evaluate tradeoffs)

## Limitations

- Simplified parameter mapping (production would need full schema introspection)
- No sandboxing (would need VM isolation for security)
- Single-threaded execution (production would need concurrency)
- No state persistence (filesystem storage needed for multi-turn tasks)

## Next Steps

1. Test with real Claude Code integration
2. Measure actual token savings in practice
3. Add proper TypeScript type definitions
4. Implement sandboxing for security
5. Add state persistence for complex workflows
6. Document findings for blog post

## Related Posts

- [Isolating MCP Context in Claude Code with Slash Commands](https://paddo.dev/blog/claude-code-mcp-context-isolation) - The context bloat problem
- [Stop Speedrunning Claude Code](https://paddo.dev/blog/stop-speedrunning-claude-code) - Context engineering fundamentals
- [Claude Skills: The Controllability Problem](https://paddo.dev/blog/claude-skills-controllability-problem) - Explicit control over tools

## License

MIT
