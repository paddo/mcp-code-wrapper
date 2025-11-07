# Design Questions: 1:1 Mapping vs Higher-Level Wrappers

## The Question

Should the code execution API expose:
1. **1:1 mapping** to MCP tools (primitives like `navigate_page`, `take_screenshot`)
2. **Higher-level wrappers** (workflows like `testPageHealth`, `loginAndVerify`)
3. **Hybrid approach** (both primitives and common workflows)

## Detailed Comparison

### Approach 1: 1:1 Mapping (Current Implementation)

**Example:**
```typescript
// User writes this code
await api.navigation.navigate_page('http://localhost:4321');
const messages = await api.debugging.list_console_messages();
const errors = messages.content.filter(m => m.level === 'error');
const screenshot = await api.debugging.take_screenshot({ fullPage: true });

return { errors, screenshot };
```

**Token Economics:**
- Root index: 279 tokens
- Navigation index: 87 tokens
- `navigate_page.ts`: 127 tokens
- `list_console_messages.ts`: 129 tokens
- `take_screenshot.ts`: 129 tokens
- User code: ~150 tokens
- **Total: ~900 tokens**

**Pros:**
- ✅ Maximum flexibility - compose any way you want
- ✅ True progressive discovery - load exactly what you need
- ✅ Easy to generate - auto-generated from MCP schema
- ✅ No hidden magic - what you see is what you get
- ✅ Mirrors MCP directly - familiar to MCP users

**Cons:**
- ❌ Repeated boilerplate for common patterns
- ❌ Claude writes more code
- ❌ Learning curve - need to understand multiple primitives
- ❌ Error-prone - easy to forget steps (wait for navigation, etc.)

---

### Approach 2: Higher-Level Wrappers

**Example:**
```typescript
// User writes this code
const result = await api.testing.checkPageHealth('http://localhost:4321', {
  captureScreenshot: true,
  checkConsoleErrors: true,
  checkNetworkErrors: true,
});

return result; // { errors, screenshot, networkIssues }
```

**Token Economics:**
- Root index: 279 tokens
- Testing index: ~100 tokens
- `checkPageHealth.ts`: ~400 tokens (needs to document all the internal logic)
- User code: ~80 tokens
- **Total: ~860 tokens**

**Pros:**
- ✅ Less user code - common patterns built-in
- ✅ Best practices encoded (wait for nav, error handling)
- ✅ Domain-specific language (testing, forms, performance)
- ✅ Fewer files to read for common tasks

**Cons:**
- ❌ Opinionated - might not fit every use case
- ❌ Less flexible - can't customize internal steps
- ❌ Harder to maintain - hand-written, not auto-generated
- ❌ Token savings unclear - wrapper docs are longer
- ❌ Abstracts away MCP - don't learn the underlying API

---

### Approach 3: Hybrid (Primitives + Workflows)

**Structure:**
```
api/
├── index.ts                    # Discover both primitives and workflows
├── primitives/                 # Auto-generated 1:1 MCP mapping
│   ├── navigation/
│   │   ├── navigate_page.ts
│   │   ├── new_page.ts
│   │   └── ...
│   ├── debugging/
│   │   ├── take_screenshot.ts
│   │   ├── evaluate_script.ts
│   │   └── ...
│   └── input/
│       ├── click.ts
│       ├── fill.ts
│       └── ...
└── workflows/                  # Hand-written common patterns
    ├── testing/
    │   ├── checkPageHealth.ts
    │   └── testLoginFlow.ts
    ├── forms/
    │   └── fillAndSubmit.ts
    └── performance/
        └── recordAndAnalyze.ts
```

**Example Usage:**

**Common task (use workflow):**
```typescript
// Read api/index.ts → discover workflows/testing
// Read workflows/testing/checkPageHealth.ts
const result = await api.workflows.testing.checkPageHealth(url);
// Total: ~860 tokens
```

**Custom task (use primitives):**
```typescript
// Read api/index.ts → discover primitives
// Read primitives/navigation/, primitives/debugging/
await api.primitives.navigation.navigate_page(url);
const title = await api.primitives.debugging.evaluate_script('document.title');
// Total: ~900 tokens (but you can do anything)
```

**Pros:**
- ✅ Best of both worlds
- ✅ Common tasks are efficient
- ✅ Custom tasks are possible
- ✅ Progressive disclosure still works
- ✅ Can evolve workflows based on usage patterns

**Cons:**
- ❌ More complex structure
- ❌ Need to maintain workflows manually
- ❌ Harder to document (two ways to do things)
- ❌ Risk of confusion (which should I use?)

---

## Token Economics Comparison

| Scenario | 1:1 Primitives | High-Level Wrappers | Hybrid |
|----------|---------------|---------------------|--------|
| **Simple task (2 tools)** | 667 tokens | 860 tokens | 860 tokens (use workflow) |
| **Common workflow (5 tools)** | 1,031 tokens | 860 tokens | 860 tokens (use workflow) |
| **Custom workflow (5 tools)** | 1,031 tokens | Not possible (or awkward) | 1,031 tokens (use primitives) |
| **Complex unique task (10 tools)** | 1,646 tokens | Not possible | 1,646 tokens (use primitives) |

**Observation:** Wrappers save tokens for common patterns but lose flexibility. Hybrid lets you choose based on the task.

---

## Anthropic's Guidance

From the article:
> "Agents discover available tools by exploring a filesystem structure organized by server"

This suggests 1:1 mapping.

But also:
> "Agents maintain progress across executions using filesystem storage and can develop reusable code 'skills' for future tasks"

This suggests workflows can emerge over time.

**Interpretation:** Start with primitives, let agents write wrappers as needed and persist them for reuse.

---

## Real-World Analogy

### 1:1 Primitives = Standard Library
- `fs.readFile()`, `fs.writeFile()`, `fs.mkdir()`
- Flexible but verbose
- Compose as needed

### Higher-Level Wrappers = Framework
- `saveUserData(user)` (internally handles validation, serialization, file writes, error handling)
- Convenient but opinionated
- Harder to customize

### Hybrid = Library + Framework
- Use framework for common cases
- Drop to standard library when needed
- Best of both worlds (if complexity is justified)

---

## Recommendation

### For This Experiment: Keep 1:1 Mapping

**Why:**
1. **Validates the core theory** - progressive discovery of primitives
2. **Auto-generated** - easy to maintain, regenerate from schema
3. **Flexible** - tests the worst-case token usage (no shortcuts)
4. **Honest measurement** - shows real cost without helper abstractions

### For Production: Hybrid Approach

**Why:**
1. **Start with primitives** (auto-generated foundation)
2. **Add workflows as patterns emerge** (based on real usage)
3. **Let users choose** (primitives for custom, workflows for common)
4. **Evolve organically** (don't prematurely optimize)

**Implementation:**
```typescript
// Root index shows both options
/**
 * Chrome DevTools Code Execution API
 *
 * ## For Common Tasks
 * Explore workflows/ for pre-built patterns:
 * - workflows/testing/checkPageHealth
 * - workflows/forms/loginAndVerify
 *
 * ## For Custom Tasks
 * Explore primitives/ for full flexibility:
 * - primitives/navigation/
 * - primitives/debugging/
 * - primitives/input/
 */
```

---

## Emergent Patterns (Future Work)

The most interesting approach: **let the execution environment learn workflows over time**.

**How it would work:**
1. User writes code using primitives
2. Execution environment persists successful patterns to `learned-workflows/`
3. Next time, Claude discovers both primitives AND learned patterns
4. Progressive learning: system gets smarter with use

**Example:**
```typescript
// First time: user writes full code with primitives
await api.primitives.navigation.navigate_page(url);
const messages = await api.primitives.debugging.list_console_messages();
// ... (10 lines of code)

// System detects this pattern, persists as:
// learned-workflows/checkPageHealth.ts

// Next time: Claude discovers the learned workflow
const result = await api.learned.checkPageHealth(url);
```

This mirrors how developers naturally abstract repeated code into functions.

---

## Answer to Your Question

**For your blog post experiment:**
**Keep 1:1 mapping** because:
1. Validates the pure progressive discovery pattern
2. Shows worst-case token usage (no shortcuts)
3. Easy to generate and maintain
4. Honest about the tradeoffs

**For production use:**
**Start with hybrid** because:
1. Primitives give flexibility
2. Workflows save tokens for common cases
3. Users can choose based on their needs
4. Can evolve based on real usage patterns

**For future research:**
**Explore emergent patterns** because:
1. System learns from successful workflows
2. Gets smarter with use
3. Personalized to your automation patterns
4. True progressive intelligence

---

## Implications for Blog Post

This design question is **worth discussing in the post**:

### Section: "Design Choices: Primitives vs Wrappers"

> We chose to map 1:1 to MCP primitives rather than create higher-level wrappers. This was intentional: we wanted to validate the pure progressive discovery pattern without shortcuts.
>
> The tradeoff: you write more code for common patterns, but you have maximum flexibility. For production, a hybrid approach makes sense—keep primitives for custom tasks, add workflows for common patterns as they emerge.
>
> The most interesting future direction: let the execution environment learn workflows over time, persisting successful patterns for reuse. The system gets smarter with use, adapting to your specific automation needs.

This adds nuance and shows you're thinking deeply about the design space, not just implementing the first thing that works.
