/**
 * Submit file inputs
 * @category input
 */
export async function upload_file(selector, filePath): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'upload_file',
  category: 'input',
  description: 'Submit file inputs',
  parameters: [
  "selector",
  "filePath"
],
};
