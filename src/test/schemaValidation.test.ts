import * as assert from "assert";
import * as vscode from "vscode";
import {
  CreateProfileRequestSchema,
  ErrorResponseSchema,
  HistoryItemSchema,
  imagesDataUriErrorMessage,
  ImagesDataUriSchema,
  ProviderSettingsSchema,
  RooActionRequestSchema,
  RooMessageRequestSchema,
  SetActiveProfileRequestSchema,
  UpdateProfileRequestSchema,
} from "../server/schemas";
import { TestData } from "./testUtils";

suite("Schema Validation Tests", () => {
  suiteSetup(() => {
    vscode.window.showInformationMessage("Starting Schema Validation tests...");
  });

  suiteTeardown(() => {
    vscode.window.showInformationMessage("Schema Validation tests completed.");
  });

  suite("RooMessageRequestSchema Validation", () => {
    test("Valid RooMessageRequest", () => {
      const validRequest = TestData.taskRequest();
      const result = RooMessageRequestSchema.safeParse(validRequest);

      assert.ok(result.success, "Should accept valid request");
      if (result.success) {
        assert.ok(
          result.data.text === validRequest.text,
          "Should preserve text",
        );
        assert.ok(
          Array.isArray(result.data.images),
          "Should preserve images array",
        );
        assert.ok(
          result.data.extensionId === validRequest.extensionId,
          "Should preserve extension ID",
        );
      }
    });

    test("Invalid RooMessageRequest - empty text", () => {
      const invalidRequest = { ...TestData.taskRequest(), text: "" };
      const result = RooMessageRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject empty text");
    });

    test("Invalid RooMessageRequest - missing text", () => {
      const invalidRequest = { images: [], extensionId: "test" };
      const result = RooMessageRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject missing text field");
    });

    test("Valid RooMessageRequest - optional fields", () => {
      const minimalRequest = { text: "Test task" };
      const result = RooMessageRequestSchema.safeParse(minimalRequest);

      assert.ok(result.success, "Should accept minimal valid request");
      if (result.success) {
        assert.ok(result.data.text === "Test task", "Should preserve text");
        assert.ok(
          result.data.images === undefined,
          "Optional images should be undefined",
        );
      }
    });
  });

  suite("ImagesDataUriSchema Validation", () => {
    test("Valid image data URIs", () => {
      const validImages = [TestData.validImageDataUri()];
      const result = ImagesDataUriSchema.safeParse(validImages);

      assert.ok(result.success, "Should accept valid image data URIs");
    });

    test("Invalid image data URIs", () => {
      const invalidImages = TestData.invalidImageDataUris();

      for (const invalidImage of invalidImages) {
        const result = ImagesDataUriSchema.safeParse([invalidImage]);
        assert.ok(
          !result.success,
          `Should reject invalid image: ${invalidImage}`,
        );

        if (!result.success) {
          const errorMessage = result.error.issues[0]?.message;
          assert.ok(
            errorMessage === imagesDataUriErrorMessage,
            "Should have correct error message",
          );
        }
      }
    });

    test("Empty images array", () => {
      const emptyImages: string[] = [];
      const result = ImagesDataUriSchema.safeParse(emptyImages);

      assert.ok(result.success, "Should accept empty images array");
    });

    test("Undefined images", () => {
      const result = ImagesDataUriSchema.safeParse(undefined);

      assert.ok(result.success, "Should accept undefined images");
    });
  });

  suite("RooActionRequestSchema Validation", () => {
    test("Valid action requests", () => {
      const validActions = [
        "pressPrimaryButton",
        "pressSecondaryButton",
        "cancel",
        "resume",
      ];

      for (const action of validActions) {
        const request = TestData.actionRequest(action);
        const result = RooActionRequestSchema.safeParse(request);

        assert.ok(result.success, `Should accept valid action: ${action}`);
        if (result.success) {
          assert.ok(result.data.action === action, "Should preserve action");
        }
      }
    });

    test("Invalid action request", () => {
      const invalidRequest = TestData.actionRequest("invalidAction");
      const result = RooActionRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject invalid action");
    });

    test("Missing action field", () => {
      const invalidRequest = { extensionId: "test" };
      const result = RooActionRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject missing action field");
    });
  });

  suite("ProviderSettingsSchema Validation", () => {
    test("Valid provider settings", () => {
      const validSettings = {
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
      };

      const result = ProviderSettingsSchema.safeParse(validSettings);

      assert.ok(result.success, "Should accept valid provider settings");
      if (result.success) {
        assert.ok(
          result.data.apiProvider === validSettings.apiProvider,
          "Should preserve API provider",
        );
        assert.ok(
          result.data.modelTemperature === validSettings.modelTemperature,
          "Should preserve temperature",
        );
      }
    });

    test("Valid provider settings - minimal", () => {
      const minimalSettings = { apiProvider: "openai" };
      const result = ProviderSettingsSchema.safeParse(minimalSettings);

      assert.ok(result.success, "Should accept minimal provider settings");
    });

    test("Invalid API provider", () => {
      const invalidSettings = { apiProvider: "invalid-provider" };
      const result = ProviderSettingsSchema.safeParse(invalidSettings);

      assert.ok(!result.success, "Should reject invalid API provider");
    });

    test("Invalid reasoning effort", () => {
      const invalidSettings = {
        apiProvider: "anthropic",
        reasoningEffort: "invalid-effort",
      };
      const result = ProviderSettingsSchema.safeParse(invalidSettings);

      assert.ok(!result.success, "Should reject invalid reasoning effort");
    });

    test("Valid reasoning effort values", () => {
      const validEfforts = ["low", "medium", "high"];

      for (const effort of validEfforts) {
        const settings = {
          apiProvider: "anthropic",
          reasoningEffort: effort,
        };
        const result = ProviderSettingsSchema.safeParse(settings);

        assert.ok(
          result.success,
          `Should accept valid reasoning effort: ${effort}`,
        );
      }
    });
  });

  suite("CreateProfileRequestSchema Validation", () => {
    test("Valid create profile request", () => {
      const validRequest = TestData.profileData();
      const result = CreateProfileRequestSchema.safeParse(validRequest);

      assert.ok(result.success, "Should accept valid create profile request");
      if (result.success) {
        assert.ok(
          result.data.name === validRequest.name,
          "Should preserve name",
        );
        assert.ok(
          result.data.activate === validRequest.activate,
          "Should preserve activate flag",
        );
      }
    });

    test("Valid create profile request - minimal", () => {
      const minimalRequest = { name: "TestProfile" };
      const result = CreateProfileRequestSchema.safeParse(minimalRequest);

      assert.ok(result.success, "Should accept minimal create profile request");
      if (result.success) {
        assert.ok(
          result.data.activate === true,
          "Should default activate to true",
        );
      }
    });

    test("Invalid create profile request - empty name", () => {
      const invalidRequest = { ...TestData.profileData(), name: "" };
      const result = CreateProfileRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject empty profile name");
    });

    test("Invalid create profile request - missing name", () => {
      const invalidRequest = { profile: { apiProvider: "anthropic" } };
      const result = CreateProfileRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject missing profile name");
    });
  });

  suite("UpdateProfileRequestSchema Validation", () => {
    test("Valid update profile request", () => {
      const validRequest = {
        profile: {
          apiProvider: "anthropic",
          apiKey: "updated-key",
          modelTemperature: 0.8,
        },
        activate: false,
        extensionId: "test-extension",
      };

      const result = UpdateProfileRequestSchema.safeParse(validRequest);

      assert.ok(result.success, "Should accept valid update profile request");
      if (result.success) {
        assert.ok(
          result.data.profile.apiProvider === "anthropic",
          "Should preserve profile settings",
        );
        assert.ok(
          result.data.activate === false,
          "Should preserve activate flag",
        );
      }
    });

    test("Valid update profile request - minimal", () => {
      const minimalRequest = {
        profile: { apiProvider: "openai" },
      };

      const result = UpdateProfileRequestSchema.safeParse(minimalRequest);

      assert.ok(result.success, "Should accept minimal update profile request");
      if (result.success) {
        assert.ok(
          result.data.activate === true,
          "Should default activate to true",
        );
      }
    });

    test("Invalid update profile request - missing profile", () => {
      const invalidRequest = { activate: true };
      const result = UpdateProfileRequestSchema.safeParse(invalidRequest);

      assert.ok(!result.success, "Should reject missing profile field");
    });
  });

  suite("SetActiveProfileRequestSchema Validation", () => {
    test("Valid set active profile request", () => {
      const validRequest = { extensionId: "test-extension" };
      const result = SetActiveProfileRequestSchema.safeParse(validRequest);

      assert.ok(
        result.success,
        "Should accept valid set active profile request",
      );
    });

    test("Valid set active profile request - empty", () => {
      const emptyRequest = {};
      const result = SetActiveProfileRequestSchema.safeParse(emptyRequest);

      assert.ok(
        result.success,
        "Should accept empty set active profile request",
      );
    });
  });

  suite("ErrorResponseSchema Validation", () => {
    test("Valid error response", () => {
      const validError = { message: "Test error message" };
      const result = ErrorResponseSchema.safeParse(validError);

      assert.ok(result.success, "Should accept valid error response");
      if (result.success) {
        assert.ok(
          result.data.message === validError.message,
          "Should preserve error message",
        );
      }
    });

    test("Invalid error response - missing message", () => {
      const invalidError = {};
      const result = ErrorResponseSchema.safeParse(invalidError);

      assert.ok(!result.success, "Should reject missing error message");
    });

    test("Invalid error response - non-string message", () => {
      const invalidError = { message: 123 };
      const result = ErrorResponseSchema.safeParse(invalidError);

      assert.ok(!result.success, "Should reject non-string error message");
    });
  });

  suite("HistoryItemSchema Validation", () => {
    test("Valid history item", () => {
      const validItem = {
        id: "task-1",
        number: 1,
        ts: Date.now(),
        task: "Test task",
        tokensIn: 100,
        tokensOut: 200,
        cacheWrites: 10,
        cacheReads: 5,
        totalCost: 0.01,
        size: 1024,
        workspace: "/test/workspace",
      };

      const result = HistoryItemSchema.safeParse(validItem);

      assert.ok(result.success, "Should accept valid history item");
      if (result.success) {
        assert.ok(result.data.id === validItem.id, "Should preserve ID");
        assert.ok(result.data.task === validItem.task, "Should preserve task");
        assert.ok(
          result.data.tokensIn === validItem.tokensIn,
          "Should preserve input tokens",
        );
        assert.ok(
          result.data.tokensOut === validItem.tokensOut,
          "Should preserve output tokens",
        );
      }
    });

    test("Valid history item - minimal required fields", () => {
      const minimalItem = {
        id: "task-1",
        ts: Date.now(),
        task: "Test task",
        tokensIn: 100,
        tokensOut: 200,
        totalCost: 0.01,
      };

      const result = HistoryItemSchema.safeParse(minimalItem);

      assert.ok(result.success, "Should accept minimal valid history item");
    });

    test("Invalid history item - missing required fields", () => {
      const invalidItem = {
        id: "task-1",
        task: "Test task",
        // Missing required fields: ts, tokensIn, tokensOut, totalCost
      };

      const result = HistoryItemSchema.safeParse(invalidItem);

      assert.ok(
        !result.success,
        "Should reject history item with missing required fields",
      );
    });

    test("Invalid history item - wrong field types", () => {
      const invalidItem = {
        id: "task-1",
        number: "not-a-number", // Should be number
        ts: Date.now(),
        task: "Test task",
        tokensIn: 100,
        tokensOut: 200,
        totalCost: 0.01,
      };

      const result = HistoryItemSchema.safeParse(invalidItem);

      assert.ok(
        !result.success,
        "Should reject history item with wrong field types",
      );
    });
  });

  suite("Schema Integration Tests", () => {
    test("Complete task creation flow validation", () => {
      // Test complete flow from request to response
      const taskRequest = TestData.taskRequest();
      const requestResult = RooMessageRequestSchema.safeParse(taskRequest);

      assert.ok(requestResult.success, "Task request should be valid");

      // Simulate task creation and history item generation
      if (requestResult.success) {
        const historyItem = {
          id: "generated-task-id",
          number: 1,
          ts: Date.now(),
          task: requestResult.data.text,
          tokensIn: 100,
          tokensOut: 200,
          totalCost: 0.01,
        };

        const historyResult = HistoryItemSchema.safeParse(historyItem);
        assert.ok(
          historyResult.success,
          "Generated history item should be valid",
        );
      }
    });

    test("Complete profile management flow validation", () => {
      // Test profile creation
      const createRequest = TestData.profileData();
      const createResult = CreateProfileRequestSchema.safeParse(createRequest);

      assert.ok(
        createResult.success,
        "Profile creation request should be valid",
      );

      if (createResult.success) {
        // Test profile update
        const updateRequest = {
          profile: {
            ...createResult.data.profile,
            modelTemperature: 0.9,
          },
          activate: false,
        };

        const updateResult =
          UpdateProfileRequestSchema.safeParse(updateRequest);
        assert.ok(
          updateResult.success,
          "Profile update request should be valid",
        );

        // Test set active profile
        const setActiveRequest = { extensionId: createResult.data.extensionId };
        const setActiveResult =
          SetActiveProfileRequestSchema.safeParse(setActiveRequest);
        assert.ok(
          setActiveResult.success,
          "Set active profile request should be valid",
        );
      }
    });

    test("Error response consistency", () => {
      const commonErrors = [
        "Extension not available",
        "Task not found",
        "Profile already exists",
        "Cannot delete active profile",
        "Unknown action: invalidAction",
      ];

      for (const errorMessage of commonErrors) {
        const errorResponse = { message: errorMessage };
        const result = ErrorResponseSchema.safeParse(errorResponse);

        assert.ok(
          result.success,
          `Error response should be valid: ${errorMessage}`,
        );
      }
    });
  });
});
