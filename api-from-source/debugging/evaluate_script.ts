/**
 * Evaluate a JavaScript function inside the currently selected page. Returns the response as JSON
so returned values have to JSON-serializable.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function evaluate_script(params: { function?: any, args?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'evaluate_script',
  category: 'debugging',
  description: 'Evaluate a JavaScript function inside the currently selected page. Returns the response as JSON
so returned values have to JSON-serializable.',
  parameters: [
  "function",
  "args"
],
  readOnly: false,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "function": {
    //         "_def": {
    //             "checks": [],
    //             "typeName": "ZodString",
    //             "coerce": false,
    //             "description": "A JavaScript function declaration to be executed by the tool in the currently selected page.\nExample without arguments: `() => {\n  return document.title\n}` or `async () => {\n  return await fetch(\"example.com\")\n}`.\nExample with arguments: `(el) => {\n  return el.innerText;\n}`\n"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "args": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "type": {
    //                         "_def": {
    //                             "unknownKeys": "strip",
    //                             "catchall": {
    //                                 "_def": {
    //                                     "typeName": "ZodNever"
    //                                 },
    //                                 "~standard": {
    //                                     "version": 1,
    //                                     "vendor": "zod"
    //                                 }
    //                             },
    //                             "typeName": "ZodObject"
    //                         },
    //                         "~standard": {
    //                             "version": 1,
    //                             "vendor": "zod"
    //                         },
    //                         "_cached": null
    //                     },
    //                     "minLength": null,
    //                     "maxLength": null,
    //                     "exactLength": null,
    //                     "typeName": "ZodArray"
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "An optional list of arguments to pass to the function."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
