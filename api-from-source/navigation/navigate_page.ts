/**
 * Navigates the currently selected page to a URL.
 * @category navigation
 * @source chrome-devtools-mcp
 */
export async function navigate_page(params: { url?: any, timeout?: any }): Promise<any> {
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
  description: 'Navigates the currently selected page to a URL.',
  parameters: [
  "url",
  "timeout"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "url": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "URL to navigate the page to"
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
