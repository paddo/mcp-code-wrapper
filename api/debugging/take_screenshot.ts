/**
 * Capture visual state
 * @category debugging
 */
export async function take_screenshot(options?): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'take_screenshot',
  category: 'debugging',
  description: 'Capture visual state',
  parameters: [
  "options?"
],
};
