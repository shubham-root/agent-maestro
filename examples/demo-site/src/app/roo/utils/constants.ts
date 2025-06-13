export const API_BASE_URL = "http://127.0.0.1:23333/api/v1/roo";

export const API_ENDPOINTS = {
  TASK: `${API_BASE_URL}/task`,
  TASK_MESSAGE: (taskId: string) => `${API_BASE_URL}/task/${taskId}/message`,
  TASK_ACTION: (taskId: string) => `${API_BASE_URL}/task/${taskId}/action`,
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
