import * as vscode from "vscode";
import { logger } from "./utils/logger";
import { ExtensionController, ExtensionType } from "./core/controller";
import { ProxyServer } from "./server/ProxyServer";

let controller: ExtensionController;
let proxy: ProxyServer;
let lastUsedExtension: ExtensionType | null = null;

export async function activate(context: vscode.ExtensionContext) {
  // Debugging usage
  logger.show();

  // Initialize the extension controller
  controller = new ExtensionController();

  try {
    await controller.initialize();
  } catch (error) {
    logger.error("Failed to initialize extension controller:", error);
    vscode.window.showErrorMessage(
      `Agent Maestro: Failed to initialize - ${(error as Error).message}`,
    );
  }

  proxy = new ProxyServer(controller);

  // Register commands
  const disposables = [
    vscode.commands.registerCommand("agent-maestro.getStatus", () => {
      const status = controller.getExtensionStatus();
      vscode.window.showInformationMessage(JSON.stringify(status, null, 2));
    }),

    vscode.commands.registerCommand("agent-maestro.startTask", async () => {
      try {
        const text = await vscode.window.showInputBox({
          prompt: "Enter task description",
          placeHolder: "What would you like the AI to help you with?",
        });

        if (!text) {
          return;
        }

        const extensionTypeString = await vscode.window.showQuickPick(
          ["Roo Code", "Cline"],
          { placeHolder: "Select extension to use" },
        );

        if (!extensionTypeString) {
          return;
        }

        const extensionType =
          extensionTypeString === "Cline"
            ? ExtensionType.CLINE
            : ExtensionType.ROO_CODE;
        const lastTaskId = await controller.startNewTask(
          { text },
          extensionType,
        );

        // Track the last used extension and mark that we have an active task
        lastUsedExtension = extensionType;

        logger.info(
          `New task started with ID: ${lastTaskId} using ${extensionType}`,
        );
      } catch (error) {
        logger.error("Failed to start task:", error);
        vscode.window.showErrorMessage(
          `Failed to start task: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("agent-maestro.startServer", async () => {
      try {
        if (!proxy) {
          vscode.window.showErrorMessage("Proxy server not initialized");
          return;
        }

        await proxy.start();
        vscode.window.showInformationMessage(
          `Proxy server started on ${proxy.getStatus().url}, you can check all available API endpoints at ${proxy.getOpenAPIUrl()}`,
        );
      } catch (error) {
        logger.error("Failed to start server:", error);
        vscode.window.showErrorMessage(
          `Failed to start server: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("agent-maestro.stopServer", async () => {
      try {
        if (!proxy) {
          vscode.window.showErrorMessage("Proxy server not initialized");
          return;
        }

        await proxy.stop();
        vscode.window.showInformationMessage("Proxy server stopped");
      } catch (error) {
        logger.error("Failed to stop server:", error);
        vscode.window.showErrorMessage(
          `Failed to stop server: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("agent-maestro.restartServer", async () => {
      try {
        if (!proxy) {
          vscode.window.showErrorMessage("Proxy server not initialized");
          return;
        }

        await proxy.restart();
        const status = proxy.getStatus();
        vscode.window.showInformationMessage(
          `Proxy server restarted on ${status.url}`,
        );
      } catch (error) {
        logger.error("Failed to restart server:", error);
        vscode.window.showErrorMessage(
          `Failed to restart server: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("agent-maestro.getServerStatus", () => {
      if (!proxy) {
        vscode.window.showErrorMessage("Proxy server not initialized");
        return;
      }

      const status = proxy.getStatus();
      vscode.window.showInformationMessage(
        `Server Status: ${status.isRunning ? "Running" : "Stopped"} | Port: ${status.port} | URL: ${status.url}`,
      );
    }),

    vscode.commands.registerCommand("agent-maestro.sendMessage", async () => {
      try {
        // Check if we have a last used extension
        if (!lastUsedExtension) {
          vscode.window.showWarningMessage(
            "No previous extension called by Agent Maestro before. Please start a new task first.",
          );
          return;
        }

        // Check if the last used extension is still available
        if (!controller.isExtensionAvailable(lastUsedExtension)) {
          vscode.window.showErrorMessage(
            `${lastUsedExtension} adapter not available or not active`,
          );
          return;
        }

        const text = await vscode.window.showInputBox({
          prompt: `Enter message to send to ${lastUsedExtension} task`,
          placeHolder: "Type your message here...",
        });

        if (!text) {
          return;
        }

        await controller.sendMessage(
          {
            text,
          },
          lastUsedExtension,
        );
      } catch (error) {
        logger.error("Failed to send message:", error);
        vscode.window.showErrorMessage(
          `Failed to send message: ${(error as Error).message}`,
        );
      }
    }),
  ];

  context.subscriptions.push(...disposables);

  await vscode.commands.executeCommand("agent-maestro.startServer");

  return controller;
}

// This method is called when your extension is deactivated
export async function deactivate() {
  try {
    if (proxy) {
      await proxy.stop();
      logger.info("Proxy server stopped");
    }
    if (controller) {
      await controller.dispose();
      logger.info("Extension controller disposed");
    }
  } catch (error) {
    logger.error("Error during deactivation:", error);
  }
}
