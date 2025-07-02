// Check if isDev query parameter exists to determine port
const getPort = () => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has("isDev") ? 33333 : 23333;
  }
  return 23333;
};

const PORT = getPort();
export const API_BASE_URL = `http://127.0.0.1:${PORT}/api/v1/roo`;
const INFO_API_BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

export const API_ENDPOINTS = {
  TASK: `${API_BASE_URL}/task`,
  TASK_MESSAGE: (taskId: string) => `${API_BASE_URL}/task/${taskId}/message`,
  TASK_ACTION: (taskId: string) => `${API_BASE_URL}/task/${taskId}/action`,
  INFO: `${INFO_API_BASE_URL}/info`,
} as const;

export const SUGGESTION_ACTIONS = {
  APPROVE: "Approve",
  REJECT: "Reject",
} as const;

export const ACTION_TYPES = {
  APPROVE: "pressPrimaryButton",
  REJECT: "pressSecondaryButton",
} as const;

export const STATUS_MESSAGES = {
  CONNECTING: "Connecting to RooCode...",
  RECEIVING: "Receiving response...",
  TASK_CREATED: "Task created, streaming response...",
  TASK_RESUMED: "Task resumed, streaming response...",
  TASK_COMPLETED: "Task completed!",
  TASK_ERROR: "Task ended with error",
  APPROVING: "Approving request...",
  REJECTING: "Rejecting request...",
  APPROVED: "Request approved!",
  REJECTED: "Request rejected!",
  ERROR_PROCESSING: "Error processing request",
  FINALIZING: "Response completed! Finalizing...",
} as const;

export const MESSAGE_TYPES = {
  SAY: "say",
  ASK: "ask",
} as const;

export const ASK_TYPES = {
  FOLLOWUP: "followup",
  USE_MCP_SERVER: "use_mcp_server",
} as const;

export const EVENT_TYPES = {
  TASK_CREATED: "task_created",
  TASK_RESUMED: "task_resumed",
  MESSAGE: "message",
  TASK_COMPLETED: "task_completed",
  TASK_ABORTED: "task_aborted",
  ERROR: "error",
} as const;

export const UI_CONFIG = {
  STATUS_DISPLAY_DURATION: 3000,
  TASK_COMPLETION_DELAY: 3000,
  TEXTAREA_MAX_HEIGHT: 120,
  MESSAGE_UPDATE_DELAY: 1,
} as const;

export const MODES = [
  {
    slug: "code",
    name: "💻 Code",
    whenToUse:
      "Use this mode when you need to write, modify, or refactor code. Ideal for implementing features, fixing bugs, creating new files, or making code improvements across any programming language or framework.",
    groups: ["read", "edit", "browser", "command", "mcp"],
  },
  {
    slug: "architect",
    name: "🏗️ Architect",
    whenToUse:
      "Use this mode when you need to plan, design, or strategize before implementation. Perfect for breaking down complex problems, creating technical specifications, designing system architecture, or brainstorming solutions before coding.",
    groups: [
      "read",
      ["edit", { fileRegex: "\\.md$", description: "Markdown files only" }],
      "browser",
      "mcp",
    ],
  },
  {
    slug: "ask",
    name: "❓ Ask",
    whenToUse:
      "Use this mode when you need explanations, documentation, or answers to technical questions. Best for understanding concepts, analyzing existing code, getting recommendations, or learning about technologies without making changes.",
    groups: ["read", "browser", "mcp"],
  },
  {
    slug: "debug",
    name: "🪲 Debug",
    whenToUse:
      "Use this mode when you're troubleshooting issues, investigating errors, or diagnosing problems. Specialized in systematic debugging, adding logging, analyzing stack traces, and identifying root causes before applying fixes.",
    groups: ["read", "edit", "browser", "command", "mcp"],
  },
  {
    slug: "orchestrator",
    name: "🪃 Orchestrator",
    whenToUse:
      "Use this mode for complex, multi-step projects that require coordination across different specialties. Ideal when you need to break down large tasks into subtasks, manage workflows, or coordinate work that spans multiple domains or expertise areas.",
    groups: [],
  },
] as const;

export const DEFAULT_MODE = "ask";
