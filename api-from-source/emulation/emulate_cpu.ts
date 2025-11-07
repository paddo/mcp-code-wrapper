/**
 * Emulates CPU throttling by slowing down the selected page's execution.
 * @category emulation
 * @source chrome-devtools-mcp
 */
export async function emulate_cpu(params: { throttlingRate?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'emulate_cpu',
  category: 'emulation',
  description: 'Emulates CPU throttling by slowing down the selected page's execution.',
  parameters: [
  "throttlingRate"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "throttlingRate": {
    //         "_def": {
    //             "checks": [
    //                 {
    //                     "kind": "min",
    //                     "value": 1,
    //                     "inclusive": true
    //                 },
    //                 {
    //                     "kind": "max",
    //                     "value": 20,
    //                     "inclusive": true
    //                 }
    //             ],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "The CPU throttling rate representing the slowdown factor 1-20x. Set the rate to 1 to disable throttling"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
