/**
 * Token measurement tool
 * Compare token usage between direct MCP and code execution approaches
 */

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { MCPClient } from './executor.js';

// Simple token estimator (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function measureDirectMCP() {
  console.log('📊 Measuring Direct MCP Approach\n');

  const client = new MCPClient();
  await client.start();

  // Get all tools from MCP server
  const toolsList = await client.listTools();

  // Estimate tokens for tool definitions
  const toolsJson = JSON.stringify(toolsList, null, 2);
  const tokens = estimateTokens(toolsJson);

  console.log(`Tool definitions loaded: ${toolsList.tools?.length || 0} tools`);
  console.log(`Estimated tokens: ${tokens.toLocaleString()}`);
  console.log(`Actual JSON size: ${toolsJson.length.toLocaleString()} characters\n`);

  await client.stop();

  return {
    approach: 'Direct MCP',
    toolCount: toolsList.tools?.length || 0,
    tokens,
    characters: toolsJson.length,
  };
}

async function measureCodeExecution() {
  console.log('📊 Measuring Code Execution Approach\n');

  const apiDir = path.join(process.cwd(), 'api');

  // Measure root index
  const rootIndex = await readFile(path.join(apiDir, 'index.ts'), 'utf-8');
  const rootTokens = estimateTokens(rootIndex);
  console.log(`Root index (api/index.ts): ${rootTokens} tokens`);

  // Measure a typical discovery workflow:
  // 1. Read root index
  // 2. Read navigation category index
  // 3. Read 2 tool files (navigate_page, take_screenshot)

  const navIndex = await readFile(path.join(apiDir, 'navigation/index.ts'), 'utf-8');
  const navTokens = estimateTokens(navIndex);
  console.log(`Navigation index: ${navTokens} tokens`);

  const navigateTool = await readFile(path.join(apiDir, 'navigation/navigate_page.ts'), 'utf-8');
  const navigateTokens = estimateTokens(navigateTool);
  console.log(`navigate_page tool: ${navigateTokens} tokens`);

  const screenshotTool = await readFile(path.join(apiDir, 'debugging/take_screenshot.ts'), 'utf-8');
  const screenshotTokens = estimateTokens(screenshotTool);
  console.log(`take_screenshot tool: ${screenshotTokens} tokens`);

  // User code
  const userCode = `
    await api.navigation.navigate_page('http://localhost:4321');
    const screenshot = await api.debugging.take_screenshot({ fullPage: true });
    return { success: true };
  `;
  const codeTokens = estimateTokens(userCode);
  console.log(`User code: ${codeTokens} tokens`);

  const totalTokens = rootTokens + navTokens + navigateTokens + screenshotTokens + codeTokens;
  console.log(`\nTotal tokens for typical task: ${totalTokens}\n`);

  return {
    approach: 'Code Execution (Progressive Discovery)',
    breakdown: {
      rootIndex: rootTokens,
      categoryIndex: navTokens,
      tool1: navigateTokens,
      tool2: screenshotTokens,
      userCode: codeTokens,
    },
    tokens: totalTokens,
  };
}

async function main() {
  console.log('🔬 Token Usage Comparison: Direct MCP vs Code Execution\n');
  console.log('=' .repeat(70) + '\n');

  const directResult = await measureDirectMCP();
  console.log('=' .repeat(70) + '\n');

  const codeResult = await measureCodeExecution();
  console.log('=' .repeat(70) + '\n');

  console.log('📈 Results Summary\n');
  console.log(`Direct MCP Approach:`);
  console.log(`  Tools: ${directResult.toolCount}`);
  console.log(`  Tokens: ${directResult.tokens.toLocaleString()}`);
  console.log();

  console.log(`Code Execution Approach (typical task):`);
  console.log(`  Root index: ${codeResult.breakdown.rootIndex} tokens`);
  console.log(`  Category index: ${codeResult.breakdown.categoryIndex} tokens`);
  console.log(`  Tool docs (2 tools): ${codeResult.breakdown.tool1 + codeResult.breakdown.tool2} tokens`);
  console.log(`  User code: ${codeResult.breakdown.userCode} tokens`);
  console.log(`  Total: ${codeResult.tokens.toLocaleString()} tokens`);
  console.log();

  const savings = directResult.tokens - codeResult.tokens;
  const savingsPercent = ((savings / directResult.tokens) * 100).toFixed(1);

  console.log(`💰 Savings:`);
  console.log(`  Token reduction: ${savings.toLocaleString()} tokens`);
  console.log(`  Percentage saved: ${savingsPercent}%`);
  console.log();

  console.log('✅ Measurement complete!');
}

main().catch(console.error);
