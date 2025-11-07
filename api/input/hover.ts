/**
 * Trigger hover states
 * @category input
 */
export async function hover(selector): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'hover',
  category: 'input',
  description: 'Trigger hover states',
  parameters: [
  "selector"
],
};
