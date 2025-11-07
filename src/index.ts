/**
 * Chrome DevTools MCP Code Execution Wrapper
 * Main entry point for testing progressive tool discovery
 */

import { MCPClient, executeCode } from './executor.js';
import { readFile } from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🚀 Starting Chrome DevTools MCP Code Execution Wrapper\n');

  // Start MCP client
  const client = new MCPClient();
  console.log('📡 Connecting to Chrome DevTools MCP server...');
  await client.start();
  console.log('✅ Connected!\n');

  // Example: Test progressive discovery workflow
  console.log('📚 Testing progressive tool discovery...\n');

  // 1. Read root index to discover categories
  console.log('Step 1: Discover available categories');
  const rootIndex = await readFile(path.join(process.cwd(), 'api/index.ts'), 'utf-8');
  console.log('Read api/index.ts:', rootIndex.split('\n').slice(0, 15).join('\n'));
  console.log('...\n');

  // 2. Read navigation category index
  console.log('Step 2: Explore navigation category');
  const navIndex = await readFile(path.join(process.cwd(), 'api/navigation/index.ts'), 'utf-8');
  console.log('Read api/navigation/index.ts:', navIndex.split('\n').slice(0, 10).join('\n'));
  console.log('...\n');

  // 3. Read specific tool documentation
  console.log('Step 3: Read tool documentation');
  const navPageTool = await readFile(path.join(process.cwd(), 'api/navigation/navigate_page.ts'), 'utf-8');
  console.log('Read api/navigation/navigate_page.ts:', navPageTool);
  console.log();

  // 4. Execute code using the discovered APIs
  console.log('Step 4: Execute code with discovered APIs\n');

  const userCode = `
    // User writes code that imports and uses the API
    const result = await api.navigation.navigate_page('https://example.com');
    console.log('Navigation result:', result);

    // Take a screenshot
    const screenshot = await api.debugging.take_screenshot({ fullPage: false });
    console.log('Screenshot captured');

    return { success: true, result };
  `;

  try {
    console.log('Executing user code...\n');
    const result = await executeCode(userCode, client);
    console.log('\n✅ Execution complete:', result);
  } catch (error: any) {
    console.error('\n❌ Execution failed:', error.message);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await client.stop();
  console.log('✅ Done!');
}

main().catch(console.error);
