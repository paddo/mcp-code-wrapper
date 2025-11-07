# Claude Code Integration

How to use this MCP code execution wrapper with Claude Code for maximum context efficiency.

## Setup

1. **Generate the filesystem structure**
   ```bash
   pnpm run generate
   ```

2. **Create a slash command** (`~/.claude/commands/chrome-code.md`)
   ```markdown
   ---
   allowed-tools:
     - Bash(node:*)
     - Bash(pnpm:*)
     - Read(/Users/paddo/Projects/mcp-code-wrapper/**)
   description: Execute browser automation code via progressive MCP discovery
   ---

   Execute browser automation using the Chrome DevTools code execution API.

   ## Steps:

   1. **Understand the task**: What does the user want to automate?

   2. **Guide progressive discovery**:
      - Tell the user to read `api/index.ts` to see categories
      - Based on the task, suggest which category to explore
      - Point to specific tool files as needed

   3. **Help write code**:
      - User writes TypeScript code using the `api` object
      - Example: `await api.navigation.navigate_page('http://localhost:4321')`

   4. **Execute via the wrapper**:
      ```bash
      cd /Users/paddo/Projects/mcp-code-wrapper
      pnpm run dev
      ```

   USER REQUEST: $*
   ```

## Usage Patterns

### Pattern 1: Guided Discovery

```text
User: I need to test my login page
Claude: Let me help you discover the right tools. First, read api/index.ts to see available categories.
User: [reads index, sees 'input' and 'navigation' categories]
Claude: Perfect. For login testing, you'll want:
  1. api/navigation/navigate_page.ts - to load the page
  2. api/input/fill.ts - to enter credentials
  3. api/input/click.ts - to submit the form

Read those files, then we'll write code to test the flow.
```

### Pattern 2: Direct Code Execution

```text
User: /chrome-code test the homepage at localhost:4321
Claude: [provides code that uses progressive discovery]
```typescript
// Read api/index.ts to discover categories
// Read api/navigation/navigate_page.ts for navigation
// Read api/debugging/take_screenshot.ts for screenshots

const result = await api.navigation.navigate_page('http://localhost:4321');
const messages = await api.debugging.list_console_messages();
const screenshot = await api.debugging.take_screenshot({ fullPage: true });

// Filter errors locally
const errors = messages.filter(m => m.level === 'error');

return {
  success: errors.length === 0,
  errors,
  screenshot
};
```
```

### Pattern 3: Context-Aware Workflow

```text
User: Debug the checkout flow
Claude: I'll set up progressive discovery for e-commerce testing.

Step 1: Read api/index.ts → discover 'input', 'navigation', 'debugging'
Step 2: Read api/navigation/ tools → understand navigation API
Step 3: Read api/input/ tools → understand form interaction
Step 4: Write code that tests the full checkout flow

[Only loads ~1000 tokens instead of 6k+ for all MCP tools]
```

## Token Budgeting

When planning with Claude Code, estimate token usage:

**Traditional MCP approach:**
- Chrome DevTools MCP: 6,022 tokens
- Your task code: ~200 tokens
- **Total: ~6,200 tokens**

**Progressive discovery approach:**
- Root index read: 279 tokens
- Category exploration: 87 tokens
- 3 tool reads: ~384 tokens
- User code: ~200 tokens
- **Total: ~950 tokens**

**Savings: ~5,250 tokens (85%)**

## System Prompt for Claude

When using this with Claude Code, include in your `.claude/CLAUDE.md`:

```markdown
## Chrome DevTools Automation

When automating browser tasks, use progressive discovery pattern:

1. **Discover categories**: Read `/Users/paddo/Projects/mcp-code-wrapper/api/index.ts`
2. **Explore category**: Read category index (e.g., `api/navigation/index.ts`)
3. **Learn tools**: Read specific tool files as needed
4. **Write code**: Use `api.{category}.{tool}()` pattern
5. **Execute**: Run via `cd /Users/paddo/Projects/mcp-code-wrapper && pnpm run dev`

This saves ~85% of context vs loading all MCP tools upfront.
```

## Example Session

```text
User: Test the blog homepage for errors

Claude: I'll use progressive discovery to minimize context usage.

[Reads api/index.ts - 279 tokens]
I see 6 categories. For error testing, I need navigation and debugging.

[Reads api/navigation/index.ts - 87 tokens]
[Reads api/navigation/navigate_page.ts - 127 tokens]
[Reads api/debugging/list_console_messages.ts - 129 tokens]

Now I'll write code to navigate and check for errors:

[Writes test code - 150 tokens]

Total context used: ~770 tokens (vs 6,200 with direct MCP)

Claude: Executing the test now...
[Runs pnpm run dev with the user code]

Results: ✅ No errors found on homepage
```

## Advanced: Multi-Tool Workflows

For complex workflows, chain multiple tools efficiently:

```typescript
// Performance test workflow
await api.performance.performance_start_trace();
await api.navigation.navigate_page(url);
const trace = await api.performance.performance_stop_trace();
const insights = await api.performance.performance_analyze_insight(trace);

// E-commerce test workflow
await api.navigation.navigate_page('http://localhost:3000/shop');
await api.input.click('[data-testid="product-1"]');
await api.input.click('button:has-text("Add to Cart")');
await api.navigation.wait_for('[data-testid="cart-count"]');
const cartCount = await api.debugging.evaluate_script(
  'document.querySelector("[data-testid=cart-count]").textContent'
);

return { success: cartCount === '1' };
```

## Troubleshooting

### "Can't find api directory"
Run `pnpm run generate` first to create the filesystem structure.

### "MCP connection failed"
Ensure Chrome DevTools MCP is installed: `pnpm install`

### "Tool not found"
Check the tool exists in the generated `api/` directory. Run `pnpm run generate` to regenerate if needed.

### "Type errors in user code"
This is expected - the generated types are basic. Focus on runtime correctness for now.

## Tips

1. **Read selectively**: Only load tool docs you actually need
2. **Process locally**: Filter/transform data in your code, not in Claude's context
3. **Measure impact**: Use `pnpm run measure` to see token savings
4. **Compare approaches**: Try both direct MCP and code execution to feel the difference
5. **Document learnings**: Add findings to FINDINGS.md as you experiment
