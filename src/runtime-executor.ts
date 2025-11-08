/**
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
    const lines = this.buffer.split('\n');
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
      this.process.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
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
    this.process.stdin.write(JSON.stringify(notification) + '\n');
  }

  async callTool(name: string, args: any = {}): Promise<any> {
    const result = await this.request('tools/call', {
      name,
      arguments: args,
    });
    return result;
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
    throw new Error(`Server "${actualServerName}" not found in .mcp.json`);
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
 * Execute user code with MCP client active
 */
async function executeCode(serverName: string, codeFile: string) {
  console.log(`🚀 Starting MCP executor for server: ${serverName}\n`);

  // Load server config
  const config = await loadServerConfig(serverName);
  console.log(`📡 Spawning MCP server: ${config.command} ${config.args.join(' ')}\n`);

  // Start MCP client
  const client = new MCPClient();
  await client.start(config.command, config.args, config.env);

  console.log(`✅ MCP client ready\n`);

  // Create global proxy for wrapper functions
  const wrapperProxy = createWrapperProxy(client);

  // Make the proxy available globally for imports
  (global as any).__mcpClient = client;
  (global as any).__mcpWrapper = wrapperProxy;

  // Read and execute user code
  console.log(`📝 Executing: ${codeFile}\n`);
  console.log('='.repeat(70));
  console.log('OUTPUT:');
  console.log('='.repeat(70) + '\n');

  try {
    // Import and execute the code file
    const codeModule = await import(pathToFileURL(codeFile).href);

    // If it has a default export that's a function, call it
    if (typeof codeModule.default === 'function') {
      const result = await codeModule.default();
      if (result !== undefined) {
        console.log('\n' + '='.repeat(70));
        console.log('RESULT:');
        console.log('='.repeat(70));
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (error: any) {
    console.error('\n❌ Execution error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    console.log('\n' + '='.repeat(70));
    await client.stop();
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx .mcp-wrappers/.runtime-executor.ts <server-name> <code-file>');
    console.log('\nExample:');
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
