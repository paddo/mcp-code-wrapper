/**
 * Select a page as a context for future tool calls.
 * @category navigation
 * @source chrome-devtools-mcp
 */
export async function select_page(params: { pageIdx?: any }): Promise<any> {
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
  description: 'Select a page as a context for future tool calls.',
  parameters: [
  "pageIdx"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "pageIdx": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "The index of the page to select. Call list_pages to list pages."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
