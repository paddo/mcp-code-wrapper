#!/usr/bin/env node

/**
 * MCP Code Wrapper CLI
 *
 * Usage:
 *   npx mcp-code-wrapper /path/to/project    # Generate wrappers for project MCPs
 *   npx mcp-code-wrapper                     # Generate wrappers for global MCPs
 *   npx mcp-code-wrapper --global            # Same as above (explicit)
 */

// Import and run the generator
import './generator-universal.js';
