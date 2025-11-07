/**
 * If a browser dialog was opened, use this command to handle it
 * @category navigation
 * @source chrome-devtools-mcp
 */
export async function handle_dialog(params: { action?: any, promptText?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'handle_dialog',
  category: 'navigation',
  description: 'If a browser dialog was opened, use this command to handle it',
  parameters: [
  "action",
  "promptText"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "action": {
    //         "_def": {
    //             "values": [
    //                 "accept",
    //                 "dismiss"
    //             ],
    //             "typeName": "ZodEnum",
    //             "description": "Whether to dismiss or accept the dialog"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "promptText": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [],
    //                     "typeName": "ZodString",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "Optional prompt text to enter into the dialog."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
