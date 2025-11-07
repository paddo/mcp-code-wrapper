/**
 * Filesystem structure generator from actual Chrome DevTools MCP source
 * Reads the actual tool definitions and generates TypeScript API files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import tool definitions from the actual chrome-devtools-mcp package
const toolModules = [
  { name: 'pages', category: 'navigation' },
  { name: 'input', category: 'input' },
  { name: 'console', category: 'debugging' },
  { name: 'script', category: 'debugging' },
  { name: 'screenshot', category: 'debugging' },
  { name: 'snapshot', category: 'debugging' },
  { name: 'network', category: 'network' },
  { name: 'emulation', category: 'emulation' },
  { name: 'performance', category: 'performance' },
];

async function extractToolDefinitions() {
  const tools: Record<string, any[]> = {
    navigation: [],
    input: [],
    debugging: [],
    network: [],
    emulation: [],
    performance: [],
  };

  for (const module of toolModules) {
    try {
      // Import the actual module - use file:// URL for absolute path
      const modulePath = path.join(process.cwd(), 'node_modules/chrome-devtools-mcp/build/src/tools', `${module.name}.js`);
      const moduleUrl = `file://${modulePath}`;
      const imported = await import(moduleUrl);

      // Extract all exported tool definitions
      for (const [exportName, exportValue] of Object.entries(imported)) {
        if (exportName !== 'default' && typeof exportValue === 'object' && exportValue !== null) {
          const tool = exportValue as any;
          if (tool.name && tool.description && tool.schema) {
            // Extract schema parameter names
            const params = Object.keys(tool.schema);

            tools[module.category].push({
              name: tool.name,
              description: tool.description,
              params,
              schema: tool.schema,
              readOnly: tool.annotations?.readOnlyHint ?? false,
            });
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to import ${module.name}:`, error.message);
    }
  }

  return tools;
}

async function generateToolFile(category: string, tool: any): Promise<string> {
  // Generate parameter type from schema
  const paramTypes = tool.params.map((p: string) => {
    // This is simplified - in production, extract actual Zod types
    return `${p}?: any`;
  }).join(', ');

  return `/**
 * ${tool.description}
 * @category ${category}
 * @source chrome-devtools-mcp
 */
export async function ${tool.name}(${paramTypes ? `params: { ${paramTypes} }` : ''}): Promise<any> {
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
  readOnly: ${tool.readOnly},
  schema: {
    // Zod schema from chrome-devtools-mcp
    // ${JSON.stringify(tool.schema, null, 4).split('\n').join('\n    // ')}
  },
};
`;
}

async function generateIndexFile(category: string, toolNames: string[]): Promise<string> {
  const exports = toolNames.map(name => `export * from './${name}.js';`).join('\n');
  return `/**
 * ${category.charAt(0).toUpperCase() + category.slice(1)} tools
 * Generated from chrome-devtools-mcp source
 *
 * Available tools:
${toolNames.map(name => ` * - ${name}`).join('\n')}
 */

${exports}
`;
}

async function generateRootIndex(tools: Record<string, any[]>): Promise<string> {
  const categories = Object.keys(tools);
  return `/**
 * Chrome DevTools MCP Code Execution API
 * Generated from chrome-devtools-mcp v0.9.0 source
 *
 * Progressive tool discovery filesystem structure
 *
 * Categories:
${categories.map(cat => ` * - ${cat}/ (${tools[cat].length} tools)`).join('\n')}
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
 * await navigate_page({ url: 'http://localhost:4321' });
 * await take_screenshot({ fullPage: true });
 * \`\`\`
 */

${categories.map(cat => `export * as ${cat} from './${cat}/index.js';`).join('\n')}
`;
}

async function generateFilesystem() {
  const apiDir = path.join(process.cwd(), 'api-from-source');

  // Clean and create API directory
  await fs.rm(apiDir, { recursive: true, force: true });
  await fs.mkdir(apiDir, { recursive: true });

  console.log('Extracting tool definitions from chrome-devtools-mcp source...\n');

  // Extract tool definitions from actual source
  const tools = await extractToolDefinitions();

  console.log('Generating filesystem structure...\n');

  // Generate category directories and tool files
  for (const [category, categoryTools] of Object.entries(tools)) {
    if (categoryTools.length === 0) continue;

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
  const rootIndexContent = await generateRootIndex(tools);
  await fs.writeFile(rootIndexFile, rootIndexContent);
  console.log(`📄 index.ts (root)\n`);

  console.log('✅ Filesystem structure generated from source!');
  console.log(`📊 Total: ${Object.keys(tools).length} categories, ${Object.values(tools).flat().length} tools`);
  console.log('\n📝 Tool definitions extracted from actual chrome-devtools-mcp source code');
}

generateFilesystem().catch(console.error);
