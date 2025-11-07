/**
 * Gets a console message by its ID. You can get all messages by calling list_console_messages.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function get_console_message(params: { msgid?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'get_console_message',
  category: 'debugging',
  description: 'Gets a console message by its ID. You can get all messages by calling list_console_messages.',
  parameters: [
  "msgid"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "msgid": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodNumber",
    //             "coerce": false,
    //             "description": "The msgid of a console message on the page from the listed console messages"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
