/**
 * View all logs
 * @category debugging
 */
export async function list_console_messages(filter?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'list_console_messages',
  category: 'debugging',
  description: 'View all logs',
  parameters: [
  "filter?"
],
};
