/**
 * Take a screenshot of the page or element.
 * @category debugging
 * @source chrome-devtools-mcp
 */
export async function take_screenshot(params: { format?: any, quality?: any, uid?: any, fullPage?: any, filePath?: any }): Promise<any> {
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
  description: 'Take a screenshot of the page or element.',
  parameters: [
  "format",
  "quality",
  "uid",
  "fullPage",
  "filePath"
],
  readOnly: true,
  schema: {
    // Zod schema from chrome-devtools-mcp
    // {
    //     "format": {
    //         "_def": {
    //             "description": "Type of format to save the screenshot as. Default is \"png\"",
    //             "innerType": {
    //                 "_def": {
    //                     "values": [
    //                         "png",
    //                         "jpeg",
    //                         "webp"
    //                     ],
    //                     "typeName": "ZodEnum"
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodDefault"
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "quality": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [
    //                         {
    //                             "kind": "min",
    //                             "value": 0,
    //                             "inclusive": true
    //                         },
    //                         {
    //                             "kind": "max",
    //                             "value": 100,
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
    //             "description": "Compression quality for JPEG and WebP formats (0-100). Higher values mean better quality but larger file sizes. Ignored for PNG format."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "uid": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [],
    //                     "typeName": "ZodString",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "The uid of an element on the page from the page content snapshot. If omitted takes a pages screenshot."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "fullPage": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "typeName": "ZodBoolean",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "If set to true takes a screenshot of the full page instead of the currently visible viewport. Incompatible with uid."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     },
    //     "filePath": {
    //         "_def": {
    //             "innerType": {
    //                 "_def": {
    //                     "checks": [],
    //                     "typeName": "ZodString",
    //                     "coerce": false
    //                 },
    //                 "~standard": {
    //                     "version": 1,
    //                     "vendor": "zod"
    //                 }
    //             },
    //             "typeName": "ZodOptional",
    //             "description": "The absolute path, or a path relative to the current working directory, to save the screenshot to instead of attaching it to the response."
    //         },
    //         "~standard": {
    //             "version": 1,
    //             "vendor": "zod"
    //         }
    //     }
    // }
  },
};
