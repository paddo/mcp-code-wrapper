/**
 * Manage browser dialogs
 * @category input
 */
export async function handle_dialog(accept, text?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'handle_dialog',
  category: 'input',
  description: 'Manage browser dialogs',
  parameters: [
  "accept",
  "text?"
],
};
