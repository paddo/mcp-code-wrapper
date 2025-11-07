/**
 * Record DOM snapshots
 * @category debugging
 */
export async function take_snapshot(options?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'take_snapshot',
  category: 'debugging',
  description: 'Record DOM snapshots',
  parameters: [
  "options?"
],
};
