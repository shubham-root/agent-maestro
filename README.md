# Cline Maestro

A unified controller for Cline and RooCode extensions that provides both VSCode extension API and local server access for external applications.

## Features

- **Unified API**: Single interface to interact with both Cline and RooCode extensions
- **Auto-discovery**: Automatically detects and activates installed extensions
- **Local Server**: HTTP server for external applications to use the controller
- **Flexible Function Calling**: Universal method to call any extension-specific function
- **VSCode Integration**: Seamless integration with VSCode commands and UI

## Installation

1. Install the required dependencies:

   - [Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) (Required)
   - [RooCode](https://marketplace.visualstudio.com/items?itemName=rooveterinaryinc.roo-cline) (Optional)

2. Install Cline Maestro extension

## VSCode Commands

| Command                                | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| `Cline Maestro: Start Local Server`    | Start the HTTP server for external access   |
| `Cline Maestro: Stop Local Server`     | Stop the HTTP server                        |
| `Cline Maestro: Get Extensions Status` | Show status of Cline and RooCode extensions |
| `Cline Maestro: Start New Task`        | Start a new task with selected extension    |

## Core Controller API

### Initialization

```typescript
import { ExtensionController } from "./core/controller";

const controller = new ExtensionController();
await controller.initialize();
```

### Unified APIs

#### Start New Task

```typescript
// Start with Cline (default)
await controller.startNewTask({
  task: "Create a todo app",
  images: ["data:image/png;base64,..."],
});

// Start with RooCode
await controller.startNewTask(
  {
    task: "Create a todo app",
    configuration: { apiProvider: "anthropic" },
    newTab: true,
  },
  "roocode",
);
```

#### Send Message

```typescript
// Send to Cline (default)
await controller.sendMessage("Add error handling to the code");

// Send to RooCode
await controller.sendMessage("Add error handling", [], "roocode");
```

#### Press Buttons

```typescript
// Press primary button (usually "Continue" or "Approve")
await controller.pressPrimaryButton("cline");

// Press secondary button (usually "Reject" or "Cancel")
await controller.pressSecondaryButton("roocode");
```

### Extension-Specific APIs

#### Cline-Specific Functions

```typescript
// Get/Set custom instructions (Cline only)
const instructions = await controller.getCustomInstructions();
await controller.setCustomInstructions("Always use TypeScript");
```

#### Universal Function Calling

```typescript
// Call any RooCode function
const taskStack = await controller.callExtensionFunction(
  "roocode",
  "getCurrentTaskStack",
);

const profiles = await controller.callExtensionFunction(
  "roocode",
  "getProfiles",
);

// Call function with parameters
await controller.callExtensionFunction("roocode", "createProfile", [
  "myProfile",
  { apiProvider: "anthropic" },
  true,
]);

// Call any Cline function
const clineInstructions = await controller.callExtensionFunction(
  "cline",
  "getCustomInstructions",
);
```

### Status and Utility Methods

```typescript
// Check if controller is ready
const isReady = controller.isReady();

// Check if specific extension is available
const hasCline = controller.isExtensionAvailable("cline");
const hasRooCode = controller.isExtensionAvailable("roocode");

// Get extension status
const status = controller.getExtensionStatus();
console.log(status.cline.isActive); // true/false
console.log(status.rooCode.version); // version string

// Get available functions for any extension
const clineFunctions = controller.getExtensionFunctions("cline");
const rooCodeFunctions = controller.getExtensionFunctions("roocode");

// Get direct API access (if needed)
const clineApi = controller.getClineApi();
const rooCodeApi = controller.getRooCodeApi();
```

## Local Server API

Start the server from VSCode or programmatically:

```typescript
import { LocalServer } from "./server/local-server";

const server = new LocalServer(controller, {
  port: 3000,
  host: "localhost",
  enableCors: true,
});

await server.start();
```

### HTTP Endpoints

#### GET `/status`

Get controller and extensions status.

**Response:**

```json
{
  "ready": true,
  "extensions": {
    "cline": {
      "isInstalled": true,
      "isActive": true,
      "version": "1.0.0"
    },
    "rooCode": {
      "isInstalled": true,
      "isActive": true,
      "version": "2.0.0"
    }
  }
}
```

#### POST `/start-task`

Start a new task.

**Request:**

```json
{
  "extensionType": "cline",
  "options": {
    "task": "Create a React component",
    "images": ["data:image/png;base64,..."],
    "configuration": {},
    "newTab": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "taskId": "task-123"
}
```

#### POST `/send-message`

Send message to current task.

**Request:**

```json
{
  "extensionType": "roocode",
  "message": "Add error handling",
  "images": []
}
```

#### POST `/press-primary`

Press primary button.

**Request:**

```json
{
  "extensionType": "cline"
}
```

#### POST `/press-secondary`

Press secondary button.

**Request:**

```json
{
  "extensionType": "roocode"
}
```

#### GET/POST `/custom-instructions`

Get or set custom instructions (Cline only).

**GET Response:**

```json
{
  "instructions": "Always use TypeScript"
}
```

**POST Request:**

```json
{
  "instructions": "Always use TypeScript and add comprehensive error handling"
}
```

#### POST `/call-function`

Call any extension function.

**Request:**

```json
{
  "extensionType": "roocode",
  "functionName": "createProfile",
  "payload": ["myProfile", { "apiProvider": "anthropic" }, true]
}
```

**Response:**

```json
{
  "success": true,
  "result": "profile-id-123"
}
```

#### GET `/functions?extension=cline`

Get available functions for an extension.

**Response:**

```json
{
  "functions": [
    "startNewTask",
    "sendMessage",
    "pressPrimaryButton",
    "pressSecondaryButton",
    "getCustomInstructions",
    "setCustomInstructions"
  ]
}
```

## Examples

### External Application Integration

```javascript
// Using fetch to interact with the local server
const baseUrl = "http://localhost:3000";

// Check status
const status = await fetch(`${baseUrl}/status`).then((r) => r.json());
console.log("Extensions ready:", status.ready);

// Start a task
const response = await fetch(`${baseUrl}/start-task`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    extensionType: "cline",
    options: {
      task: "Create a simple web server in Node.js",
    },
  }),
});

const result = await response.json();
console.log("Task started:", result.taskId);

// Send follow-up message
await fetch(`${baseUrl}/send-message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    extensionType: "cline",
    message: "Make sure to include error handling",
  }),
});
```

### RooCode Profile Management

```typescript
// Create a new profile
await controller.callExtensionFunction("roocode", "createProfile", [
  "production",
  {
    apiProvider: "anthropic",
    apiKey: "your-key-here",
    apiModelId: "claude-3-5-sonnet-20241022",
  },
  true,
]);

// Switch to the profile
await controller.callExtensionFunction(
  "roocode",
  "setActiveProfile",
  "production",
);

// Get current configuration
const config = await controller.callExtensionFunction(
  "roocode",
  "getConfiguration",
);
```

## Error Handling

All methods throw descriptive errors that can be caught and handled:

```typescript
try {
  await controller.startNewTask({ task: "test" }, "roocode");
} catch (error) {
  if (error.message.includes("RooCode API not available")) {
    console.log("RooCode extension is not installed or active");
  }
}
```

## Events

The controller emits events for monitoring:

```typescript
controller.on("initialized", () => {
  console.log("Controller ready");
});

controller.on("clineActivated", (api) => {
  console.log("Cline extension activated");
});

controller.on("rooCodeActivated", (api) => {
  console.log("RooCode extension activated");
});
```

## Features

- A local HTTP server to communicate with Cline/RooCode/...
  - [x] Design and implement unified controller layer based on the APIs of Cline, RooCode, etc.
  - [x] Design RESTful web API based on controller.
  - [ ] Implement the server and support swagger page.
  - [ ] Streaming output by Server-Sent Events (SSE) connection.
- Batch tasks automation
  - [ ] Show batch run command on customized file ext or `.csv` file.
  - [ ] Show run results.
- Support Github Copilot and Kilocode.
- Better support Cline, see if any internal communication leaked which could be used.

- Add the detailed contract of the SSE response
- Use ZOD to add type constrain of controller?

## License

MIT License - see LICENSE file for details.
