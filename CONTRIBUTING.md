# Contributing to MCP Code Wrapper

Thanks for your interest in contributing! This project is experimental and contributions are welcome.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, Claude Code version)
- Example `.mcp.json` config if relevant

### Suggesting Features

Feature requests are welcome! Please open an issue describing:
- The use case
- Why it would be useful
- Proposed implementation (optional)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a PR with description of changes

#### PR Guidelines

- Keep changes focused (one feature/fix per PR)
- Include tests if adding new functionality
- Update documentation (README, etc.) if needed
- Follow existing code style
- Make sure builds pass (`pnpm run build`)

### Development Setup

```bash
git clone https://github.com/paddo/mcp-code-wrapper
cd mcp-code-wrapper
pnpm install
pnpm run build
```

### Testing Changes

```bash
# Test the generator
pnpm run generate /path/to/test/project

# Test the CLI
node dist/cli.js /path/to/test/project

# Measure token savings
pnpm run measure
```

### Code Style

- Use TypeScript for all code
- Keep functions focused and small
- Add comments for complex logic
- Use meaningful variable names

## Questions?

Open an issue or reach out via [GitHub discussions](https://github.com/paddo/mcp-code-wrapper/discussions).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
