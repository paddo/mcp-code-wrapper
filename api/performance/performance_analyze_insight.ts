/**
 * Extract optimization recommendations
 * @category performance
 */
export async function performance_analyze_insight(traceData): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'performance_analyze_insight',
  category: 'performance',
  description: 'Extract optimization recommendations',
  parameters: [
  "traceData"
],
};
