/**
 * Chrome DevTools MCP Code Execution API
 * Generated from chrome-devtools-mcp v0.9.0 source
 *
 * Progressive tool discovery filesystem structure
 *
 * Categories:
 * - navigation/ (8 tools)
 * - input/ (6 tools)
 * - debugging/ (6 tools)
 * - network/ (2 tools)
 * - emulation/ (2 tools)
 * - performance/ (0 tools)
 *
 * Usage:
 * 1. Explore categories by reading this file
 * 2. Navigate to a category directory (e.g., ./navigation/)
 * 3. Read the index.ts to see available tools
 * 4. Read individual tool files for detailed documentation
 * 5. Import and use tools in your code
 *
 * Example:
 * ```typescript
 * import { navigate_page } from './navigation/navigate_page.js';
 * import { take_screenshot } from './debugging/take_screenshot.js';
 *
 * await navigate_page({ url: 'http://localhost:4321' });
 * await take_screenshot({ fullPage: true });
 * ```
 */

export * as navigation from './navigation/index.js';
export * as input from './input/index.js';
export * as debugging from './debugging/index.js';
export * as network from './network/index.js';
export * as emulation from './emulation/index.js';
export * as performance from './performance/index.js';
