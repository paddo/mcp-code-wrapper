/**
 * Pause for conditions
 * @category navigation
 */
export async function wait_for(condition, timeout?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'wait_for',
  category: 'navigation',
  description: 'Pause for conditions',
  parameters: [
  "condition",
  "timeout?"
],
};
