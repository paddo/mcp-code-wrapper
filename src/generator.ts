/**
 * Universal MCP Filesystem Generator
 * Works with ANY MCP server by querying via the MCP protocol
 */

import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { MCPClient } from './executor.js';

// Embedded runtime executor template
const RUNTIME_EXECUTOR_TEMPLATE = `/**
 * MCP Runtime Executor
 * Executes TypeScript code with MCP wrapper functions active
 *
 * Usage:
 *   npx tsx .mcp-wrappers/.runtime-executor.ts <server-name> <code-file>
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

class MCPClient {
  private process: any;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';

  async start(command: string, args: string[], env: Record<string, string> = {}) {
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env }
    });

    this.process.stdout.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr.on('data', (data: Buffer) => {
      // Suppress stderr unless error
    });

    this.process.on('error', (err: Error) => {
      console.error('MCP process error:', err);
    });

    await this.initialize();
  }

  private processBuffer() {
    const lines = this.buffer.split('\\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response: MCPResponse = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id);

        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(new Error(response.error.message || JSON.stringify(response.error)));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON lines
      }
    }
  }

  private async initialize() {
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-code-wrapper-executor',
        version: '1.0.0',
      },
    });

    this.notify('notifications/initialized', {});
  }

  private request(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(\`Request timeout: \${method}\`));
        }
      }, 30000);
    });
  }

  private notify(method: string, params?: any) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.process.stdin.write(JSON.stringify(notification) + '\\n');
  }

  async callTool(name: string, args: any = {}): Promise<any> {
    const result = await this.request('tools/call', {
      name,
      arguments: args,
    });
    return this.normalizeResponse(result);
  }

  /**
   * Normalize MCP responses to handle common unusual formats
   */
  private normalizeResponse(result: any): any {
    // If result has content array with text, parse it first
    if (result?.content?.[0]?.text) {
      try {
        const parsed = JSON.parse(result.content[0].text);
        return this.normalizeData(parsed);
      } catch {
        return result;
      }
    }

    return this.normalizeData(result);
  }

  /**
   * Recursively normalize data structures
   */
  private normalizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }

    if (data && typeof data === 'object') {
      // Handle { "": value } pattern - unwrap to just value
      const keys = Object.keys(data);
      if (keys.length === 1 && keys[0] === '') {
        const value = data[''];
        // If value is a primitive, return it directly
        if (typeof value !== 'object') {
          return value;
        }
        // If value is an object, normalize it
        return this.normalizeData(value);
      }

      // Otherwise normalize each property
      const normalized: any = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key] = this.normalizeData(value);
      }
      return normalized;
    }

    return data;
  }

  async stop() {
    if (this.process) {
      // Clear pending requests
      this.pendingRequests.clear();

      // Remove all listeners to prevent event loop from hanging
      this.process.stdout.removeAllListeners();
      this.process.stderr.removeAllListeners();
      this.process.removeAllListeners();

      // Kill the process
      this.process.kill('SIGTERM');

      // Force kill after 1 second if still running
      await new Promise(resolve => {
        const forceKillTimeout = setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
          resolve(undefined);
        }, 1000);

        this.process.once('exit', () => {
          clearTimeout(forceKillTimeout);
          resolve(undefined);
        });
      });

      this.process = null;
    }
  }
}

/**
 * Load MCP server config from .mcp.json
 */
async function loadServerConfig(serverName: string): Promise<{ command: string; args: string[]; env: Record<string, string> }> {
  const mcpJsonPath = join(process.cwd(), '.mcp.json');
  const content = await readFile(mcpJsonPath, 'utf-8');
  const config = JSON.parse(content);

  const serverMapping = await loadServerMapping();
  const actualServerName = Object.keys(serverMapping).find(key => serverMapping[key] === serverName) || serverName;

  const serverConfig = config.mcpServers?.[actualServerName];
  if (!serverConfig) {
    throw new Error(\`Server "\${actualServerName}" not found in .mcp.json\`);
  }

  return {
    command: serverConfig.command,
    args: serverConfig.args || [],
    env: serverConfig.env || {}
  };
}

/**
 * Load server-to-wrapper mapping
 */
async function loadServerMapping(): Promise<Record<string, string>> {
  try {
    const mappingPath = join(process.cwd(), '.mcp-wrappers', '.mcp-server-mapping.json');
    const content = await readFile(mappingPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Create wrapper function proxy that calls MCP tools
 */
function createWrapperProxy(client: MCPClient) {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return async (params: any) => {
          return await client.callTool(prop, params);
        };
      }
      return undefined;
    }
  });
}

/**
 * Detect if this is a TypeScript local server (wrappers in .mcp-server/dist/wrappers/)
 * This checks if the SERVER ITSELF is built locally, not if the project has any local servers
 */
async function isTypescriptLocal(serverName: string): Promise<boolean> {
  try {
    const { stat } = await import('fs/promises');
    const config = await loadServerConfig(serverName);

    // Check if the command points to a local .mcp-server directory
    const isLocalServer = config.command.includes('.mcp-server') ||
                          config.args.some(arg => arg.includes('.mcp-server'));

    if (!isLocalServer) {
      return false;
    }

    // Verify the wrappers directory exists
    const wrappersPath = join(process.cwd(), '.mcp-server', 'dist', 'wrappers');
    await stat(wrappersPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute user code with MCP client active
 */
async function executeCode(serverName: string, codeFile: string) {
  console.log(\`🚀 Starting MCP executor for server: \${serverName}\\n\`);

  // Load server config
  const config = await loadServerConfig(serverName);

  // Check if this is a TypeScript local server
  const isLocal = await isTypescriptLocal(serverName);

  let client: MCPClient | null = null;

  if (isLocal) {
    // TypeScript local: just set env vars, no MCP subprocess needed!
    console.log(\`⚡ TypeScript local mode: Direct imports\\n\`);
    Object.assign(process.env, config.env);
  } else {
    // Protocol server: spawn MCP subprocess
    console.log(\`📡 Spawning MCP server: \${config.command} \${config.args.join(' ')}\\n\`);
    client = new MCPClient();
    await client.start(config.command, config.args, config.env);
  }

  console.log(\`✅ MCP executor ready\\n\`);

  // Create global proxy for wrapper functions (only for protocol servers)
  if (client) {
    const wrapperProxy = createWrapperProxy(client);
    (global as any).__mcpClient = client;
    (global as any).__mcpWrapper = wrapperProxy;
  }

  // Read and execute user code
  console.log(\`📝 Executing: \${codeFile}\\n\`);
  console.log('='.repeat(70));
  console.log('OUTPUT:');
  console.log('='.repeat(70) + '\\n');

  try {
    // Import and execute the code file
    const codeModule = await import(pathToFileURL(codeFile).href);

    // If it has a default export that's a function, call it
    if (typeof codeModule.default === 'function') {
      const result = await codeModule.default();
      if (result !== undefined) {
        console.log('\\n' + '='.repeat(70));
        console.log('RESULT:');
        console.log('='.repeat(70));
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (error: any) {
    console.error('\\n❌ Execution error:', error.message);
    if (error.stack) {
      console.error('\\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    console.log('\\n' + '='.repeat(70));
    // Don't stop the client - leave MCP server running for reuse
    // It will clean up when the process exits
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx .mcp-wrappers/.runtime-executor.ts <server-name> <code-file>');
    console.log('\\nExample:');
    console.log('  npx tsx .mcp-wrappers/.runtime-executor.ts mssql ./my-query.ts');
    process.exit(1);
  }

  const [serverName, codeFile] = args;
  await executeCode(serverName, codeFile);
}

// Only run main if this is the entry point
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(console.error);
}

export { MCPClient, createWrapperProxy, executeCode };
`;

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

async function generateToolFile(
  category: string,
  tool: MCPTool,
  serverName: string,
  serverType: 'typescript-local' | 'protocol' = 'protocol',
  projectPath: string = process.cwd()
): Promise<string> {
  const params = extractParameters(tool);

  // Generate parameter interface
  const paramInterface = params.length > 0 ? `{
${params.map(p => `  ${p.name}${p.required ? '' : '?'}: ${mapJsonSchemaType(p.type)};`).join('\n')}
}` : 'Record<string, never>';

  // Escape description for safe embedding in strings
  const description = (tool.description || tool.name).replace(/'/g, "\\'").replace(/\n/g, ' ');

  // Capitalize first letter of tool name for class name
  const className = tool.name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

  if (serverType === 'typescript-local') {
    // Direct TypeScript import - wrappers live in .mcp-server/dist/wrappers/
    // This resolves all imports from the same node_modules!
    return `/**
 * ${tool.description || tool.name}
 *
 * @category ${category}
 * @source ${serverName} (Direct TypeScript Import)
 *
 * @returns Response format: { success?, message?, items/data/rows?: [...] }
 *          Extract data: \`result.items || result.data || result.rows || result\`
 */

import sql from 'mssql';
import { createSqlConfig } from '../../index.js';
import { ${className}Tool } from '../../tools/${className}Tool.js';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    const { config } = await createSqlConfig();
    await sql.connect(config);
    initialized = true;
  }
}

export async function ${tool.name}(params: ${paramInterface}): Promise<any> {
  await ensureInit();
  const tool = new ${className}Tool();
  return await tool.run(params);
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: '${tool.name}',
  category: '${category}',
  description: '${description}',
  parameters: ${JSON.stringify(params.map(p => p.name), null, 2)},
  inputSchema: ${JSON.stringify(tool.inputSchema, null, 2)},
};
`;
  } else {
    // Protocol-based approach (current implementation)
    return `/**
 * ${tool.description || tool.name}
 *
 * @category ${category}
 * @source ${serverName}
 *
 * @returns Response format: { success?, message?, items/data/rows?: [...] }
 *          Extract data: \`result.items || result.data || result.rows || result\`
 */
export async function ${tool.name}(params: ${paramInterface}): Promise<any> {
  // Check if running in MCP executor context
  const client = (global as any).__mcpClient;
  if (!client) {
    throw new Error(
      'This function must be called through the MCP executor.\\n' +
      'Run: npx tsx .mcp-wrappers/.runtime-executor.ts ${serverName} <your-code.ts>'
    );
  }

  // Call the MCP tool via the client
  return await client.callTool('${tool.name}', params);
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: '${tool.name}',
  category: '${category}',
  description: '${description}',
  parameters: ${JSON.stringify(params.map(p => p.name), null, 2)},
  inputSchema: ${JSON.stringify(tool.inputSchema, null, 2)},
};
`;
  }
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
  serverName: string = 'MCP',
  env: Record<string, string> = {},
  skipConfig: boolean = false,
  serverType: 'typescript-local' | 'protocol' = 'protocol',
  projectPath: string = process.cwd()
) {
  // Handle both relative and absolute paths
  const apiDir = path.isAbsolute(outputDir) ? outputDir : path.join(process.cwd(), outputDir);

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
      const content = await generateToolFile(category, tool, serverName, serverType, projectPath);
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

  // TypeScript servers don't need separate init - wrappers are in .mcp-server/dist/wrappers/

  // Copy runtime executor to parent .mcp-wrappers directory (not per-server)
  if (!skipConfig) {
    const executorDest = path.join(path.dirname(apiDir), '.runtime-executor.ts');
    const packageDir = path.dirname(new URL(import.meta.url).pathname);

    // Try both .js (dist) and .ts (src) extensions
    const possibleSources = [
      path.join(packageDir, 'runtime-executor.js'),
      path.join(packageDir, 'runtime-executor.ts'),
      path.join(packageDir, '..', 'src', 'runtime-executor.ts'),
    ];

    let copied = false;
    for (const source of possibleSources) {
      try {
        await fs.copyFile(source, executorDest);
        console.log(`📄 .runtime-executor.ts (copied to parent dir)\n`);
        copied = true;
        break;
      } catch (e) {
        // Try next source
      }
    }

    if (!copied) {
      console.log(`⚠️  Could not copy runtime executor (you may need to copy it manually)\n`);
    }
  }

  console.log('=' .repeat(70) + '\n');
  console.log('✅ Universal filesystem structure generated!');
  console.log(`📊 Total: ${Object.keys(categories).length} categories, ${tools.length} tools`);
  console.log(`📁 Output: ${apiDir}/`);

  console.log('\n🌍 This approach works with ANY MCP server!');
}

async function loadMCPConfig(mcpJsonPath: string, serverName: string): Promise<{ command: string; args: string[]; env: Record<string, string> }> {
  const content = await fs.readFile(mcpJsonPath, 'utf-8');
  const config = JSON.parse(content);

  const serverConfig = config.mcpServers?.[serverName];
  if (!serverConfig) {
    throw new Error(`Server "${serverName}" not found in ${mcpJsonPath}`);
  }

  return {
    command: serverConfig.command,
    args: serverConfig.args || [],
    env: serverConfig.env || {}
  };
}

function parseEnvString(envString: string): Record<string, string> {
  // Parse "KEY=val,KEY2=val2" or "KEY=val KEY2=val2"
  const separator = envString.includes(',') ? ',' : ' ';
  return Object.fromEntries(
    envString.split(separator)
      .filter(pair => pair.trim())
      .map(pair => {
        const [key, ...valueParts] = pair.split('=');
        return [key.trim(), valueParts.join('=').trim()];
      })
  );
}

async function discoverMCPConfig(projectPath: string): Promise<string | null> {
  // Look for .mcp.json in project
  const mcpJsonPath = path.join(projectPath, '.mcp.json');
  try {
    await fs.access(mcpJsonPath);
    return mcpJsonPath;
  } catch {
    return null;
  }
}

async function discoverGlobalMCPConfig(): Promise<string | null> {
  // Look for MCP config in ~/.claude/
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;

  const possiblePaths = [
    path.join(home, '.claude', 'mcp.json'),
    path.join(home, '.claude', '.mcp.json'),
    path.join(home, '.config', 'claude', 'mcp.json'),
  ];

  for (const mcpPath of possiblePaths) {
    try {
      await fs.access(mcpPath);
      return mcpPath;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Detect if an MCP server is a local TypeScript server
 */
async function detectServerType(
  projectPath: string,
  serverName: string,
  serverConfig: { command: string; args: string[] }
): Promise<'typescript-local' | 'protocol'> {
  // Check if server points to a local .mcp-server directory
  const args = serverConfig.args || [];

  // Look for .mcp-server/dist/index.js in the args
  const isLocalMcpServer = args.some(arg =>
    arg.includes('.mcp-server/dist/index.js') ||
    arg.includes('.mcp-server\\dist\\index.js')
  );

  if (!isLocalMcpServer) {
    return 'protocol';
  }

  // Verify the directory actually exists
  try {
    const indexPath = path.join(projectPath, '.mcp-server', 'dist', 'index.js');
    const toolsPath = path.join(projectPath, '.mcp-server', 'dist', 'tools');

    await fs.access(indexPath);
    await fs.access(toolsPath);

    return 'typescript-local';
  } catch {
    return 'protocol';
  }
}

/**
 * Prompt user for input
 */
async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Interactive server selection
 */
async function selectServers(servers: string[]): Promise<string[]> {
  console.log(`\n📦 Available MCP servers:\n`);
  servers.forEach((name, i) => console.log(`   ${i + 1}. ${name}`));
  console.log(`   a. All servers`);

  const answer = await prompt('\nSelect servers (comma-separated numbers, or "a" for all): ');

  if (answer.toLowerCase() === 'a') {
    return servers;
  }

  const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
  return indices
    .filter(i => i >= 0 && i < servers.length)
    .map(i => servers[i]);
}

async function generateAllFromProject(
  projectPath: string,
  createSkills: boolean = false,
  disableMCPs: boolean = true,
  interactive: boolean = false,
  specifiedServers?: string[]
) {
  console.log(`\n🔍 Discovering MCP servers in ${projectPath}\n`);

  const mcpJsonPath = await discoverMCPConfig(projectPath);
  if (!mcpJsonPath) {
    throw new Error(`No .mcp.json found in ${projectPath}`);
  }

  console.log(`✅ Found ${mcpJsonPath}\n`);

  const content = await fs.readFile(mcpJsonPath, 'utf-8');
  const config = JSON.parse(content);
  const allServers = Object.keys(config.mcpServers || {});

  // Determine which servers to process
  let servers: string[];

  if (specifiedServers && specifiedServers.length > 0) {
    // Validate specified servers exist
    const invalidServers = specifiedServers.filter(s => !allServers.includes(s));
    if (invalidServers.length > 0) {
      console.log(`\n❌ Error: The following servers were not found in .mcp.json:`);
      invalidServers.forEach(s => console.log(`   - ${s}`));
      console.log(`\nAvailable servers:`);
      allServers.forEach(s => console.log(`   - ${s}`));
      return;
    }
    servers = specifiedServers;
  } else if (interactive) {
    // Interactive mode: let user select servers
    servers = await selectServers(allServers);
  } else {
    // Default: use all servers
    servers = allServers;
  }

  if (servers.length === 0) {
    console.log('❌ No servers selected. Exiting.');
    return;
  }

  console.log(`\n📦 Generating wrappers for ${servers.length} MCP server(s):\n`);
  servers.forEach(name => console.log(`   - ${name}`));
  console.log();

  // Phase 1: Extract tools from all servers and detect server types
  console.log(`🔬 Phase 1: Extracting tools from all MCP servers...\n`);
  const serverTools = new Map<string, MCPTool[]>();
  const serverConfigs = new Map<string, { command: string; args: string[]; env: Record<string, string> }>();
  const serverTypes = new Map<string, 'typescript-local' | 'protocol'>();

  for (const serverName of servers) {
    const serverConfig = await loadMCPConfig(mcpJsonPath, serverName);
    serverConfigs.set(serverName, serverConfig);

    // Detect server type
    const serverType = await detectServerType(projectPath, serverName, serverConfig);
    serverTypes.set(serverName, serverType);

    const cwd = process.cwd();
    process.chdir(projectPath);
    const tools = await extractToolsFromMCP(serverConfig.command, serverConfig.args);
    process.chdir(cwd);

    serverTools.set(serverName, tools);
    const typeLabel = serverType === 'typescript-local' ? '🔷 TypeScript' : '🔌 Protocol';
    console.log(`   ✅ ${serverName}: ${tools.length} tools (${typeLabel})`);
  }

  // Phase 2: Detect duplicates
  console.log(`\n🔎 Phase 2: Detecting duplicate MCPs...\n`);
  const duplicates = detectDuplicateMCPs(serverTools);
  const serverToWrapper = new Map<string, string>();

  if (duplicates.size > 0) {
    console.log(`   Found ${duplicates.size} shared wrapper(s):\n`);
    for (const [sharedName, servers] of duplicates.entries()) {
      console.log(`   📦 ${sharedName}/ (shared by: ${servers.join(', ')})`);
      servers.forEach(s => serverToWrapper.set(s, sharedName));
    }
    console.log();
  } else {
    console.log(`   No duplicates detected.\n`);
  }

  // Phase 3: Generate wrappers (deduplicated)
  console.log(`🔧 Phase 3: Generating wrappers...\n`);
  const generatedWrappers = new Set<string>();

  for (const serverName of servers) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔧 Processing: ${serverName}`);
    console.log('='.repeat(70) + '\n');

    const serverConfig = serverConfigs.get(serverName)!;
    const tools = serverTools.get(serverName)!;
    const serverType = serverTypes.get(serverName)!;
    const wrapperName = serverToWrapper.get(serverName) || serverName;

    // TypeScript servers: put wrappers IN .mcp-server/dist for module resolution
    // Protocol servers: put wrappers in .mcp-wrappers/
    const outputDir = serverType === 'typescript-local'
      ? path.join(projectPath, '.mcp-server', 'dist', 'wrappers')
      : path.join(projectPath, '.mcp-wrappers', wrapperName);

    // Only generate wrapper if not already generated (deduplicate)
    if (!generatedWrappers.has(wrapperName)) {
      const cwd = process.cwd();
      process.chdir(projectPath);

      await generateFilesystem(
        serverConfig.command,
        serverConfig.args,
        outputDir,
        wrapperName,
        serverConfig.env,
        true, // Skip config saving, we use .mcp.json directly
        serverType,
        projectPath
      );

      process.chdir(cwd);
      generatedWrappers.add(wrapperName);
    } else {
      console.log(`   ♻️  Reusing shared wrapper: ${wrapperName}/`);
    }

    if (createSkills) {
      console.log(`\n🎯 Creating Claude Code Skill wrapper...`);
      // Each server gets its own Skill (with unique description), but may reference shared wrapper
      await generateSkillWrapper(projectPath, serverName, outputDir, tools, serverConfig.env, serverType);
    }
  }

  // Save server-to-wrapper mapping
  if (serverToWrapper.size > 0) {
    const mappingPath = path.join(projectPath, '.mcp-wrappers', '.mcp-server-mapping.json');
    const mapping: Record<string, string> = {};
    for (const [server, wrapper] of serverToWrapper.entries()) {
      mapping[server] = wrapper;
    }
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\n💾 Saved server mapping: .mcp-wrappers/.mcp-server-mapping.json`);
  }

  // Write runtime executor from embedded template
  const wrappersDir = path.join(projectPath, '.mcp-wrappers');
  await fs.mkdir(wrappersDir, { recursive: true });
  const executorDest = path.join(wrappersDir, '.runtime-executor.ts');
  await fs.writeFile(executorDest, RUNTIME_EXECUTOR_TEMPLATE);
  console.log(`\n📄 Created .runtime-executor.ts in .mcp-wrappers/`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Generated wrappers for ${servers.length} MCP servers`);
  console.log(`📁 Output: ${projectPath}/.mcp-wrappers/`);

  // Update .gitignore
  await updateGitignore(projectPath);

  // Disable MCPs (keeps them in .mcp.json for executor)
  if (disableMCPs) {
    console.log();
    await disableMCPServers(mcpJsonPath, servers);
  }

  // Show restart message
  console.log();
  printRestartMessage();

  console.log('='.repeat(70));
}

async function updateGitignore(projectPath: string) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  let gitignoreContent = '';

  try {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // No .gitignore exists, create one
  }

  const entries = ['.mcp-wrappers/', 'mcp-config.json'];
  let updated = false;

  for (const entry of entries) {
    if (!gitignoreContent.includes(entry)) {
      gitignoreContent += `\n${entry}`;
      updated = true;
    }
  }

  if (updated) {
    await fs.writeFile(gitignorePath, gitignoreContent.trim() + '\n');
    console.log(`📝 Updated .gitignore (added .mcp-wrappers/ and mcp-config.json)`);
  }
}

async function disableMCPServers(mcpJsonPath: string, serverNamesToDisable: string[]) {
  const content = await fs.readFile(mcpJsonPath, 'utf-8');
  const config = JSON.parse(content);

  // Disable only the selected MCP servers by adding "disabled: true"
  const servers = config.mcpServers || {};
  for (const serverName of serverNamesToDisable) {
    if (servers[serverName]) {
      servers[serverName].disabled = true;
    }
  }

  await fs.writeFile(mcpJsonPath, JSON.stringify(config, null, 2));
  console.log(`🔕 Disabled ${serverNamesToDisable.length} MCP servers in .mcp.json`);

  // Also disable in settings.local.json if it exists
  const projectPath = path.dirname(mcpJsonPath);
  const settingsPath = path.join(projectPath, '.claude', 'settings.local.json');

  try {
    const settingsContent = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    // Add selected servers to disabled list (preserve existing disabled servers)
    const currentDisabled = settings.disabledMcpjsonServers || [];
    const newDisabled = [...new Set([...currentDisabled, ...serverNamesToDisable])];

    // Remove selected servers from enabled list
    const currentEnabled = settings.enabledMcpjsonServers || [];
    const newEnabled = currentEnabled.filter((s: string) => !serverNamesToDisable.includes(s));

    settings.enabledMcpjsonServers = newEnabled;
    settings.enableAllProjectMcpServers = false;
    settings.disabledMcpjsonServers = newDisabled;

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`🔕 Disabled MCPs in settings.local.json`);
  } catch (e) {
    // settings.local.json doesn't exist, that's fine
  }

  console.log(`   MCPs stay in .mcp.json for executor reference`);
  console.log(`   Restore with: npx mcp-code-wrapper --restore`);
}

/**
 * Restore project to original state by removing wrappers and re-enabling MCPs
 */
async function restoreProject(projectPath: string) {
  console.log(`\n🔄 Restoring project: ${projectPath}\n`);

  // Remove .mcp-wrappers directory
  const wrappersPath = path.join(projectPath, '.mcp-wrappers');
  try {
    await fs.rm(wrappersPath, { recursive: true, force: true });
    console.log(`🗑️  Removed .mcp-wrappers/`);
  } catch (e) {
    console.log(`⚠️  No .mcp-wrappers/ found`);
  }

  // Remove generated Skills
  const skillsPath = path.join(projectPath, '.claude', 'skills');
  try {
    const skills = await fs.readdir(skillsPath);
    const mcpSkills = skills.filter(s => s.startsWith('mcp-'));

    for (const skill of mcpSkills) {
      await fs.rm(path.join(skillsPath, skill), { recursive: true, force: true });
      console.log(`🗑️  Removed skill: ${skill}`);
    }
  } catch (e) {
    console.log(`⚠️  No Skills found to remove`);
  }

  // Re-enable MCPs in .mcp.json by removing "disabled" property
  const mcpJsonPath = path.join(projectPath, '.mcp.json');

  try {
    const content = await fs.readFile(mcpJsonPath, 'utf-8');
    const config = JSON.parse(content);
    const servers = config.mcpServers || {};

    // Remove "disabled" property from each server
    for (const serverName of Object.keys(servers)) {
      delete servers[serverName].disabled;
    }

    await fs.writeFile(mcpJsonPath, JSON.stringify(config, null, 2));
    console.log(`✅ Re-enabled ${Object.keys(servers).length} MCP servers in .mcp.json`);
  } catch (e) {
    console.log(`⚠️  No .mcp.json found`);
  }

  // Re-enable MCPs in settings.local.json if it exists
  const settingsPath = path.join(projectPath, '.claude', 'settings.local.json');

  try {
    // Read current .mcp.json to get server names
    const mcpContent = await fs.readFile(mcpJsonPath, 'utf-8');
    const mcpConfig = JSON.parse(mcpContent);
    const serverNames = Object.keys(mcpConfig.mcpServers || {});

    // Update settings.local.json
    const settingsContent = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    settings.enabledMcpjsonServers = serverNames;
    settings.enableAllProjectMcpServers = true;
    settings.disabledMcpjsonServers = [];

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`✅ Re-enabled MCPs in settings.local.json`);
  } catch (e) {
    // settings.local.json doesn't exist, that's fine
  }

  console.log(`\n✅ Project restored successfully`);
  console.log(`⚠️  IMPORTANT: Restart Claude Code to load MCPs`);
  console.log(`   Run: claude -c\n`);
}

/**
 * Generate a hash of tool signatures for duplicate detection
 */
function generateToolSignature(tools: MCPTool[]): string {
  // Create a stable hash from tool names and their input schemas
  const signature = tools
    .map(t => `${t.name}:${JSON.stringify(t.inputSchema)}`)
    .sort()
    .join('|');
  return signature;
}

/**
 * Detect duplicate MCPs by comparing tool signatures
 * Returns a map of shared wrapper names to server names
 */
function detectDuplicateMCPs(serverTools: Map<string, MCPTool[]>): Map<string, string[]> {
  const signatureToServers = new Map<string, string[]>();

  // Group servers by their tool signatures
  for (const [serverName, tools] of serverTools.entries()) {
    const signature = generateToolSignature(tools);
    const servers = signatureToServers.get(signature) || [];
    servers.push(serverName);
    signatureToServers.set(signature, servers);
  }

  // Create shared wrapper names for duplicates
  const sharedWrappers = new Map<string, string[]>();
  for (const servers of signatureToServers.values()) {
    if (servers.length > 1) {
      // Multiple servers share the same tools - create shared wrapper
      // Use base name (remove suffixes like -main, -media, -dev, -prod)
      const baseName = servers[0].replace(/-(main|media|dev|prod|test|staging)$/i, '');
      sharedWrappers.set(baseName, servers);
    }
  }

  return sharedWrappers;
}

/**
 * Extract safe database context from environment variables
 * Returns formatted context string without exposing secrets
 */
function extractSafeDbContext(env: Record<string, string>): string {
  // Safe env var patterns
  const SAFE_PATTERNS = {
    database: /^(DATABASE_NAME|DB_NAME|DATABASE|POSTGRES_DATABASE|PGDATABASE|MYSQL_DATABASE|MYSQL_DB|MDB_MCP_DEFAULT_DATABASE|DB_DATABASE)$/i,
    host: /^(SERVER_NAME|HOST|HOSTNAME|POSTGRES_HOST|PGHOST|MYSQL_HOST|DB_HOST|REDIS_HOST|MSSQL_SERVER|DB_SERVER)$/i,
    port: /^(PORT|DB_PORT|POSTGRES_PORT|PGPORT|MYSQL_PORT|MSSQL_PORT|REDIS_PORT)$/i,
    readonly: /^(READ_ONLY|READONLY|MDB_MCP_READ_ONLY|MCP_MONGODB_READONLY)$/i,
  };

  // Unsafe patterns - never display these
  const UNSAFE_PATTERNS = /(PASSWORD|PASS|PWD|USER|USERNAME|SECRET|KEY|TOKEN|CONNECTION_STRING|CONNECTIONSTRING)/i;

  const context: string[] = [];

  // Extract database name
  const dbName = Object.entries(env).find(([key]) =>
    SAFE_PATTERNS.database.test(key) && !UNSAFE_PATTERNS.test(key)
  )?.[1];

  // Extract host
  const host = Object.entries(env).find(([key]) =>
    SAFE_PATTERNS.host.test(key) && !UNSAFE_PATTERNS.test(key)
  )?.[1];

  // Extract port
  const port = Object.entries(env).find(([key]) =>
    SAFE_PATTERNS.port.test(key) && !UNSAFE_PATTERNS.test(key)
  )?.[1];

  // Extract readonly flag
  const readonly = Object.entries(env).find(([key]) =>
    SAFE_PATTERNS.readonly.test(key) && !UNSAFE_PATTERNS.test(key)
  )?.[1];

  // Build context string
  if (dbName) {
    if (host) {
      context.push(`on '${dbName}' database (${host}${port ? ':' + port : ''})`);
    } else {
      context.push(`on '${dbName}' database`);
    }
  } else if (host) {
    context.push(`connected to ${host}${port ? ':' + port : ''}`);
  }

  // Add readonly mode if specified
  if (readonly && (readonly.toLowerCase() === 'true' || readonly === '1')) {
    context.push('(read-only mode)');
  }

  return context.length > 0 ? ' ' + context.join(' ') : '';
}

async function generateSkillDescription(wrapperDir: string, tools: MCPTool[], env: Record<string, string> = {}): Promise<string> {
  // Read categories from generated index
  let categories: string[] = [];
  try {
    const indexPath = path.join(wrapperDir, 'index.ts');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const categoryMatches = indexContent.match(/export \* as (\w+) from/g);
    categories = categoryMatches?.map(m => m.match(/as (\w+)/)?.[1]).filter((c): c is string => Boolean(c)) || [];
  } catch (e) {
    // Continue without categories
  }

  // Detect MCP purpose from categories and tool names
  const toolNames = tools.map(t => t.name.toLowerCase()).join(' ');
  const categoryNames = categories.join(' ').toLowerCase();
  const allText = `${toolNames} ${categoryNames}`;

  // Browser/Chrome DevTools patterns (check first to avoid false positives from 'select_page')
  if (categories.includes('navigation') || categories.includes('input') || categories.includes('debugging') ||
      allText.includes('browser') || allText.includes('chrome')) {
    const capabilities = [];
    if (categories.includes('navigation') || allText.includes('navigate')) capabilities.push('navigate pages');
    if (categories.includes('input') || allText.includes('click') || allText.includes('fill')) capabilities.push('fill forms');
    if (allText.includes('screenshot')) capabilities.push('take screenshots');
    if (categories.includes('network')) capabilities.push('inspect network');
    if (allText.includes('console') || allText.includes('evaluate')) capabilities.push('debug JavaScript');

    const caps = capabilities.length > 0 ? capabilities.join(', ') : 'automate browser';
    return `Automate browser interactions and testing: ${caps}. Use when testing web pages, automating browser tasks, or debugging web applications.`;
  }

  // Database MCP patterns (more specific checks to avoid false positives)
  if (allText.includes('sql') || allText.includes('database') ||
      allText.includes('insert_data') || allText.includes('read_data') ||
      allText.includes('update_data') || allText.includes('create_table')) {
    const capabilities = [];
    if (allText.includes('read') || allText.includes('select') || allText.includes('query')) capabilities.push('read data');
    if (allText.includes('insert') || allText.includes('write')) capabilities.push('insert records');
    if (allText.includes('update')) capabilities.push('update tables');
    if (allText.includes('delete')) capabilities.push('delete records');
    if (allText.includes('schema')) capabilities.push('manage schemas');

    const caps = capabilities.length > 0 ? capabilities.join(', ') : 'execute SQL queries';
    const dbContext = extractSafeDbContext(env);
    return `Execute SQL database operations${dbContext}: ${caps}. Use when working with databases, running SQL queries, reading/writing data, or managing database tables and schemas.`;
  }

  // Filesystem patterns
  if (allText.includes('file') || allText.includes('read_file') || allText.includes('write_file') ||
      allText.includes('directory') || allText.includes('list_files')) {
    const capabilities = [];
    if (allText.includes('read')) capabilities.push('read files');
    if (allText.includes('write')) capabilities.push('write files');
    if (allText.includes('list') || allText.includes('directory')) capabilities.push('list directories');
    if (allText.includes('delete')) capabilities.push('delete files');

    const caps = capabilities.length > 0 ? capabilities.join(', ') : 'manage files';
    return `File system operations: ${caps}. Use when working with files, reading/writing file contents, or managing directories.`;
  }

  // Git patterns
  if (allText.includes('git') || allText.includes('commit') || allText.includes('branch')) {
    const capabilities = [];
    if (allText.includes('log') || allText.includes('history')) capabilities.push('view history');
    if (allText.includes('diff')) capabilities.push('view changes');
    if (allText.includes('commit')) capabilities.push('commit changes');
    if (allText.includes('branch')) capabilities.push('manage branches');

    const caps = capabilities.length > 0 ? capabilities.join(', ') : 'Git operations';
    return `${caps}. Use when working with Git repositories, viewing commit history, or managing version control.`;
  }

  // Figma patterns
  if (allText.includes('figma') || allText.includes('design') || allText.includes('component')) {
    return `Interact with Figma designs: read files, get components, inspect properties. Use when working with Figma designs or extracting design specifications.`;
  }

  // Generic fallback - build from categories and tool descriptions
  if (categories.length > 0) {
    const descriptions = tools.map(t => t.description || '').filter(d => d);
    const actions = descriptions
      .map(desc => {
        const match = desc.match(/^([A-Z][a-z]+(?:\s+[a-z]+){0,2})/);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(Boolean);

    const uniqueActions = [...new Set(actions)].slice(0, 3);
    const summary = uniqueActions.length > 0 ? uniqueActions.join(', ') : 'execute operations';

    return `Provides ${tools.length} tools for ${summary}. Categories: ${categories.slice(0, 3).join(', ')}. Use when working with related operations or mentioned tools.`;
  }

  return `Execute MCP server operations (${tools.length} tools available). Check the API documentation for specific capabilities.`;
}

async function extractToolsFromWrapper(wrapperDir: string): Promise<MCPTool[]> {
  const tools: MCPTool[] = [];

  async function readDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await readDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('index.ts')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');

          // Extract description from JSDoc comment
          const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
          const descMatch = content.match(/description: ['"`](.+?)['"`]/);
          const nameMatch = content.match(/name: ['"`](.+?)['"`]/);

          if (nameMatch) {
            tools.push({
              name: nameMatch[1],
              description: jsdocMatch?.[1] || descMatch?.[1] || '',
              inputSchema: { type: 'object' }
            });
          }
        } catch (e) {
          // Skip if we can't parse
        }
      }
    }
  }

  try {
    await readDir(wrapperDir);
  } catch (e) {
    // If we can't read tools, return empty array
  }

  return tools;
}

function generateCapabilityHints(tools: MCPTool[]): string {
  const toolNames = tools.map(t => t.name.toLowerCase());
  const hints: string[] = [];

  // Check for listing capabilities
  const hasListTool = toolNames.some(n => n.includes('list'));
  if (hasListTool) {
    hints.push('- Has listing tools - check tool descriptions to see what metadata they return');
  }

  // Check for query/read capabilities
  const hasQueryTool = toolNames.some(n => n.includes('query') || n.includes('read') || n.includes('select'));
  if (hasQueryTool) {
    hints.push('- Has query tools - prefer single queries over multiple calls when possible');
  }

  // Check for batch operations
  const hasBatchParams = tools.some(t => {
    const props = t.inputSchema?.properties || {};
    return Object.keys(props).some(k => k.toLowerCase().includes('batch') ||
                                       k.toLowerCase().includes('multiple') ||
                                       (props[k] as any)?.type === 'array');
  });
  if (hasBatchParams) {
    hints.push('- Some tools accept arrays - use batch operations when available');
  }

  // Generic hints if we detected limitations
  if (!hints.length) {
    hints.push('- Tools process items individually - optimize by reducing call count');
  }

  return hints.join('\n');
}

function printRestartMessage() {
  console.log(`⚠️  IMPORTANT: Restart Claude Code to load new Skills`);
  console.log(`   Run: claude -c`);
}

async function generateSkillWrapper(
  projectPath: string,
  serverName: string,
  wrapperDir: string,
  tools: MCPTool[],
  env: Record<string, string> = {},
  serverType: 'typescript-local' | 'protocol' = 'protocol'
) {
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  await fs.mkdir(skillsDir, { recursive: true });

  const skillName = `mcp-${serverName}`;
  const skillDir = path.join(skillsDir, skillName);

  // Clean and recreate skill directory to ensure fresh install
  await fs.rm(skillDir, { recursive: true, force: true });
  await fs.mkdir(skillDir, { recursive: true });

  // Generate capability-focused description from actual tool metadata
  const description = await generateSkillDescription(wrapperDir, tools, env);

  // Determine import path based on server type
  const importBasePath = serverType === 'typescript-local'
    ? '../../.mcp-server/dist/wrappers'
    : `../../.mcp-wrappers/${path.basename(wrapperDir)}`;

  const wrapperName = path.basename(wrapperDir);

  // Read categories from generated index to find example tools
  let exampleTool: MCPTool | null = null;
  let exampleCategory = 'other';

  try {
    const indexPath = path.join(wrapperDir, 'index.ts');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const categoryMatches = indexContent.match(/export \* as (\w+) from/g);
    const categories = categoryMatches?.map(m => m.match(/as (\w+)/)?.[1]).filter((c): c is string => Boolean(c)) || [];

    // Pick first non-empty category and first tool
    for (const category of categories) {
      const categoryPath = path.join(wrapperDir, category);
      const files = await fs.readdir(categoryPath);
      const toolFile = files.find(f => f.endsWith('.ts') && f !== 'index.ts');

      if (toolFile) {
        exampleCategory = category;
        const toolName = toolFile.replace('.ts', '');
        exampleTool = tools.find(t => t.name === toolName) || null;
        break;
      }
    }
  } catch (e) {
    // Use first tool as fallback
    exampleTool = tools[0] || null;
  }

  // Generate example code based on actual tool
  let exampleCode = '';
  if (exampleTool) {
    const toolName = exampleTool.name;
    const params = exampleTool.inputSchema?.properties ? Object.keys(exampleTool.inputSchema.properties).slice(0, 2) : [];

    // Generate example params based on tool name patterns
    let exampleParams = '{}';
    if (toolName.includes('read') || toolName.includes('query')) {
      exampleParams = `{ query: 'SELECT * FROM users LIMIT 10' }`;
    } else if (toolName.includes('navigate')) {
      exampleParams = `{ type: 'url', url: 'https://example.com' }`;
    } else if (toolName.includes('click')) {
      exampleParams = `{ selector: '#submit-button' }`;
    } else if (toolName.includes('screenshot')) {
      exampleParams = `{ fullPage: false }`;
    } else if (toolName.includes('insert') || toolName.includes('write')) {
      exampleParams = `{ table: 'users', data: { name: 'John' } }`;
    } else if (params.length > 0) {
      exampleParams = `{ ${params[0]}: 'value' }`;
    }

    exampleCode = `import { ${toolName} } from '../../.mcp-wrappers/${wrapperName}/${exampleCategory}/${toolName}.ts';

const result = await ${toolName}(${exampleParams});`;
  } else {
    exampleCode = `import { tool_name } from '../../.mcp-wrappers/${wrapperName}/category/tool_name.ts';

const result = await tool_name({ param: 'value' });`;
  }

  // Create SKILL.md with YAML frontmatter
  const skillContent = `---
name: ${skillName}
description: ${description}
---

# ${serverName} MCP Wrapper

## Response Format

All tools return responses in this format (automatically normalized):
\`\`\`json
{
  "success": true,
  "message": "...",
  "items": [...],    // or "data", "rows", or direct array
  // ... other fields
}
\`\`\`

**Extract data (use this pattern for ALL tools):**
\`\`\`typescript
const data = result.items || result.data || result.rows || result;
\`\`\`

**CREATE FILE IN:** \`.claude/temp/script.ts\`

**IMPORT EXAMPLE (copy this exactly):**
\`\`\`typescript
import { tool_name } from '${importBasePath}/category/tool_name.ts';
\`\`\`

## Complete Template

\`\`\`typescript
// File: .claude/temp/script.ts
import { tool_name} from '${importBasePath}/category/tool_name.ts';

export default async function() {
  // Call tool - responses are automatically normalized
  const result = await tool_name({ param: 'value' });

  // Expected structure after normalization:
  // { success: true, message: "...", items: [...] }
  // OR { data: [...] } OR { rows: [...] } OR direct array [...]

  // Extract data using this exact pattern:
  const data = result.items || result.data || result.rows || result;

  if (Array.isArray(data)) {
    // Process array elements
    data.forEach(item => console.log(item));
  }

  return data;
}
\`\`\`

**Execute:** \`npx tsx .mcp-wrappers/.runtime-executor.ts ${serverName} ./.claude/temp/script.ts\`

## Available Tools

${(() => {
  const categorized = categorizeTools(tools);
  return Object.entries(categorized).map(([cat, catTools]) =>
    `**${cat}/:**\n` + catTools.map(t =>
      `- \`${t.name}\` - ${(t.description || 'No description').split('\n')[0]}`
    ).join('\n')
  ).join('\n\n');
})()}

Full schemas: \`.mcp-wrappers/${wrapperName}/\`

## Example

\`\`\`typescript
// .claude/temp/example.ts
import { ${exampleTool?.name || 'tool_name'} } from '${importBasePath}/${exampleCategory}/${exampleTool?.name || 'tool_name'}.ts';

export default async function() {
  // Responses are automatically normalized
  const result = await ${exampleTool?.name || 'tool_name'}(${exampleCode.match(/await.*?\((.*?)\)/)?.[1] || '{}'});
  console.log(JSON.stringify(result, null, 2));
  return result.items || result.data || result.rows || result;
}
\`\`\`

Run: \`npx tsx .mcp-wrappers/.runtime-executor.ts ${serverName} ./.claude/temp/example.ts\`
Cleanup: \`rm ./.claude/temp/example.ts\`

## Tool Capabilities

${generateCapabilityHints(tools)}

## Best Practices

- **Inspect first:** Always log responses to see structure before processing
- **Avoid loops:** Use tool capabilities instead of iterating client-side
- **Start small:** Test with minimal data before scaling up
- **Batch operations:** Process multiple items in one call when possible

**Response handling:**
\`\`\`typescript
// ✅ Responses are automatically normalized (no manual parsing needed!)
const result = await tool_name({ param: 'value' });

// Inspect structure first
console.log('Response:', JSON.stringify(result, null, 2));

// Extract data (common patterns: .items, .data, .rows, or use result directly)
const data = result.items || result.data || result.rows || result;
\`\`\`

## Troubleshooting

**Cannot find module**
- Use \`../../.mcp-wrappers/\` (TWO dots) with \`.ts\` extension
- File must be in \`.claude/temp/\`

**Wrong data structure**
- Log with \`console.log(JSON.stringify(result, null, 2))\`
- Try \`result.data || result.items || result.rows || result\`
- Responses are automatically normalized - no manual \`content[0].text\` parsing needed

**Must call through executor**
- Run: \`npx tsx .mcp-wrappers/.runtime-executor.ts ${serverName} ./script.ts\`
`;
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    skillContent
  );

  console.log(`   ✅ Created skill: .claude/skills/${skillName}/`);
}

function showHelp() {
  // ANSI color codes
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const blue = '\x1b[34m';
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  console.log(`
${bold}${cyan}MCP Code Wrapper${reset} ${dim}- Generate progressive discovery wrappers for MCP servers${reset}

${bold}USAGE:${reset}
  ${green}npx mcp-code-wrapper${reset} ${yellow}<directory>${reset}    Generate wrappers for project
  ${green}npx mcp-code-wrapper${reset} ${yellow}--global${reset}       Generate wrappers for global MCPs
  ${green}npx mcp-code-wrapper${reset} ${yellow}--restore${reset} [dir] Remove wrappers and re-enable MCPs
  ${green}npx mcp-code-wrapper${reset} ${yellow}--help${reset}         Show this help

${bold}EXAMPLES:${reset}
  ${green}npx mcp-code-wrapper .${reset}              ${dim}# Current directory${reset}
  ${green}npx mcp-code-wrapper /path/to/app${reset}   ${dim}# Specific project${reset}
  ${green}npx mcp-code-wrapper --global${reset}       ${dim}# Global ~/.claude/ MCPs${reset}
  ${green}npx mcp-code-wrapper --restore${reset}      ${dim}# Restore current directory${reset}
  ${green}npx mcp-code-wrapper --restore .${reset}    ${dim}# Restore current directory${reset}

${bold}OPTIONS:${reset}
  ${yellow}--all${reset}                               Generate all servers without prompting (default: interactive)
  ${yellow}--servers <list>${reset}                    Generate specific servers (comma-separated)
  ${yellow}--no-disable${reset}                        Keep MCPs enabled after generating wrappers
  ${yellow}--help, -h${reset}                          Show this help message

${bold}EXAMPLES WITH FLAGS:${reset}
  ${green}npx mcp-code-wrapper . --servers mssql-main,chrome-devtools${reset}
  ${green}npx mcp-code-wrapper . --all --no-disable${reset}

${bold}MORE INFO:${reset}
  ${blue}https://github.com/paddo/mcp-code-wrapper${reset}
`);
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  // Remove flags and their values from args for path detection
  const flagsWithValues = ['--servers', '--from-mcp-json', '--server', '--env'];
  const pathArgs: string[] = [];
  const flags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--') || arg.startsWith('-')) {
      flags.push(arg);
      // Skip next arg if this flag takes a value
      if (flagsWithValues.includes(arg) && i + 1 < args.length) {
        i++; // Skip the value
      }
    } else {
      // Check if previous arg was a flag that takes a value
      const prevArg = args[i - 1];
      if (!prevArg || !flagsWithValues.includes(prevArg)) {
        pathArgs.push(arg);
      }
    }
  }

  // Help mode
  if (flags.includes('--help') || flags.includes('-h')) {
    showHelp();
    return;
  }

  // Restore mode
  if (flags.includes('--restore')) {
    const projectPath = pathArgs.length > 0 ? path.resolve(pathArgs[0]) : process.cwd();
    await restoreProject(projectPath);
    return;
  }

  // Check for disable flag (default is true)
  const disableMCPs = !flags.includes('--no-disable');
  const isGlobal = flags.includes('--global');
  const interactive = !flags.includes('--all');

  // Parse --servers flag
  const serversIndex = args.indexOf('--servers');
  let specifiedServers: string[] | undefined;
  if (serversIndex !== -1 && args[serversIndex + 1]) {
    specifiedServers = args[serversIndex + 1].split(',').map(s => s.trim());
  }

  // Show help if no directory provided and not in global mode
  if (pathArgs.length === 0 && !isGlobal) {
    showHelp();
    return;
  }

  // Global mode: explicit --global flag
  if (isGlobal) {
    console.log('\n🌍 Running in GLOBAL mode\n');

    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) {
      throw new Error('Could not determine home directory');
    }

    const claudeDir = path.join(home, '.claude');
    const mcpJsonPath = await discoverGlobalMCPConfig();

    if (!mcpJsonPath) {
      console.log(`⚠️  No MCP config found in ~/.claude/`);
      console.log(`   Expected: ~/.claude/mcp.json or ~/.claude/.mcp.json`);
      console.log();
      console.log(`   To generate for a specific project instead:`);
      console.log(`   npx mcp-code-wrapper /path/to/project`);
      return;
    }

    console.log(`✅ Found ${mcpJsonPath}\n`);

    // Generate in ~/.claude/.mcp-wrappers/
    await generateAllFromProject(claudeDir, true, disableMCPs, interactive, specifiedServers);
    return;
  }

  // Project mode: use provided path or current directory
  const projectPath = pathArgs.length > 0 ? path.resolve(pathArgs[0]) : process.cwd();
  if (pathArgs.length <= 1) {
    try {
      const stat = await fs.stat(projectPath);
      if (stat.isDirectory()) {
        // Auto-discover and generate all MCPs
        await generateAllFromProject(projectPath, true, disableMCPs, interactive, specifiedServers);
        return;
      }
    } catch (error: any) {
      // Check if it's just a "not a directory" error
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        // Not a directory, continue with other parsing
      } else {
        // Actual error in generateAllFromProject, re-throw
        throw error;
      }
    }
  }

  let command: string;
  let commandArgs: string[];
  let env: Record<string, string> = {};
  let outputDir = 'api-universal';
  let serverName = 'MCP';

  // Check for --from-mcp-json flag
  const mcpJsonIndex = args.indexOf('--from-mcp-json');
  const serverIndex = args.indexOf('--server');
  const envIndex = args.indexOf('--env');

  if (mcpJsonIndex !== -1 && serverIndex !== -1) {
    // Load from .mcp.json
    const mcpJsonPath = args[mcpJsonIndex + 1];
    const server = args[serverIndex + 1];

    console.log(`\n📖 Loading config from ${mcpJsonPath} (server: ${server})\n`);

    const config = await loadMCPConfig(mcpJsonPath, server);
    command = config.command;
    commandArgs = config.args;
    env = config.env;
    serverName = server;
  } else if (envIndex !== -1) {
    // Parse --env flag
    const envString = args[envIndex + 1];
    env = parseEnvString(envString);

    // Get command/args (everything before --env)
    const beforeEnv = args.slice(0, envIndex);
    command = beforeEnv[0];
    commandArgs = beforeEnv.slice(1);

    if (!command || commandArgs.length === 0) {
      throw new Error('Must provide command and args when using --env flag');
    }
  } else {
    // Traditional CLI: pnpm run generate <command> <args...>
    if (!args[0] || !args[1]) {
      throw new Error('Must provide MCP server command and args (e.g., node /path/to/server.js)');
    }
    command = args[0];
    commandArgs = args.slice(1);
  }

  // Set env vars for the spawned process
  if (Object.keys(env).length > 0) {
    Object.assign(process.env, env);
  }

  console.log(`\n🚀 Command: ${command} ${commandArgs.join(' ')}\n`);
  if (Object.keys(env).length > 0) {
    console.log(`🔐 Environment: ${Object.keys(env).length} variables\n`);
  }

  await generateFilesystem(command, commandArgs, outputDir, serverName, env);
}

main().catch(console.error);
