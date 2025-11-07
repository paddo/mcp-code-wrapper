/**
 * Create fresh tabs
 * @category navigation
 */
export async function new_page(url?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'new_page',
  category: 'navigation',
  description: 'Create fresh tabs',
  parameters: [
  "url?"
],
};
