/**
 * Fetch individual log entries
 * @category debugging
 */
export async function get_console_message(messageId): Promise<any> {
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
  description: 'Fetch individual log entries',
  parameters: [
  "messageId"
],
};
