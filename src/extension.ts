import * as vscode from "vscode";
import { logger } from "./utils/logger";
import { ExtensionController, ExtensionType } from "./core/controller";

let controller: ExtensionController;

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
      `Cline Maestro: Failed to initialize - ${(error as Error).message}`,
    );
  }

  // Register commands
  const disposables = [
    vscode.commands.registerCommand("cline-maestro.getStatus", () => {
      const status = controller.getExtensionStatus();
      vscode.window.showInformationMessage(JSON.stringify(status, null, 2));
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
        const data = await controller.startNewTask({ task }, extensionType);
        logger.info(data || "No data returned from task start");
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
    if (controller) {
      await controller.dispose();
      logger.info("Extension controller disposed");
    }
  } catch (error) {
    logger.error("Error during deactivation:", error);
  }
}
