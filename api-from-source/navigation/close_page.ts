/**
 * Closes the page by its index. The last open page cannot be closed.
 * @category navigation
 * @source chrome-devtools-mcp
 */
export async function close_page(params: { pageIdx?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'close_page',
  category: 'navigation',
  description: 'Closes the page by its index. The last open page cannot be closed.',
  parameters: [
  "pageIdx"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "pageIdx": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "The index of the page to close. Call list_pages to list pages."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
