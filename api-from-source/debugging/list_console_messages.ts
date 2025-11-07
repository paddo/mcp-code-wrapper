/**
 * List all console messages for the currently selected page since the last navigation.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function list_console_messages(params: { pageSize?: any, pageIdx?: any, types?: any, includePreservedMessages?: any }): Promise<any> {
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
  description: 'List all console messages for the currently selected page since the last navigation.',
  parameters: [
  "pageSize",
  "pageIdx",
  "types",
  "includePreservedMessages"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "pageSize": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [
    //                         {
    //                             "kind": "int"
    //                         },
    //                         {
    //                             "kind": "min",
    //                             "value": 0,
    //                             "inclusive": false
    //                         }
    //                     ],
    //                     "typeName": "ZodNumber",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "Maximum number of messages to return. When omitted, returns all requests."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "pageIdx": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [
    //                         {
    //                             "kind": "int"
    //                         },
    //                         {
    //                             "kind": "min",
    //                             "value": 0,
    //                             "inclusive": true
    //                         }
    //                     ],
    //                     "typeName": "ZodNumber",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "Page number to return (0-based). When omitted, returns the first page."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "types": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "type": {
    //                         "_def": {
    //                             "values": [
    //                                 "log",
    //                                 "debug",
    //                                 "info",
    //                                 "error",
    //                                 "warn",
    //                                 "dir",
    //                                 "dirxml",
    //                                 "table",
    //                                 "trace",
    //                                 "clear",
    //                                 "startGroup",
    //                                 "startGroupCollapsed",
    //                                 "endGroup",
    //                                 "assert",
    //                                 "profile",
    //                                 "profileEnd",
    //                                 "count",
    //                                 "timeEnd",
    //                                 "verbose"
    //                             ],
    //                             "typeName": "ZodEnum"
    //                         },
    //                         "~standard": {
    //                             "version": 1,
    //                             "vendor": "zod"
    //                         }
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
    //             "description": "Filter messages to only return messages of the specified resource types. When omitted or empty, returns all messages."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "includePreservedMessages": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "innerType": {
    //                         "_def": {
    //                             "typeName": "ZodBoolean",
    //                             "coerce": false
    //                         },
    //                         "~standard": {
    //                             "version": 1,
    //                             "vendor": "zod"
    //                         }
    //                     },
    //                     "typeName": "ZodDefault"
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "Set to true to return the preserved messages over the last 3 navigations."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
