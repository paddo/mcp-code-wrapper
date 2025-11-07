/**
 * Wait for the specified text to appear on the selected page.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function wait_for(params: { text?: any, timeout?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'wait_for',
  category: 'debugging',
  description: 'Wait for the specified text to appear on the selected page.',
  parameters: [
  "text",
  "timeout"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "text": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "Text to appear on the page"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "timeout": {
    //         "_def": {
    //             "description": "Maximum wait time in milliseconds. If set to 0, the default timeout will be used.",
    //             "schema": {
    //                 "_def": {
    //                     "innerType": {
    //                         "_def": {
    //                             "checks": [
    //                                 {
    //                                     "kind": "int"
    //                                 }
    //                             ],
    //                             "typeName": "ZodNumber",
    //                             "coerce": false
    //                         },
    //                         "~standard": {
    //                             "version": 1,
    //                             "vendor": "zod"
    //                         }
    //                     },
    //                     "typeName": "ZodOptional",
    //                     "description": "Maximum wait time in milliseconds. If set to 0, the default timeout will be used."
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodEffects",
    //             "effect": {
    //                 "type": "transform"
    //             }
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
