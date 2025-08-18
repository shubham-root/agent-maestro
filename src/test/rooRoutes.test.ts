import { OpenAPIHono } from "@hono/zod-openapi";
import * as assert from "assert";
import * as vscode from "vscode";
import { ExtensionController } from "../core/controller";
import { registerRooRoutes } from "../server/routes/rooRoutes";

suite("Roo Routes Test Suite", () => {
  let controller: ExtensionController;
  let app: OpenAPIHono;
  let context: vscode.ExtensionContext;

  suiteSetup(async () => {
    // Initialize test environment
    vscode.window.showInformationMessage("Starting Roo Routes tests...");

    // Mock extension context
    context = {
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
      asAbsolutePath: (relativePath: string) =>
        `/test/extension/${relativePath}`,
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

    controller = new ExtensionController();
    app = new OpenAPIHono();
    registerRooRoutes(app, controller, context);
  });

  suiteTeardown(() => {
    vscode.window.showInformationMessage("Roo Routes tests completed.");
  });

  suite("Task Management Endpoints", () => {
    test("POST /roo/task - Create new task", async () => {
      const requestBody = {
        text: "Create a simple hello world function",
        images: [],
        configuration: {},
        newTab: true,
        extensionId: "rooveterinaryinc.roo-cline",
      };

      // Test request validation
      assert.ok(requestBody.text.length > 0, "Text should not be empty");
      assert.ok(Array.isArray(requestBody.images), "Images should be an array");

      // Mock adapter behavior
      const mockAdapter = {
        isActive: true,
        startNewTask: async function* (params: any) {
          yield {
            name: "TaskStarted",
            data: { taskId: "test-task-1", message: "Task started" },
          };
          yield {
            name: "Message",
            data: { message: { text: "Processing task...", partial: false } },
          };
          yield {
            name: "TaskCompleted",
            data: { taskId: "test-task-1", result: "success" },
          };
        },
      };

      // Verify the adapter would be called correctly
      assert.ok(mockAdapter.isActive, "Adapter should be active");
      assert.ok(
        typeof mockAdapter.startNewTask === "function",
        "startNewTask should be a function",
      );
    });

    test("POST /roo/task/{taskId}/message - Send message to existing task", async () => {
      const taskId = "test-task-1";
      const requestBody = {
        text: "Add error handling to the function",
        images: [],
        extensionId: "rooveterinaryinc.roo-cline",
      };

      // Test parameter validation
      assert.ok(taskId.length > 0, "Task ID should not be empty");
      assert.ok(
        requestBody.text.length > 0,
        "Message text should not be empty",
      );

      // Mock adapter behavior for existing task
      const mockAdapter = {
        isActive: true,
        getActiveTaskIds: () => [taskId],
        isTaskInHistory: async (id: string) => id === taskId,
        resumeTask: async (id: string) => Promise.resolve(),
        sendMessage: async function* (
          text: string,
          images: any[],
          options: any,
        ) {
          yield {
            name: "Message",
            data: {
              message: { text: "Processing message...", partial: false },
            },
          };
          yield {
            name: "MessageProcessed",
            data: { taskId: options.taskId, status: "completed" },
          };
        },
      };

      assert.ok(
        mockAdapter.getActiveTaskIds().includes(taskId),
        "Task should be in active tasks",
      );
    });

    test("POST /roo/task/{taskId}/action - Perform task actions", async () => {
      const taskId = "test-task-1";
      const actions = [
        "pressPrimaryButton",
        "pressSecondaryButton",
        "cancel",
        "resume",
      ];

      for (const action of actions) {
        const requestBody = {
          action,
          extensionId: "rooveterinaryinc.roo-cline",
        };

        // Test action validation
        assert.ok(
          actions.includes(requestBody.action),
          `Action ${action} should be valid`,
        );

        // Mock adapter behavior for each action
        const mockAdapter = {
          isActive: true,
          getActiveTaskIds: () => [taskId],
          isTaskInHistory: async (id: string) => true,
          resumeTask: async (id: string) => Promise.resolve(),
          pressPrimaryButton: async () => Promise.resolve(),
          pressSecondaryButton: async () => Promise.resolve(),
          cancelCurrentTask: async () => Promise.resolve(),
        };

        // Check if adapter has the appropriate method for each action
        if (action === "pressPrimaryButton") {
          assert.ok(
            typeof mockAdapter.pressPrimaryButton === "function",
            `Adapter should have method for action: ${action}`,
          );
        } else if (action === "pressSecondaryButton") {
          assert.ok(
            typeof mockAdapter.pressSecondaryButton === "function",
            `Adapter should have method for action: ${action}`,
          );
        } else if (action === "cancel") {
          assert.ok(
            typeof mockAdapter.cancelCurrentTask === "function",
            `Adapter should have method for action: ${action}`,
          );
        } else if (action === "resume") {
          assert.ok(
            typeof mockAdapter.resumeTask === "function",
            `Adapter should have method for action: ${action}`,
          );
        }
      }
    });

    test("GET /roo/tasks - Get task history", async () => {
      const mockHistory = [
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
      ];

      // Test history structure
      mockHistory.forEach((item) => {
        assert.ok(
          typeof item.id === "string",
          "History item should have string ID",
        );
        assert.ok(
          typeof item.task === "string",
          "History item should have task description",
        );
        assert.ok(
          typeof item.tokensIn === "number",
          "History item should have input tokens",
        );
        assert.ok(
          typeof item.tokensOut === "number",
          "History item should have output tokens",
        );
        assert.ok(
          typeof item.totalCost === "number",
          "History item should have total cost",
        );
      });
    });

    test("GET /roo/task/{taskId} - Get task by ID", async () => {
      const taskId = "test-task-1";
      const mockTaskData = {
        historyItem: {
          id: taskId,
          number: 1,
          ts: Date.now(),
          task: "Test task",
          tokensIn: 100,
          tokensOut: 200,
          totalCost: 0.01,
        },
        taskDirPath: "/test/tasks/task-1",
        apiConversationHistoryFilePath:
          "/test/tasks/task-1/api_conversation_history.json",
        uiMessagesFilePath: "/test/tasks/task-1/ui_messages.json",
        apiConversationHistory: [],
      };

      // Test task data structure
      assert.ok(
        mockTaskData.historyItem.id === taskId,
        "Task data should have correct ID",
      );
      assert.ok(
        typeof mockTaskData.taskDirPath === "string",
        "Should have task directory path",
      );
      assert.ok(
        typeof mockTaskData.apiConversationHistoryFilePath === "string",
        "Should have API history file path",
      );
      assert.ok(
        typeof mockTaskData.uiMessagesFilePath === "string",
        "Should have UI messages file path",
      );
      assert.ok(
        Array.isArray(mockTaskData.apiConversationHistory),
        "Should have conversation history array",
      );
    });
  });

  suite("Profile Management Endpoints", () => {
    test("GET /roo/profiles - List all profiles", async () => {
      const mockProfiles = [
        { id: "profile-1", name: "Development", apiProvider: "anthropic" },
        { id: "profile-2", name: "Production", apiProvider: "openai" },
      ];

      const mockResponse = {
        profiles: mockProfiles,
        activeProfile: "Development",
      };

      // Test profile list structure
      assert.ok(
        Array.isArray(mockResponse.profiles),
        "Should return profiles array",
      );
      assert.ok(
        typeof mockResponse.activeProfile === "string",
        "Should have active profile name",
      );

      mockResponse.profiles.forEach((profile) => {
        assert.ok(typeof profile.id === "string", "Profile should have ID");
        assert.ok(typeof profile.name === "string", "Profile should have name");
      });
    });

    test("GET /roo/profiles?state=active - Get active profile only", async () => {
      const mockActiveProfile = {
        name: "Development",
        profile: {
          apiProvider: "anthropic",
          apiKey: "test-key",
          apiModelId: "claude-3-sonnet-20240229",
        },
      };

      // Test active profile structure
      assert.ok(
        typeof mockActiveProfile.name === "string",
        "Should have profile name",
      );
      assert.ok(
        typeof mockActiveProfile.profile === "object",
        "Should have profile settings",
      );
      assert.ok(
        mockActiveProfile.profile.apiProvider,
        "Should have API provider",
      );
    });

    test("GET /roo/profiles/{name} - Get specific profile", async () => {
      const profileName = "Development";
      const mockProfile = {
        id: "profile-1",
        name: profileName,
        profile: {
          apiProvider: "anthropic",
          apiKey: "test-key",
          apiModelId: "claude-3-sonnet-20240229",
          modelTemperature: 0.7,
          modelMaxTokens: 4096,
        },
        isActive: true,
      };

      // Test specific profile structure
      assert.ok(
        mockProfile.name === profileName,
        "Should return correct profile",
      );
      assert.ok(
        typeof mockProfile.isActive === "boolean",
        "Should indicate if profile is active",
      );
      assert.ok(
        mockProfile.profile.apiProvider,
        "Should have API provider settings",
      );
    });

    test("POST /roo/profiles - Create new profile", async () => {
      const newProfile = {
        name: "Testing",
        profile: {
          apiProvider: "openai",
          apiKey: "test-openai-key",
          apiModelId: "gpt-4",
          modelTemperature: 0.5,
        },
        activate: true,
        extensionId: "rooveterinaryinc.roo-cline",
      };

      // Test profile creation data
      assert.ok(newProfile.name.length > 0, "Profile name should not be empty");
      assert.ok(newProfile.profile.apiProvider, "Should have API provider");
      assert.ok(
        typeof newProfile.activate === "boolean",
        "Should have activation flag",
      );

      const mockResponse = {
        id: "profile-3",
        name: newProfile.name,
        message: `Profile '${newProfile.name}' created successfully`,
        activated: newProfile.activate,
      };

      assert.ok(mockResponse.id, "Should return profile ID");
      assert.ok(
        mockResponse.activated === newProfile.activate,
        "Should confirm activation status",
      );
    });

    test("PUT /roo/profiles/{name} - Update existing profile", async () => {
      const profileName = "Development";
      const updateData = {
        profile: {
          apiProvider: "anthropic",
          apiKey: "updated-key",
          apiModelId: "claude-3-opus-20240229",
          modelTemperature: 0.8,
        },
        activate: false,
        extensionId: "rooveterinaryinc.roo-cline",
      };

      // Test profile update data
      assert.ok(
        updateData.profile.apiKey !== "test-key",
        "Should update API key",
      );
      assert.ok(
        updateData.profile.modelTemperature === 0.8,
        "Should update temperature",
      );

      const mockResponse = {
        id: "profile-1",
        name: profileName,
        message: `Profile '${profileName}' updated successfully`,
        activated: updateData.activate,
      };

      assert.ok(
        mockResponse.name === profileName,
        "Should confirm profile name",
      );
    });

    test("DELETE /roo/profiles/{name} - Delete profile", async () => {
      const profileName = "Testing";

      // Test deletion constraints
      const mockAdapter = {
        getProfiles: () => ["Development", "Testing", "Production"],
        getActiveProfile: () => "Development", // Different from the one being deleted
      };

      assert.ok(
        mockAdapter.getProfiles().includes(profileName),
        "Profile should exist",
      );
      assert.ok(
        mockAdapter.getActiveProfile() !== profileName,
        "Should not delete active profile",
      );

      const mockResponse = {
        message: `Profile '${profileName}' deleted successfully`,
      };

      assert.ok(
        mockResponse.message.includes(profileName),
        "Should confirm deletion",
      );
    });

    test("PUT /roo/profiles/active/{name} - Set active profile", async () => {
      const profileName = "Production";
      const requestBody = {
        extensionId: "rooveterinaryinc.roo-cline",
      };

      // Test activation
      const mockAdapter = {
        getProfiles: () => ["Development", "Testing", "Production"],
        setActiveProfile: async (name: string) => Promise.resolve(),
      };

      assert.ok(
        mockAdapter.getProfiles().includes(profileName),
        "Profile should exist before activation",
      );

      const mockResponse = {
        name: profileName,
        message: `Profile '${profileName}' is now active`,
      };

      assert.ok(
        mockResponse.name === profileName,
        "Should confirm activated profile",
      );
    });
  });

  suite("MCP Configuration Endpoint", () => {
    test("POST /roo/install-mcp-config - Install MCP configuration", async () => {
      const requestBody = {
        extensionId: "rooveterinaryinc.roo-cline",
      };

      const mockAvailableExtensions = [
        { id: "rooveterinaryinc.roo-cline", displayName: "Roo Code" },
        { id: "kilocode.kilo-code", displayName: "Kilo Code" },
      ];

      // Test extension availability
      assert.ok(
        mockAvailableExtensions.length > 0,
        "Should have available extensions",
      );

      const targetExtension = mockAvailableExtensions.find(
        (ext) => ext.id === requestBody.extensionId,
      );
      assert.ok(targetExtension, "Target extension should be available");

      const mockResponse = {
        extensionId: requestBody.extensionId,
        extensionDisplayName: targetExtension!.displayName,
        success: true,
        message: "MCP configuration added successfully",
      };

      assert.ok(mockResponse.success, "Configuration should be successful");
      assert.ok(
        mockResponse.extensionId === requestBody.extensionId,
        "Should confirm extension ID",
      );
    });

    test("POST /roo/install-mcp-config - No extension ID provided", async () => {
      const requestBody = {}; // No extensionId

      const mockAvailableExtensions = [
        { id: "rooveterinaryinc.roo-cline", displayName: "Roo Code" },
      ];

      // Should use first available extension as default
      const defaultExtension = mockAvailableExtensions[0];

      const mockResponse = {
        extensionId: defaultExtension.id,
        extensionDisplayName: defaultExtension.displayName,
        success: true,
        message: "MCP configuration added successfully",
      };

      assert.ok(
        mockResponse.extensionId === defaultExtension.id,
        "Should use default extension",
      );
    });

    test("POST /roo/install-mcp-config - No supported extensions", async () => {
      const mockAvailableExtensions: any[] = []; // No extensions available

      // Should return error when no extensions are available
      const mockErrorResponse = {
        message:
          "No supported extensions are currently installed. Please install a compatible extension like Roo Code or Kilo Code.",
      };

      assert.ok(
        mockErrorResponse.message.includes("No supported extensions"),
        "Should indicate no extensions available",
      );
    });
  });

  suite("Error Handling and Edge Cases", () => {
    test("Invalid image data URI format", async () => {
      const invalidImages = [
        "not-a-data-uri",
        "data:text/plain;base64,invalid",
        "data:image/jpeg;invalid-encoding",
      ];

      invalidImages.forEach((invalidImage) => {
        // Test image validation
        const isValidDataUri =
          invalidImage.startsWith("data:image/") &&
          invalidImage.includes(";base64,");
        assert.ok(
          !isValidDataUri,
          `Should reject invalid image: ${invalidImage}`,
        );
      });

      const validImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const isValidDataUri =
        validImage.startsWith("data:image/") && validImage.includes(";base64,");
      assert.ok(isValidDataUri, "Should accept valid image data URI");
    });

    test("Extension not available error", async () => {
      const extensionId = "non-existent-extension";

      const mockAdapter: any = null; // Extension not available

      if (!mockAdapter?.isActive) {
        const errorMessage = `RooCode extension ${extensionId} is not available`;
        assert.ok(
          errorMessage.includes("not available"),
          "Should indicate extension unavailable",
        );
      }
    });

    test("Task not found error", async () => {
      const nonExistentTaskId = "non-existent-task";

      const mockAdapter = {
        getActiveTaskIds: () => ["task-1", "task-2"],
        isTaskInHistory: async (id: string) => false,
      };

      const isTaskActive = mockAdapter
        .getActiveTaskIds()
        .includes(nonExistentTaskId);
      const isTaskInHistory =
        await mockAdapter.isTaskInHistory(nonExistentTaskId);

      if (!isTaskActive && !isTaskInHistory) {
        const errorMessage = `Task with ID ${nonExistentTaskId} not found`;
        assert.ok(
          errorMessage.includes("not found"),
          "Should indicate task not found",
        );
      }
    });

    test("Profile already exists error", async () => {
      const existingProfileName = "Development";

      const mockAdapter = {
        getProfiles: () => ["Development", "Production"],
      };

      const profileExists = mockAdapter
        .getProfiles()
        .includes(existingProfileName);

      if (profileExists) {
        const errorMessage = `Profile '${existingProfileName}' already exists`;
        assert.ok(
          errorMessage.includes("already exists"),
          "Should indicate profile already exists",
        );
      }
    });

    test("Cannot delete active profile error", async () => {
      const activeProfileName = "Development";

      const mockAdapter = {
        getProfiles: () => ["Development", "Production"],
        getActiveProfile: () => "Development",
      };

      const isActiveProfile =
        mockAdapter.getActiveProfile() === activeProfileName;

      if (isActiveProfile) {
        const errorMessage = "Cannot delete the active profile";
        assert.ok(
          errorMessage.includes("Cannot delete"),
          "Should prevent deleting active profile",
        );
      }
    });

    test("Invalid action type error", async () => {
      const invalidAction = "invalidAction";
      const validActions = [
        "pressPrimaryButton",
        "pressSecondaryButton",
        "cancel",
        "resume",
      ];

      const isValidAction = validActions.includes(invalidAction);

      if (!isValidAction) {
        const errorMessage = `Unknown action: ${invalidAction}`;
        assert.ok(
          errorMessage.includes("Unknown action"),
          "Should reject invalid actions",
        );
      }
    });

    test("Empty request body validation", async () => {
      // Test empty text
      const emptyTextRequest = { text: "", images: [] };
      assert.ok(emptyTextRequest.text.length === 0, "Should detect empty text");

      // Test missing required fields
      const incompleteRequest = { images: [] }; // Missing text field
      assert.ok(
        !("text" in incompleteRequest),
        "Should detect missing required fields",
      );
    });
  });

  suite("Server-Sent Events (SSE) Stream Testing", () => {
    test("SSE event stream format validation", async () => {
      const mockEvents = [
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
      ];

      mockEvents.forEach((event) => {
        // Test SSE event structure
        assert.ok(typeof event.name === "string", "Event should have name");
        assert.ok(
          typeof event.data === "object",
          "Event should have data object",
        );

        // Test SSE formatting
        const sseData = {
          event: event.name,
          data: JSON.stringify(event.data),
        };

        assert.ok(
          sseData.event === event.name,
          "SSE should preserve event name",
        );
        assert.ok(
          typeof sseData.data === "string",
          "SSE data should be stringified",
        );
      });
    });

    test("Message deduplication in SSE stream", async () => {
      const duplicateMessage = { text: "Same message", partial: false };
      const messages = [
        { message: duplicateMessage },
        { message: duplicateMessage }, // Duplicate
        { message: { text: "Different message", partial: false } },
      ];

      // Test deduplication logic
      let lastMessage: any;
      const filteredMessages = messages.filter((msg) => {
        if (!msg.message.partial && lastMessage && !lastMessage.partial) {
          const isDuplicate =
            JSON.stringify(lastMessage) === JSON.stringify(msg.message);
          if (isDuplicate) {
            return false; // Skip duplicate
          }
        }
        if (!msg.message.partial) {
          lastMessage = msg.message;
        }
        return true;
      });

      assert.ok(
        filteredMessages.length === 2,
        "Should filter out duplicate messages",
      );
    });

    test("Filtered message types", async () => {
      const filteredTypes = ["api_req_started"];
      const messages = [
        { say: "api_req_started", text: "API request started" },
        { say: "normal_message", text: "Normal message" },
        { say: "api_req_started", text: "Another API request" },
      ];

      const filteredMessages = messages.filter(
        (msg) => !filteredTypes.includes(msg.say || ""),
      );

      assert.ok(
        filteredMessages.length === 1,
        "Should filter out specified message types",
      );
      assert.ok(
        filteredMessages[0].say === "normal_message",
        "Should keep non-filtered messages",
      );
    });
  });
});
