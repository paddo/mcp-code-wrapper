/**
 * Take a text snapshot of the currently selected page based on the a11y tree. The snapshot lists page elements along with a unique
identifier (uid). Always use the latest snapshot. Prefer taking a snapshot over taking a screenshot.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function take_snapshot(params: { verbose?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'take_snapshot',
  category: 'debugging',
  description: 'Take a text snapshot of the currently selected page based on the a11y tree. The snapshot lists page elements along with a unique
identifier (uid). Always use the latest snapshot. Prefer taking a snapshot over taking a screenshot.',
  parameters: [
  "verbose"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "verbose": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "typeName": "ZodBoolean",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "Whether to include all possible information available in the full a11y tree. Default is false."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
