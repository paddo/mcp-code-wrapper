/**
 * View open pages
 * @category navigation
 */
export async function list_pages(): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'list_pages',
  category: 'navigation',
  description: 'View open pages',
  parameters: [],
};
