/**
 * Complete multiple form fields
 * @category input
 */
export async function fill_form(formData): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'fill_form',
  category: 'input',
  description: 'Complete multiple form fields',
  parameters: [
  "formData"
],
};
