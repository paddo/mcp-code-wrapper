/**
 * Hover over the provided element
 * @category input
 * @source chrome-devtools-mcp
 */
export async function hover(params: { uid?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'hover',
  category: 'input',
  description: 'Hover over the provided element',
  parameters: [
  "uid"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "uid": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "The uid of an element on the page from the page content snapshot"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
