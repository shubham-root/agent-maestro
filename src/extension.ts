import * as vscode from "vscode";
import { logger } from "./utils/logger";
import { ExtensionController, ExtensionType } from "./core/controller";
import { ProxyServer } from "./server/ProxyServer";

let controller: ExtensionController;
let proxy: ProxyServer;

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

  proxy = new ProxyServer(controller);

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

    vscode.commands.registerCommand("cline-maestro.startServer", async () => {
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

    vscode.commands.registerCommand("cline-maestro.stopServer", async () => {
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

    vscode.commands.registerCommand("cline-maestro.restartServer", async () => {
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

    vscode.commands.registerCommand("cline-maestro.getServerStatus", () => {
      if (!proxy) {
        vscode.window.showErrorMessage("Proxy server not initialized");
        return;
      }

      const status = proxy.getStatus();
      vscode.window.showInformationMessage(
        `Server Status: ${status.isRunning ? "Running" : "Stopped"} | Port: ${status.port} | URL: ${status.url}`,
      );
    }),
  ];

  context.subscriptions.push(...disposables);

  await vscode.commands.executeCommand("cline-maestro.startServer");

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
