/**
 * Filesystem structure generator for Chrome DevTools MCP
 * Creates TypeScript API files for progressive tool discovery
 */

import fs from 'fs/promises';
import path from 'path';

// Tool definitions based on Chrome DevTools MCP
const tools = {
  input: [
    { name: 'click', description: 'Interact with page elements', params: ['selector', 'options?'] },
    { name: 'drag', description: 'Perform drag operations', params: ['fromSelector', 'toSelector'] },
    { name: 'fill', description: 'Enter text into fields', params: ['selector', 'value'] },
    { name: 'fill_form', description: 'Complete multiple form fields', params: ['formData'] },
    { name: 'handle_dialog', description: 'Manage browser dialogs', params: ['accept', 'text?'] },
    { name: 'hover', description: 'Trigger hover states', params: ['selector'] },
    { name: 'press_key', description: 'Simulate keyboard input', params: ['key'] },
    { name: 'upload_file', description: 'Submit file inputs', params: ['selector', 'filePath'] },
  ],
  navigation: [
    { name: 'close_page', description: 'Shut down browser tabs', params: ['pageId?'] },
    { name: 'list_pages', description: 'View open pages', params: [] },
    { name: 'navigate_page', description: 'Load URLs', params: ['url', 'options?'] },
    { name: 'new_page', description: 'Create fresh tabs', params: ['url?'] },
    { name: 'select_page', description: 'Switch between pages', params: ['pageId'] },
    { name: 'wait_for', description: 'Pause for conditions', params: ['condition', 'timeout?'] },
  ],
  emulation: [
    { name: 'emulate', description: 'Simulate devices or network conditions', params: ['config'] },
    { name: 'resize_page', description: 'Adjust viewport dimensions', params: ['width', 'height'] },
  ],
  performance: [
    { name: 'performance_analyze_insight', description: 'Extract optimization recommendations', params: ['traceData'] },
    { name: 'performance_start_trace', description: 'Begin recording metrics', params: ['options?'] },
    { name: 'performance_stop_trace', description: 'End trace and process data', params: [] },
  ],
  network: [
    { name: 'get_network_request', description: 'Retrieve request details', params: ['requestId'] },
    { name: 'list_network_requests', description: 'View all captured requests', params: ['filter?'] },
  ],
  debugging: [
    { name: 'evaluate_script', description: 'Execute JavaScript', params: ['script', 'pageId?'] },
    { name: 'get_console_message', description: 'Fetch individual log entries', params: ['messageId'] },
    { name: 'list_console_messages', description: 'View all logs', params: ['filter?'] },
    { name: 'take_screenshot', description: 'Capture visual state', params: ['options?'] },
    { name: 'take_snapshot', description: 'Record DOM snapshots', params: ['options?'] },
  ],
};

async function generateToolFile(category: string, tool: any): Promise<string> {
  const paramsStr = tool.params.join(', ');
  return `/**
 * ${tool.description}
 * @category ${category}
 */
export async function ${tool.name}(${paramsStr}): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: '${tool.name}',
  category: '${category}',
  description: '${tool.description}',
  parameters: ${JSON.stringify(tool.params, null, 2)},
};
`;
}

async function generateIndexFile(category: string, toolNames: string[]): Promise<string> {
  const exports = toolNames.map(name => `export * from './${name}.js';`).join('\n');
  return `/**
 * ${category.charAt(0).toUpperCase() + category.slice(1)} tools
 *
 * Available tools:
${toolNames.map(name => ` * - ${name}`).join('\n')}
 */

${exports}
`;
}

async function generateRootIndex(): Promise<string> {
  const categories = Object.keys(tools);
  return `/**
 * Chrome DevTools MCP Code Execution API
 *
 * Progressive tool discovery filesystem structure
 *
 * Categories:
${categories.map(cat => ` * - ${cat}/ (${tools[cat as keyof typeof tools].length} tools)`).join('\n')}
 *
 * Usage:
 * 1. Explore categories by reading this file
 * 2. Navigate to a category directory (e.g., ./navigation/)
 * 3. Read the index.ts to see available tools
 * 4. Read individual tool files for detailed documentation
 * 5. Import and use tools in your code
 *
 * Example:
 * \`\`\`typescript
 * import { navigate_page } from './navigation/navigate_page.js';
 * import { take_screenshot } from './debugging/take_screenshot.js';
 *
 * await navigate_page('http://localhost:4321');
 * await take_screenshot({ fullPage: true });
 * \`\`\`
 */

${categories.map(cat => `export * as ${cat} from './${cat}/index.js';`).join('\n')}
`;
}

async function generateFilesystem() {
  const apiDir = path.join(process.cwd(), 'api');

  // Clean and create API directory
  await fs.rm(apiDir, { recursive: true, force: true });
  await fs.mkdir(apiDir, { recursive: true });

  console.log('Generating filesystem structure...\n');

  // Generate category directories and tool files
  for (const [category, categoryTools] of Object.entries(tools)) {
    const categoryDir = path.join(apiDir, category);
    await fs.mkdir(categoryDir, { recursive: true });

    console.log(`📁 ${category}/`);

    const toolNames: string[] = [];
    for (const tool of categoryTools) {
      const toolFile = path.join(categoryDir, `${tool.name}.ts`);
      const content = await generateToolFile(category, tool);
      await fs.writeFile(toolFile, content);
      toolNames.push(tool.name);
      console.log(`   ├─ ${tool.name}.ts`);
    }

    // Generate category index
    const indexFile = path.join(categoryDir, 'index.ts');
    const indexContent = await generateIndexFile(category, toolNames);
    await fs.writeFile(indexFile, indexContent);
    console.log(`   └─ index.ts\n`);
  }

  // Generate root index
  const rootIndexFile = path.join(apiDir, 'index.ts');
  const rootIndexContent = await generateRootIndex();
  await fs.writeFile(rootIndexFile, rootIndexContent);
  console.log(`📄 index.ts (root)\n`);

  console.log('✅ Filesystem structure generated successfully!');
  console.log(`📊 Total: ${Object.keys(tools).length} categories, ${Object.values(tools).flat().length} tools`);
}

generateFilesystem().catch(console.error);
