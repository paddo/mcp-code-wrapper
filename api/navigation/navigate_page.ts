/**
 * Load URLs
 * @category navigation
 */
export async function navigate_page(url, options?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'navigate_page',
  category: 'navigation',
  description: 'Load URLs',
  parameters: [
  "url",
  "options?"
],
};
