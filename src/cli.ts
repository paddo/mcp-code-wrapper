#!/usr/bin/env node

/**
 * MCP Code Wrapper CLI
 *
 * Usage:
 *   npx mcp-code-wrapper                     # Generate wrappers for current directory
 *   npx mcp-code-wrapper /path/to/project    # Generate wrappers for project MCPs
 *   npx mcp-code-wrapper --global            # Generate wrappers for global MCPs (~/.claude/)
 */

// Import and run the generator
import './generator-universal.js';
