/**
 * MCP Code Execution Environment
 * Executes user code and maps API calls to actual MCP tool invocations
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

interface MCPConfig {
  command: string;
  args: string[];
  description?: string;
}

/**
 * MCP Client that communicates with MCP server via stdio
 */
export class MCPClient extends EventEmitter {
  private process: any;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';
  private config?: MCPConfig;
  private env?: Record<string, string>;

  async start(serverName?: string) {
    // Load config from .mcp.json
    try {
      const mcpJsonPath = join(process.cwd(), '.mcp.json');
      const mcpContent = await readFile(mcpJsonPath, 'utf-8');
      const mcpConfig = JSON.parse(mcpContent);

      // Use specified server or first available
      const server = serverName || Object.keys(mcpConfig.mcpServers || {})[0];

      if (!server || !mcpConfig.mcpServers?.[server]) {
        throw new Error(`Server "${server}" not found in .mcp.json`);
      }

      const serverConfig = mcpConfig.mcpServers[server];
      this.config = {
        command: serverConfig.command,
        args: serverConfig.args || []
      };
      this.env = serverConfig.env || {};

      console.log(`📡 Using MCP server: ${server}`);
    } catch (e) {
      // Fallback to Chrome DevTools if no config found
      console.warn('⚠️  No .mcp.json found, using default Chrome DevTools MCP');
      this.config = {
        command: 'npx',
        args: ['-y', 'chrome-devtools-mcp@latest']
      };
      this.env = {};
    }

    // Start MCP server with config
    this.process = spawn(this.config.command, this.config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...this.env }
    });

    // Handle stdout data
    this.process.stdout.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    // Handle stderr
    this.process.stderr.on('data', (data: Buffer) => {
      console.error('MCP stderr:', data.toString());
    });

    // Wait for initialization
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
            pending.reject(new Error(response.error.message || 'MCP error'));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch (e) {
        console.error('Failed to parse MCP response:', line);
      }
    }
  }

  private async initialize() {
    // Send initialize request
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-code-wrapper',
        version: '1.0.0',
      },
    });

    // Send initialized notification
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

      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
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

  /**
   * Call an MCP tool
   */
  async callTool(name: string, args: any = {}): Promise<any> {
    const result = await this.request('tools/call', {
      name,
      arguments: args,
    });
    return result;
  }

  /**
   * List available tools (for debugging)
   */
  async listTools(): Promise<any> {
    return await this.request('tools/list', {});
  }

  async stop() {
    if (this.process) {
      this.process.kill();
    }
  }
}

/**
 * Build API proxy that maps function calls to MCP tool calls
 */
export function buildAPIProxy(client: MCPClient) {
  const api: any = {};

  const categories = {
    input: ['click', 'drag', 'fill', 'fill_form', 'handle_dialog', 'hover', 'press_key', 'upload_file'],
    navigation: ['close_page', 'list_pages', 'navigate_page', 'new_page', 'select_page', 'wait_for'],
    emulation: ['emulate', 'resize_page'],
    performance: ['performance_analyze_insight', 'performance_start_trace', 'performance_stop_trace'],
    network: ['get_network_request', 'list_network_requests'],
    debugging: ['evaluate_script', 'get_console_message', 'list_console_messages', 'take_screenshot', 'take_snapshot'],
  };

  for (const [category, tools] of Object.entries(categories)) {
    api[category] = {};
    for (const tool of tools) {
      api[category][tool] = async (...args: any[]) => {
        // Map positional arguments to named parameters based on tool schema
        const params = mapArgsToParams(tool, args);
        return await client.callTool(tool, params);
      };
    }
  }

  return api;
}

/**
 * Map positional arguments to named parameters
 * This is a simplified version - in production, you'd want proper schema mapping
 */
function mapArgsToParams(toolName: string, args: any[]): any {
  // For now, just return the first argument if it's an object, otherwise create a simple mapping
  if (args.length === 0) return {};
  if (args.length === 1 && typeof args[0] === 'object') return args[0];

  // Simple mapping for common cases
  const paramMappings: Record<string, string[]> = {
    navigate_page: ['url', 'options'],
    click: ['selector', 'options'],
    fill: ['selector', 'value'],
    take_screenshot: ['options'],
    evaluate_script: ['script', 'pageId'],
  };

  const paramNames = paramMappings[toolName] || [];
  const params: any = {};
  args.forEach((arg, i) => {
    if (paramNames[i]) {
      params[paramNames[i]] = arg;
    }
  });

  return params;
}

/**
 * Execute user code with MCP API proxy
 */
export async function executeCode(code: string, client: MCPClient): Promise<any> {
  const api = buildAPIProxy(client);

  // Create a function that has access to the API
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const executor = new AsyncFunction('api', code);

  try {
    const result = await executor(api);
    return result;
  } catch (error: any) {
    throw new Error(`Execution error: ${error.message}`);
  }
}
