/**
 * View all captured requests
 * @category network
 */
export async function list_network_requests(filter?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'list_network_requests',
  category: 'network',
  description: 'View all captured requests',
  parameters: [
  "filter?"
],
};
