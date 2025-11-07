/**
 * End trace and process data
 * @category performance
 */
export async function performance_stop_trace(): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'performance_stop_trace',
  category: 'performance',
  description: 'End trace and process data',
  parameters: [],
};
