# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing me@paddo.org.

**Please do not open a public issue for security vulnerabilities.**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

I'll respond as quickly as possible and work with you to address the issue.

## Security Considerations

This tool generates code execution wrappers for MCP servers. When using this tool:

1. **Review generated code**: Always review the generated wrappers before committing
2. **Protect credentials**: Never commit `.mcp.json` with sensitive credentials
3. **Trust your MCPs**: Only use MCP servers from trusted sources
4. **Sandbox execution**: Consider running MCPs in isolated environments

## Supported Versions

This is an experimental project. Only the latest version receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |
