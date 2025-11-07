/**
 * List all requests for the currently selected page since the last navigation.
 * @category network
 * @source chrome-devtools-mcp
 */
export async function list_network_requests(params: { pageSize?: any, pageIdx?: any, resourceTypes?: any, includePreservedRequests?: any }): Promise<any> {
  // This function is executed by the MCP wrapper
  // The actual MCP tool call will be intercepted and executed
  throw new Error('This function should be called through the MCP executor');
}

/**
 * Tool metadata for progressive discovery
 */
export const metadata = {
  name: 'list_network_requests',
  category: 'network',
  description: 'List all requests for the currently selected page since the last navigation.',
  parameters: [
  "pageSize",
  "pageIdx",
  "resourceTypes",
  "includePreservedRequests"
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
    //             "description": "Maximum number of requests to return. When omitted, returns all requests."
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
    //     "resourceTypes": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "type": {
    //                         "_def": {
    //                             "values": [
    //                                 "document",
    //                                 "stylesheet",
    //                                 "image",
    //                                 "media",
    //                                 "font",
    //                                 "script",
    //                                 "texttrack",
    //                                 "xhr",
    //                                 "fetch",
    //                                 "prefetch",
    //                                 "eventsource",
    //                                 "websocket",
    //                                 "manifest",
    //                                 "signedexchange",
    //                                 "ping",
    //                                 "cspviolationreport",
    //                                 "preflight",
    //                                 "fedcm",
    //                                 "other"
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
    //             "description": "Filter requests to only return requests of the specified resource types. When omitted or empty, returns all requests."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "includePreservedRequests": {
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
    //             "description": "Set to true to return the preserved requests over the last 3 navigations."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
