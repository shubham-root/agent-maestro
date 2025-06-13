# Agent Maestro

Unlock the full potential of best-in-class AI agents in VS Code via one unified RESTful API. Designed for pros who need fine‑grained programmatic control, enabling seamless agent integration into custom workflows, CI/CD pipelines, and external applications.

![Agent Maestro Demo](assets/agent-maestro-demo.gif)

## Key Features

Agent Maestro is a VS Code extension that provides a unified API interface for managing and controlling popular AI coding agents directly within your development environment. Key capabilities include:

- **Unified API Gateway**: Single RESTful API interface to control multiple AI coding agents through a standardized endpoint
- **Multi-Agent Support**: Currently supports RooCode and Cline extensions with plans for GitHub Copilot and Kilocode
- **Real-time Event Streaming**: Server-Sent Events (SSE) support for live task monitoring and message streaming
- **Task Management**: Comprehensive task lifecycle management including creation, execution, monitoring, and completion tracking
- **Profile Management**: Advanced configuration management for different AI provider settings and profiles
- **OpenAPI Documentation**: Auto-generated API documentation accessible via `/api/v1/openapi.json`
- **Extension Auto-Discovery**: Automatic detection and activation of installed AI coding extensions

**Note on Cline Support**: While Cline integration is included, its support is currently limited due to the extension's low extensibility and restricted API surface. RooCode offers significantly better integration capabilities and is the recommended primary agent.

## Quick Start

### Prerequisites

Install RooCode or its variants from the VS Code marketplace to ensure full functionality.

### Installation

Install the Agent Maestro extension from the [VS Code Marketplace](). Once activated, Agent Maestro automatically starts its API server on startup.

### Usage

1. **Check API Capabilities**: When the extension starts, you can explore all available API endpoints by accessing the OpenAPI specification at the local server endpoint.

2. **VS Code Commands**: Access Agent Maestro functionality through the Command Palette:

   - `Agent Maestro: Get Extensions Status` - Check the status of supported AI extensions
   - `Agent Maestro: Start API Server` - Start the proxy API server
   - `Agent Maestro: Stop API Server` - Stop the proxy API server
   - `Agent Maestro: Restart API Server` - Restart the proxy API server
   - `Agent Maestro: Get API Server Status` - Check current server status

3. **Development Resources**:
   - **Examples**: Reference the examples web page for internal testing scenarios _(internal use only)_
   - **Type Definitions**: Explore the [@roo-code/types](https://www.npmjs.com/package/@roo-code/types) package for detailed event structures and data models

## API Overview

Agent Maestro exposes a RESTful API that abstracts the complexity of different AI coding agents into a unified interface.

**Base URL**: `http://localhost:23333/api/v1`

**RooCode Agent Routes:**

- `POST /api/v1/roo/task` - Create new RooCode task with SSE streaming
- `POST /api/v1/roo/task/{taskId}/message` - Send message to existing task with SSE streaming
- `POST /api/v1/roo/task/{taskId}/action` - Perform actions (pressPrimaryButton, pressSecondaryButton)

**Cline Agent Routes:**

- `POST /api/v1/cline/task` - Create new Cline task (basic support)

**Documentation Routes:**

- `GET /api/v1/openapi.json` - Complete OpenAPI v3 specification

## Roadmap

Our development roadmap includes several exciting enhancements:

- **GitHub Copilot Integration**: Native support for GitHub Copilot and GitHub Copilot Chat
- **Kilocode Integration**: Integration with Kilocode for expanded AI agent capabilities
- **File System Access**: Expose file system read capabilities for enhanced agent interactions
- **VS Code LM API**: Optional direct access to VS Code Language Model API for users preferring lower-level control
- **Enhanced Extensibility**: Improved plugin architecture for third-party agent integrations

**Contributions Welcome**: We encourage community contributions to help expand Agent Maestro's capabilities and support for additional AI coding agents.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.
