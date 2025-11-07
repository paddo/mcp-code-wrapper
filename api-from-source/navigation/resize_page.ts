/**
 * Resizes the selected page's window so that the page has specified dimension
 * @category navigation
 * @source chrome-devtools-mcp
 */
export async function resize_page(params: { width?: any, height?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'resize_page',
  category: 'navigation',
  description: 'Resizes the selected page's window so that the page has specified dimension',
  parameters: [
  "width",
  "height"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "width": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "Page width"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "height": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "Page height"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
