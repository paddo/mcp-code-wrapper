/**
 * Emulates network conditions such as throttling or offline mode on the selected page.
 * @category emulation
 * @source chrome-devtools-mcp
 */
export async function emulate_network(params: { throttlingOption?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'emulate_network',
  category: 'emulation',
  description: 'Emulates network conditions such as throttling or offline mode on the selected page.',
  parameters: [
  "throttlingOption"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "throttlingOption": {
    //         "_def": {
    //             "values": [
    //                 "No emulation",
    //                 "Offline",
    //                 "Slow 3G",
    //                 "Fast 3G",
    //                 "Slow 4G",
    //                 "Fast 4G"
    //             ],
    //             "typeName": "ZodEnum",
    //             "description": "The network throttling option to emulate. Available throttling options are: No emulation, Offline, Slow 3G, Fast 3G, Slow 4G, Fast 4G. Set to \"No emulation\" to disable. Set to \"Offline\" to simulate offline network conditions."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
