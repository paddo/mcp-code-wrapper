/**
 * Adjust viewport dimensions
 * @category emulation
 */
export async function resize_page(width, height): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'resize_page',
  category: 'emulation',
  description: 'Adjust viewport dimensions',
  parameters: [
  "width",
  "height"
],
};
