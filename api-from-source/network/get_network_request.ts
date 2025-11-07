/**
 * Gets a network request by URL. You can get all requests by calling list_network_requests.
 * @category network
 * @source chrome-devtools-mcp
 */
export async function get_network_request(params: { reqid?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'get_network_request',
  category: 'network',
  description: 'Gets a network request by URL. You can get all requests by calling list_network_requests.',
  parameters: [
  "reqid"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "reqid": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "The reqid of a request on the page from the listed network requests"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
