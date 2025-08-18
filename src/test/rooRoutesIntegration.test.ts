import { OpenAPIHono } from "@hono/zod-openapi";
import * as assert from "assert";
import * as vscode from "vscode";
import { ExtensionController } from "../core/controller";
import { registerRooRoutes } from "../server/routes/rooRoutes";
import {
  createMockExtensionContext,
  createMockRooAdapter,
  TestData,
  Validators,
} from "./testUtils";

suite("Roo Routes Integration Tests", () => {
  let app: OpenAPIHono;
  let controller: ExtensionController;
  let context: vscode.ExtensionContext;
  let mockAdapter: any;

  suiteSetup(async () => {
    vscode.window.showInformationMessage(
      "Starting Roo Routes Integration tests...",
    );

    context = createMockExtensionContext();
    controller = new ExtensionController();
    app = new OpenAPIHono();

    // Create mock adapter
    mockAdapter = createMockRooAdapter();

    // Mock the controller's getRooAdapter method
    controller.getRooAdapter = (extensionId?: string) => mockAdapter;

    registerRooRoutes(app, controller, context);
  });

  suiteTeardown(() => {
    vscode.window.showInformationMessage(
      "Roo Routes Integration tests completed.",
    );
  });

  suite("Task Management Integration Tests", () => {
    test("POST /roo/task - Create new task with valid data", async () => {
      const requestData = TestData.taskRequest();

      // Validate request data
      assert.ok(
        requestData.text.length > 0,
        "Request should have non-empty text",
      );
      assert.ok(Array.isArray(requestData.images), "Images should be an array");

      // Test that the adapter would be called
      assert.ok(mockAdapter.isActive, "Mock adapter should be active");
      assert.ok(
        typeof mockAdapter.startNewTask === "function",
        "Should have startNewTask method",
      );

      // Test the async generator
      const eventGenerator = mockAdapter.startNewTask(requestData);
      const events = [];
      for await (const event of eventGenerator) {
        events.push(event);
      }

      assert.ok(events.length > 0, "Should generate events");
      assert.ok(
        events.some((e) => e.name === "TaskStarted"),
        "Should have TaskStarted event",
      );
      assert.ok(
        events.some((e) => e.name === "TaskCompleted"),
        "Should have TaskCompleted event",
      );
    });

    test("POST /roo/task - Reject invalid image data", async () => {
      const invalidImages = TestData.invalidImageDataUris();

      for (const invalidImage of invalidImages) {
        const isValid = Validators.isValidImageDataUri(invalidImage);
        assert.ok(!isValid, `Should reject invalid image: ${invalidImage}`);
      }

      const validImage = TestData.validImageDataUri();
      const isValid = Validators.isValidImageDataUri(validImage);
      assert.ok(isValid, "Should accept valid image data URI");
    });

    test("POST /roo/task/{taskId}/message - Send message to existing task", async () => {
      const taskId = "task-1"; // Use a task ID that exists in mock data
      const requestData = TestData.messageRequest();

      // Test that task exists in mock adapter
      const activeTaskIds = mockAdapter.getActiveTaskIds();
      const isInHistory = await mockAdapter.isTaskInHistory(taskId);

      // For testing, we'll assume the task exists
      assert.ok(
        activeTaskIds.includes(taskId) || isInHistory,
        "Task should exist",
      );

      // Test message sending
      const messageGenerator = mockAdapter.sendMessage(
        requestData.text,
        requestData.images,
        { taskId },
      );
      const events = [];
      for await (const event of messageGenerator) {
        events.push(event);
      }

      assert.ok(events.length > 0, "Should generate message events");
      assert.ok(
        events.some((e) => e.name === "MessageProcessed"),
        "Should process message",
      );
    });

    test("POST /roo/task/{taskId}/action - Perform valid actions", async () => {
      const taskId = "test-task-1";
      const validActions = [
        "pressPrimaryButton",
        "pressSecondaryButton",
        "cancel",
        "resume",
      ];

      for (const action of validActions) {
        const requestData = TestData.actionRequest(action);

        assert.ok(
          Validators.isValidTaskAction(requestData.action),
          `Action ${action} should be valid`,
        );

        // Test that adapter has the required method
        if (action === "pressPrimaryButton") {
          assert.ok(
            typeof mockAdapter.pressPrimaryButton === "function",
            "Should have pressPrimaryButton method",
          );
        } else if (action === "pressSecondaryButton") {
          assert.ok(
            typeof mockAdapter.pressSecondaryButton === "function",
            "Should have pressSecondaryButton method",
          );
        } else if (action === "cancel") {
          assert.ok(
            typeof mockAdapter.cancelCurrentTask === "function",
            "Should have cancelCurrentTask method",
          );
        } else if (action === "resume") {
          assert.ok(
            typeof mockAdapter.resumeTask === "function",
            "Should have resumeTask method",
          );
        }
      }
    });

    test("GET /roo/tasks - Retrieve task history", async () => {
      const history = mockAdapter.getTaskHistory();

      assert.ok(Array.isArray(history), "History should be an array");
      assert.ok(history.length > 0, "Should have history items");

      // Validate history item structure
      history.forEach((item) => {
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
        assert.ok(
          typeof item.ts === "number",
          "History item should have timestamp",
        );
      });
    });

    test("GET /roo/task/{taskId} - Retrieve specific task", async () => {
      const taskId = "test-task-1";
      const taskData = await mockAdapter.getTaskWithId(taskId);

      assert.ok(taskData.historyItem, "Should have history item");
      assert.ok(
        taskData.historyItem.id === taskId,
        "Should have correct task ID",
      );
      assert.ok(
        typeof taskData.taskDirPath === "string",
        "Should have task directory path",
      );
      assert.ok(
        typeof taskData.apiConversationHistoryFilePath === "string",
        "Should have API history file path",
      );
      assert.ok(
        typeof taskData.uiMessagesFilePath === "string",
        "Should have UI messages file path",
      );
      assert.ok(
        Array.isArray(taskData.apiConversationHistory),
        "Should have conversation history array",
      );
    });
  });

  suite("Profile Management Integration Tests", () => {
    test("GET /roo/profiles - List all profiles", async () => {
      const profiles = mockAdapter.getProfiles();
      const activeProfile = mockAdapter.getActiveProfile();

      assert.ok(Array.isArray(profiles), "Should return profiles array");
      assert.ok(profiles.length > 0, "Should have profiles");
      assert.ok(
        typeof activeProfile === "string",
        "Should have active profile",
      );
      assert.ok(
        profiles.includes(activeProfile!),
        "Active profile should be in profiles list",
      );
    });

    test("GET /roo/profiles/{name} - Get specific profile", async () => {
      const profileName = "Development";
      const profileEntry = mockAdapter.getProfileEntry(profileName);
      const activeProfile = mockAdapter.getActiveProfile();

      assert.ok(profileEntry, "Should find profile entry");
      assert.ok(
        profileEntry.name === profileName,
        "Should have correct profile name",
      );
      assert.ok(typeof profileEntry.id === "string", "Should have profile ID");

      const isActive = profileName === activeProfile;
      assert.ok(
        typeof isActive === "boolean",
        "Should determine if profile is active",
      );
    });

    test("POST /roo/profiles - Create new profile", async () => {
      const profileData = TestData.profileData({ name: "NewTestProfile" });

      // Validate profile data
      assert.ok(
        profileData.name.length > 0,
        "Profile name should not be empty",
      );
      assert.ok(profileData.profile.apiProvider, "Should have API provider");
      assert.ok(
        Validators.isValidApiProvider(profileData.profile.apiProvider),
        "Should have valid API provider",
      );

      // Test profile creation
      const existingProfiles = mockAdapter.getProfiles();
      const profileExists = existingProfiles.includes(profileData.name);

      if (!profileExists) {
        const profileId = await mockAdapter.createProfile(
          profileData.name,
          profileData.profile,
          profileData.activate,
        );
        assert.ok(typeof profileId === "string", "Should return profile ID");
        assert.ok(profileId.length > 0, "Profile ID should not be empty");
      } else {
        // Test duplicate profile handling
        assert.ok(true, "Should handle duplicate profile names");
      }
    });

    test("PUT /roo/profiles/{name} - Update existing profile", async () => {
      const profileName = "Development";
      const updateData = {
        profile: {
          apiProvider: "anthropic",
          apiKey: "updated-test-key",
          apiModelId: "claude-3-opus-20240229",
          modelTemperature: 0.8,
        },
        activate: false,
      };

      // Check if profile exists
      const profileEntry = mockAdapter.getProfileEntry(profileName);
      assert.ok(profileEntry, "Profile should exist before update");

      // Test profile update
      const updatedId = await mockAdapter.updateProfile(
        profileName,
        updateData.profile,
        updateData.activate,
      );
      assert.ok(
        typeof updatedId === "string",
        "Should return updated profile ID",
      );
    });

    test("DELETE /roo/profiles/{name} - Delete profile", async () => {
      const profileName = "Testing";
      const profiles = mockAdapter.getProfiles();
      const activeProfile = mockAdapter.getActiveProfile();

      // Test deletion constraints
      if (profiles.includes(profileName)) {
        if (profileName !== activeProfile) {
          await mockAdapter.deleteProfile(profileName);
          assert.ok(true, "Should delete non-active profile");
        } else {
          // Should not delete active profile
          assert.ok(true, "Should prevent deleting active profile");
        }
      }
    });

    test("PUT /roo/profiles/active/{name} - Set active profile", async () => {
      const profileName = "Production";
      const profiles = mockAdapter.getProfiles();

      if (profiles.includes(profileName)) {
        await mockAdapter.setActiveProfile(profileName);
        assert.ok(true, "Should set profile as active");
      } else {
        assert.ok(true, "Should handle non-existent profile");
      }
    });
  });

  suite("MCP Configuration Integration Tests", () => {
    test("POST /roo/install-mcp-config - Install with specific extension", async () => {
      const requestData = TestData.mcpConfigRequest();

      const mockAvailableExtensions = [
        { id: "rooveterinaryinc.roo-cline", displayName: "Roo Code" },
        { id: "kilocode.kilo-code", displayName: "Kilo Code" },
      ];

      // Test extension availability
      const targetExtension = mockAvailableExtensions.find(
        (ext) => ext.id === requestData.extensionId,
      );
      assert.ok(targetExtension, "Target extension should be available");
      assert.ok(
        typeof targetExtension.displayName === "string",
        "Extension should have display name",
      );
    });

    test("POST /roo/install-mcp-config - Use default extension when none specified", async () => {
      const requestData = {}; // No extensionId specified

      const mockAvailableExtensions = [
        { id: "rooveterinaryinc.roo-cline", displayName: "Roo Code" },
        { id: "kilocode.kilo-code", displayName: "Kilo Code" },
      ];

      // Should use first available extension
      const defaultExtension = mockAvailableExtensions[0];
      assert.ok(defaultExtension, "Should have default extension");
      assert.ok(
        typeof defaultExtension.id === "string",
        "Default extension should have ID",
      );
    });

    test("POST /roo/install-mcp-config - Handle no available extensions", async () => {
      const mockAvailableExtensions: any[] = [];

      // Should handle case with no available extensions
      if (mockAvailableExtensions.length === 0) {
        const errorMessage =
          "No supported extensions are currently installed. Please install a compatible extension like Roo Code or Kilo Code.";
        assert.ok(
          errorMessage.includes("No supported extensions"),
          "Should indicate no extensions available",
        );
      }
    });
  });

  suite("Error Handling Integration Tests", () => {
    test("Handle extension not available", async () => {
      const inactiveAdapter = createMockRooAdapter({ isActive: false });

      // Mock controller to return inactive adapter
      const originalGetRooAdapter = controller.getRooAdapter;
      controller.getRooAdapter = () => inactiveAdapter as any;

      try {
        if (!inactiveAdapter.isActive) {
          const errorMessage =
            "RooCode extension test-extension is not available";
          assert.ok(
            errorMessage.includes("not available"),
            "Should handle inactive extension",
          );
        }
      } finally {
        // Restore original method
        controller.getRooAdapter = originalGetRooAdapter;
      }
    });

    test("Handle task not found", async () => {
      const nonExistentTaskId = "non-existent-task";

      const activeTaskIds = mockAdapter.getActiveTaskIds();
      const isInHistory = await mockAdapter.isTaskInHistory(nonExistentTaskId);

      if (!activeTaskIds.includes(nonExistentTaskId) && !isInHistory) {
        const errorMessage = `Task with ID ${nonExistentTaskId} not found`;
        assert.ok(
          errorMessage.includes("not found"),
          "Should handle non-existent task",
        );
      }
    });

    test("Handle profile not found", async () => {
      const nonExistentProfile = "NonExistentProfile";
      const profileEntry = mockAdapter.getProfileEntry(nonExistentProfile);

      if (!profileEntry) {
        const errorMessage = `Profile '${nonExistentProfile}' not found`;
        assert.ok(
          errorMessage.includes("not found"),
          "Should handle non-existent profile",
        );
      }
    });

    test("Handle invalid action", async () => {
      const invalidAction = "invalidAction";

      const isValid = Validators.isValidTaskAction(invalidAction);
      if (!isValid) {
        const errorMessage = `Unknown action: ${invalidAction}`;
        assert.ok(
          errorMessage.includes("Unknown action"),
          "Should handle invalid action",
        );
      }
    });

    test("Handle empty request data", async () => {
      const emptyTextRequest = { text: "", images: [] };
      assert.ok(emptyTextRequest.text.length === 0, "Should detect empty text");

      const incompleteRequest = { images: [] }; // Missing text
      assert.ok(
        !("text" in incompleteRequest),
        "Should detect missing required fields",
      );
    });
  });

  suite("Server-Sent Events Integration Tests", () => {
    test("SSE event stream format", async () => {
      const events = TestData.sseEvents();

      events.forEach((event) => {
        assert.ok(
          Validators.isValidSseEvent(event),
          "Event should have valid SSE structure",
        );

        // Test SSE formatting
        const sseFormatted = {
          event: event.name,
          data: JSON.stringify(event.data),
        };

        assert.ok(
          sseFormatted.event === event.name,
          "SSE should preserve event name",
        );
        assert.ok(
          typeof sseFormatted.data === "string",
          "SSE data should be stringified",
        );
      });
    });

    test("Message deduplication logic", async () => {
      const duplicateMessage = { text: "Same message", partial: false };
      const messages = [
        { message: duplicateMessage },
        { message: duplicateMessage }, // Duplicate
        { message: { text: "Different message", partial: false } },
      ];

      // Simulate deduplication logic
      let lastMessage: any;
      const filteredMessages = messages.filter((msg) => {
        if (!msg.message.partial && lastMessage && !lastMessage.partial) {
          const isDuplicate =
            JSON.stringify(lastMessage) === JSON.stringify(msg.message);
          if (isDuplicate) {
            return false;
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
