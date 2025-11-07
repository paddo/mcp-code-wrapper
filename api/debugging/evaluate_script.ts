/**
 * Execute JavaScript
 * @category debugging
 */
export async function evaluate_script(script, pageId?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'evaluate_script',
  category: 'debugging',
  description: 'Execute JavaScript',
  parameters: [
  "script",
  "pageId?"
],
};
