import * as vscode from "vscode";
import { logger } from "./utils/logger";
import { ExtensionController, ExtensionType } from "./core/controller";
import { LocalServer } from "./server/local-server";

let controller: ExtensionController;
let localServer: LocalServer;

export async function activate(context: vscode.ExtensionContext) {
  // Debugging usage
  logger.show();

  // Initialize the extension controller
  controller = new ExtensionController();

  try {
    await controller.initialize();
    logger.info("Extension controller initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize extension controller:", error);
    vscode.window.showErrorMessage(
      `Cline Maestro: Failed to initialize - ${(error as Error).message}`,
    );
  }

  // Initialize local server
  localServer = new LocalServer(controller);

  // Register commands
  const disposables = [
    vscode.commands.registerCommand("cline-maestro.startServer", async () => {
      try {
        if (localServer.isRunning()) {
          vscode.window.showWarningMessage("Local server is already running");
          return;
        }

        await localServer.start();
        vscode.window.showInformationMessage(
          `Local server started at ${localServer.getUrl()}`,
        );
      } catch (error) {
        logger.error("Failed to start local server:", error);
        vscode.window.showErrorMessage(
          `Failed to start local server: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("cline-maestro.stopServer", async () => {
      try {
        if (!localServer.isRunning()) {
          vscode.window.showWarningMessage("Local server is not running");
          return;
        }

        await localServer.stop();
        vscode.window.showInformationMessage("Local server stopped");
      } catch (error) {
        logger.error("Failed to stop local server:", error);
        vscode.window.showErrorMessage(
          `Failed to stop local server: ${(error as Error).message}`,
        );
      }
    }),

    vscode.commands.registerCommand("cline-maestro.getStatus", () => {
      const status = controller.getExtensionStatus();
      const message =
        `Extensions Status:\n` +
        `Cline: ${status.cline.isInstalled ? "Installed" : "Not installed"} - ${status.cline.isActive ? "Active" : "Inactive"}\n` +
        `RooCode: ${status.rooCode.isInstalled ? "Installed" : "Not installed"} - ${status.rooCode.isActive ? "Active" : "Inactive"}`;
      vscode.window.showInformationMessage(message);
    }),

    vscode.commands.registerCommand("cline-maestro.startTask", async () => {
      try {
        const task = await vscode.window.showInputBox({
          prompt: "Enter task description",
          placeHolder: "What would you like the AI to help you with?",
        });

        if (!task) {
          return;
        }

        const extensionTypeString = await vscode.window.showQuickPick(
          ["Cline", "Roo Code"],
          { placeHolder: "Select extension to use" },
        );

        if (!extensionTypeString) {
          return;
        }

        const extensionType =
          extensionTypeString === "Cline"
            ? ExtensionType.CLINE
            : ExtensionType.ROO_CODE;
        const taskId = await controller.startNewTask({ task }, extensionType);
        vscode.window.showInformationMessage(
          `Task started with ${extensionType} (ID: ${taskId})`,
        );
      } catch (error) {
        logger.error("Failed to start task:", error);
        vscode.window.showErrorMessage(
          `Failed to start task: ${(error as Error).message}`,
        );
      }
    }),
  ];

  context.subscriptions.push(...disposables);

  return controller;
}

// This method is called when your extension is deactivated
export async function deactivate() {
  try {
    if (localServer?.isRunning()) {
      await localServer.stop();
      logger.info("Local server stopped during deactivation");
    }

    if (controller) {
      await controller.dispose();
      logger.info("Extension controller disposed");
    }
  } catch (error) {
    logger.error("Error during deactivation:", error);
  }
}
