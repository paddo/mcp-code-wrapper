/**
 * Universal MCP Filesystem Generator
 * Works with ANY MCP server by querying via the MCP protocol
 */

import fs from 'fs/promises';
import path from 'path';
import { MCPClient } from './executor.js';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

async function extractToolsFromMCP(
  command: string,
  args: string[] = []
): Promise<MCPTool[]> {
  console.log(`📡 Connecting to MCP server: ${command} ${args.join(' ')}\n`);

  const client = new MCPClient();

  // Override the spawn command to use provided command/args
  const originalStart = client.start.bind(client);
  client.start = async function() {
    const { spawn } = await import('child_process');
    (this as any).process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Setup handlers (copied from MCPClient)
    (this as any).process.stdout.on('data', (data: Buffer) => {
      (this as any).buffer += data.toString();
      (this as any).processBuffer();
    });

    (this as any).process.stderr.on('data', (data: Buffer) => {
      // Suppress stderr noise during tool extraction
    });

    // Wait for initialization
    await (this as any).initialize();
  };

  await client.start();

  // Get tool list via MCP protocol
  const tools = await client.listTools();

  await client.stop();

  console.log(`✅ Extracted ${tools.tools?.length || 0} tools\n`);

  return tools.tools || [];
}

function categorizeTools(tools: MCPTool[]): Record<string, MCPTool[]> {
  // Try to auto-categorize based on naming patterns
  const categories: Record<string, MCPTool[]> = {
    navigation: [],
    input: [],
    debugging: [],
    network: [],
    performance: [],
    emulation: [],
    other: [],
  };

  for (const tool of tools) {
    const name = tool.name.toLowerCase();

    if (name.includes('navigate') || name.includes('page') || name.includes('goto')) {
      categories.navigation.push(tool);
    } else if (name.includes('click') || name.includes('fill') || name.includes('type') || name.includes('drag') || name.includes('hover')) {
      categories.input.push(tool);
    } else if (name.includes('console') || name.includes('evaluate') || name.includes('screenshot') || name.includes('snapshot') || name.includes('debug')) {
      categories.debugging.push(tool);
    } else if (name.includes('network') || name.includes('request')) {
      categories.network.push(tool);
    } else if (name.includes('performance') || name.includes('trace') || name.includes('profile')) {
      categories.performance.push(tool);
    } else if (name.includes('emulate') || name.includes('device') || name.includes('viewport')) {
      categories.emulation.push(tool);
    } else {
      categories.other.push(tool);
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

function extractParameters(tool: MCPTool): { name: string; type: string; required: boolean }[] {
  if (!tool.inputSchema?.properties) return [];

  const required = new Set(tool.inputSchema.required || []);

  return Object.entries(tool.inputSchema.properties).map(([name, schema]) => ({
    name,
    type: (schema as any).type || 'any',
    required: required.has(name),
  }));
}

async function generateToolFile(category: string, tool: MCPTool, serverName: string): Promise<string> {
  const params = extractParameters(tool);

  // Generate parameter interface
  const paramInterface = params.length > 0 ? `{
${params.map(p => `  ${p.name}${p.required ? '' : '?'}: ${mapJsonSchemaType(p.type)};`).join('\n')}
}` : 'Record<string, never>';

  return `/**
 * ${tool.description || tool.name}
 * @category ${category}
 * @source ${serverName}
 */
export async function ${tool.name}(params: ${paramInterface}): Promise<any> {
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
  description: '${tool.description || ''}',
  parameters: ${JSON.stringify(params.map(p => p.name), null, 2)},
  inputSchema: ${JSON.stringify(tool.inputSchema, null, 2)},
};
`;
}

function mapJsonSchemaType(jsonType: string): string {
  switch (jsonType) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'integer': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return 'any[]';
    case 'object': return 'Record<string, any>';
    default: return 'any';
  }
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

async function generateRootIndex(
  categories: Record<string, MCPTool[]>,
  serverName: string
): Promise<string> {
  const categoryNames = Object.keys(categories);
  const totalTools = Object.values(categories).flat().length;

  return `/**
 * ${serverName} Code Execution API
 * Generated via MCP protocol (universal approach)
 *
 * Progressive tool discovery filesystem structure
 *
 * Categories:
${categoryNames.map(cat => ` * - ${cat}/ (${categories[cat].length} tools)`).join('\n')}
 *
 * Total tools: ${totalTools}
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
 * import { tool_name } from './category/tool_name.js';
 *
 * await tool_name({ param: 'value' });
 * \`\`\`
 */

${categoryNames.map(cat => `export * as ${cat} from './${cat}/index.js';`).join('\n')}
`;
}

async function generateFilesystem(
  command: string,
  args: string[] = [],
  outputDir: string = 'api-universal',
  serverName: string = 'MCP'
) {
  const apiDir = path.join(process.cwd(), outputDir);

  // Clean and create API directory
  await fs.rm(apiDir, { recursive: true, force: true });
  await fs.mkdir(apiDir, { recursive: true });

  console.log('🔬 Universal MCP Filesystem Generator\n');
  console.log('=' .repeat(70) + '\n');

  // Extract tools via MCP protocol
  const tools = await extractToolsFromMCP(command, args);

  if (tools.length === 0) {
    console.error('❌ No tools found. Check your MCP server configuration.');
    return;
  }

  // Categorize tools
  const categories = categorizeTools(tools);

  console.log('📊 Tool Categories:\n');
  for (const [category, categoryTools] of Object.entries(categories)) {
    console.log(`   ${category}: ${categoryTools.length} tools`);
  }
  console.log();

  console.log('Generating filesystem structure...\n');

  // Generate category directories and tool files
  for (const [category, categoryTools] of Object.entries(categories)) {
    const categoryDir = path.join(apiDir, category);
    await fs.mkdir(categoryDir, { recursive: true });

    console.log(`📁 ${category}/`);

    const toolNames: string[] = [];
    for (const tool of categoryTools) {
      const toolFile = path.join(categoryDir, `${tool.name}.ts`);
      const content = await generateToolFile(category, tool, serverName);
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
  const rootIndexContent = await generateRootIndex(categories, serverName);
  await fs.writeFile(rootIndexFile, rootIndexContent);
  console.log(`📄 index.ts (root)\n`);

  console.log('=' .repeat(70) + '\n');
  console.log('✅ Universal filesystem structure generated!');
  console.log(`📊 Total: ${Object.keys(categories).length} categories, ${tools.length} tools`);
  console.log(`📁 Output: ${apiDir}/`);
  console.log('\n🌍 This approach works with ANY MCP server!');
}

// CLI usage
const command = process.argv[2] || 'npx';
const args = process.argv[3] ? process.argv.slice(3) : ['-y', 'chrome-devtools-mcp@latest'];
const outputDir = process.env.OUTPUT_DIR || 'api-universal';
const serverName = process.env.SERVER_NAME || 'Chrome DevTools MCP';

console.log(`\n🚀 Command: ${command} ${args.join(' ')}\n`);

generateFilesystem(command, args, outputDir, serverName).catch(console.error);
