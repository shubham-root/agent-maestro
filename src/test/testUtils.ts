import * as vscode from "vscode";

/**
 * Test utilities for Roo Routes testing
 */

export interface MockRooAdapter {
  isActive: boolean;
  getActiveTaskIds(): string[];
  isTaskInHistory(taskId: string): Promise<boolean>;
  resumeTask(taskId: string): Promise<void>;
  startNewTask(params: any): AsyncGenerator<any, void, unknown>;
  sendMessage(
    text: string,
    images: any[],
    options: any,
  ): AsyncGenerator<any, void, unknown>;
  pressPrimaryButton(): Promise<void>;
  pressSecondaryButton(): Promise<void>;
  cancelCurrentTask(): Promise<void>;
  getTaskHistory(): any[];
  getTaskWithId(taskId: string): Promise<any>;
  getProfiles(): string[];
  getActiveProfile(): string | undefined;
  getProfileEntry(name: string): any;
  createProfile(
    name: string,
    profile: any,
    activate?: boolean,
  ): Promise<string>;
  updateProfile(
    name: string,
    profile: any,
    activate?: boolean,
  ): Promise<string>;
  deleteProfile(name: string): Promise<void>;
  setActiveProfile(name: string): Promise<void>;
  api?: {
    getConfiguration(): any;
  };
}

/**
 * Creates a mock RooCode adapter for testing
 */
export function createMockRooAdapter(
  overrides: Partial<MockRooAdapter> = {},
): MockRooAdapter {
  const defaultAdapter: MockRooAdapter = {
    isActive: true,
    getActiveTaskIds: () => ["task-1", "task-2"],
    isTaskInHistory: async (taskId: string) =>
      ["task-1", "task-2", "task-3"].includes(taskId),
    resumeTask: async (taskId: string) => Promise.resolve(),
    startNewTask: async function* (params: any) {
      yield {
        name: "TaskStarted",
        data: { taskId: "new-task", message: "Task started" },
      };
      yield {
        name: "Message",
        data: { message: { text: "Processing task...", partial: false } },
      };
      yield {
        name: "TaskCompleted",
        data: { taskId: "new-task", result: "success" },
      };
    },
    sendMessage: async function* (text: string, images: any[], options: any) {
      yield {
        name: "Message",
        data: { message: { text: "Processing message...", partial: false } },
      };
      yield {
        name: "MessageProcessed",
        data: { taskId: options.taskId, status: "completed" },
      };
    },
    pressPrimaryButton: async () => Promise.resolve(),
    pressSecondaryButton: async () => Promise.resolve(),
    cancelCurrentTask: async () => Promise.resolve(),
    getTaskHistory: () => [
      {
        id: "task-1",
        number: 1,
        ts: Date.now(),
        task: "Create hello world function",
        tokensIn: 100,
        tokensOut: 200,
        totalCost: 0.01,
        workspace: "/test/workspace",
      },
      {
        id: "task-2",
        number: 2,
        ts: Date.now() - 1000,
        task: "Add error handling",
        tokensIn: 150,
        tokensOut: 250,
        totalCost: 0.015,
        workspace: "/test/workspace",
      },
    ],
    getTaskWithId: async (taskId: string) => ({
      historyItem: {
        id: taskId,
        number: 1,
        ts: Date.now(),
        task: "Test task",
        tokensIn: 100,
        tokensOut: 200,
        totalCost: 0.01,
      },
      taskDirPath: `/test/tasks/${taskId}`,
      apiConversationHistoryFilePath: `/test/tasks/${taskId}/api_conversation_history.json`,
      uiMessagesFilePath: `/test/tasks/${taskId}/ui_messages.json`,
      apiConversationHistory: [],
    }),
    getProfiles: () => ["Development", "Testing", "Production"],
    getActiveProfile: () => "Development",
    getProfileEntry: (name: string) => ({
      id: `profile-${name.toLowerCase()}`,
      name: name,
      apiProvider: "anthropic",
    }),
    createProfile: async (name: string, profile: any, activate?: boolean) => {
      return `profile-${name.toLowerCase()}`;
    },
    updateProfile: async (name: string, profile: any, activate?: boolean) => {
      return `profile-${name.toLowerCase()}`;
    },
    deleteProfile: async (name: string) => Promise.resolve(),
    setActiveProfile: async (name: string) => Promise.resolve(),
    api: {
      getConfiguration: () => ({
        apiProvider: "anthropic",
        apiKey: "test-key",
        apiModelId: "claude-3-sonnet-20240229",
        modelTemperature: 0.7,
        modelMaxTokens: 4096,
        includeMaxTokens: true,
        reasoningEffort: "medium",
        diffEnabled: true,
        fuzzyMatchThreshold: 0.8,
        rateLimitSeconds: 1,
      }),
    },
  };

  return { ...defaultAdapter, ...overrides };
}

/**
 * Creates a mock VSCode extension context for testing
 */
export function createMockExtensionContext(): vscode.ExtensionContext {
  return {
    globalStorageUri: vscode.Uri.file("/tmp/test-storage"),
    subscriptions: [],
    workspaceState: {
      get: () => undefined,
      update: () => Promise.resolve(),
      keys: () => [],
    },
    globalState: {
      get: () => undefined,
      update: () => Promise.resolve(),
      setKeysForSync: () => {},
      keys: () => [],
    },
    extensionUri: vscode.Uri.file("/test/extension"),
    extensionPath: "/test/extension",
    asAbsolutePath: (relativePath: string) => `/test/extension/${relativePath}`,
    storageUri: vscode.Uri.file("/tmp/test-storage"),
    logUri: vscode.Uri.file("/tmp/test-logs"),
    extensionMode: vscode.ExtensionMode.Test,
    secrets: {
      get: () => Promise.resolve(undefined),
      store: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      onDidChange: new vscode.EventEmitter().event,
    },
    environmentVariableCollection: {
      persistent: true,
      description: "Test collection",
      replace: () => {},
      append: () => {},
      prepend: () => {},
      get: () => undefined,
      forEach: () => {},
      delete: () => {},
      clear: () => {},
    },
  } as any;
}

/**
 * Test data generators
 */
export const TestData = {
  /**
   * Generate valid image data URI for testing
   */
  validImageDataUri: () =>
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",

  /**
   * Generate invalid image data URIs for testing
   */
  invalidImageDataUris: () => [
    "not-a-data-uri",
    "data:text/plain;base64,invalid",
    "data:image/jpeg;invalid-encoding",
    "image/png;base64,validbase64data", // Missing data: prefix
  ],

  /**
   * Generate sample task request
   */
  taskRequest: (overrides: any = {}) => ({
    text: "Create a simple hello world function",
    images: [],
    configuration: {},
    newTab: true,
    extensionId: "rooveterinaryinc.roo-cline",
    ...overrides,
  }),

  /**
   * Generate sample message request
   */
  messageRequest: (overrides: any = {}) => ({
    text: "Add error handling to the function",
    images: [],
    extensionId: "rooveterinaryinc.roo-cline",
    ...overrides,
  }),

  /**
   * Generate sample action request
   */
  actionRequest: (
    action: string = "pressPrimaryButton",
    overrides: any = {},
  ) => ({
    action,
    extensionId: "rooveterinaryinc.roo-cline",
    ...overrides,
  }),

  /**
   * Generate sample profile data
   */
  profileData: (overrides: any = {}) => ({
    name: "TestProfile",
    profile: {
      apiProvider: "anthropic",
      apiKey: "test-key",
      apiModelId: "claude-3-sonnet-20240229",
      modelTemperature: 0.7,
      modelMaxTokens: 4096,
    },
    activate: true,
    extensionId: "rooveterinaryinc.roo-cline",
    ...overrides,
  }),

  /**
   * Generate sample MCP config request
   */
  mcpConfigRequest: (overrides: any = {}) => ({
    extensionId: "rooveterinaryinc.roo-cline",
    ...overrides,
  }),

  /**
   * Generate sample SSE events
   */
  sseEvents: () => [
    {
      name: "TaskStarted",
      data: { taskId: "test-task", message: "Task started" },
    },
    {
      name: "Message",
      data: { message: { text: "Processing...", partial: false } },
    },
    {
      name: "TaskCompleted",
      data: { taskId: "test-task", result: "success" },
    },
  ],
};

/**
 * Validation helpers
 */
export const Validators = {
  /**
   * Validate image data URI format
   */
  isValidImageDataUri: (uri: string): boolean => {
    return (
      uri.startsWith("data:image/") &&
      uri.includes(";base64,") &&
      uri.split(";base64,")[1].length > 0
    );
  },

  /**
   * Validate task action
   */
  isValidTaskAction: (action: string): boolean => {
    const validActions = [
      "pressPrimaryButton",
      "pressSecondaryButton",
      "cancel",
      "resume",
    ];
    return validActions.includes(action);
  },

  /**
   * Validate API provider
   */
  isValidApiProvider: (provider: string): boolean => {
    const validProviders = [
      "anthropic",
      "openai",
      "bedrock",
      "vertex",
      "ollama",
      "gemini",
      "openrouter",
      "deepseek",
      "mistral",
      "groq",
      "fireworks",
      "glama",
      "vscode-lm",
      "lmstudio",
      "openai-native",
      "unbound",
      "requesty",
      "human-relay",
      "fake-ai",
      "xai",
      "chutes",
      "litellm",
      "kilocode",
    ];
    return validProviders.includes(provider);
  },

  /**
   * Validate SSE event structure
   */
  isValidSseEvent: (event: any): boolean => {
    return typeof event.name === "string" && typeof event.data === "object";
  },
};

/**
 * Mock HTTP response helpers
 */
export const MockResponses = {
  /**
   * Create success response
   */
  success: (data: any, status: number = 200) => ({
    status,
    data,
    headers: { "Content-Type": "application/json" },
  }),

  /**
   * Create error response
   */
  error: (message: string, status: number = 500) => ({
    status,
    data: { message },
    headers: { "Content-Type": "application/json" },
  }),

  /**
   * Create SSE response
   */
  sse: (events: any[]) => ({
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
    data: events
      .map(
        (event) =>
          `event: ${event.name}\ndata: ${JSON.stringify(event.data)}\n\n`,
      )
      .join(""),
  }),
};

/**
 * Async generator helpers for testing
 */
export const AsyncGenerators = {
  /**
   * Create mock task event generator
   */
  createTaskEventGenerator: async function* (events: any[]) {
    for (const event of events) {
      yield event;
    }
  },

  /**
   * Create mock message event generator
   */
  createMessageEventGenerator: async function* (taskId: string) {
    yield {
      name: "Message",
      data: { message: { text: "Processing message...", partial: false } },
    };
    yield {
      name: "MessageProcessed",
      data: { taskId, status: "completed" },
    };
  },
};
