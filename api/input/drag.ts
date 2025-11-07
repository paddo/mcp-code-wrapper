/**
 * Perform drag operations
 * @category input
 */
export async function drag(fromSelector, toSelector): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'drag',
  category: 'input',
  description: 'Perform drag operations',
  parameters: [
  "fromSelector",
  "toSelector"
],
};
