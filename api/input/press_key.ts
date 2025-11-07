/**
 * Simulate keyboard input
 * @category input
 */
export async function press_key(key): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'press_key',
  category: 'input',
  description: 'Simulate keyboard input',
  parameters: [
  "key"
],
};
