/**
 * Drag an element onto another element
 * @category input
 * @source chrome-devtools-mcp
 */
export async function drag(params: { from_uid?: any, to_uid?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'drag',
  category: 'input',
  description: 'Drag an element onto another element',
  parameters: [
  "from_uid",
  "to_uid"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "from_uid": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "The uid of the element to drag"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "to_uid": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "The uid of the element to drop into"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
