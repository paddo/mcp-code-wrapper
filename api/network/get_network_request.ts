/**
 * Retrieve request details
 * @category network
 */
export async function get_network_request(requestId): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'get_network_request',
  category: 'network',
  description: 'Retrieve request details',
  parameters: [
  "requestId"
],
};
