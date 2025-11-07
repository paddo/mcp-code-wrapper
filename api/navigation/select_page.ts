/**
 * Switch between pages
 * @category navigation
 */
export async function select_page(pageId): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'select_page',
  category: 'navigation',
  description: 'Switch between pages',
  parameters: [
  "pageId"
],
};
