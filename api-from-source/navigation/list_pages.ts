/**
 * Get a list of pages open in the browser.
 * @category navigation
 * @source chrome-devtools-mcp
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
  description: 'Get a list of pages open in the browser.',
  parameters: [],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {}
  },
};
