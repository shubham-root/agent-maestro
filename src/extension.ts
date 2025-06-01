import * as vscode from "vscode";
import { logger } from "./utils/logger";

export function activate(context: vscode.ExtensionContext) {
  // Debugging usage
  logger.show();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "cline-maestro.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from Cline Maestro!");
    },
  );

  const clineExtension = vscode.extensions.getExtension(
    "saoudrizwan.claude-dev",
  );
  const rooCodeExtension = vscode.extensions.getExtension(
    "rooveterinaryinc.roo-cline",
  );

  // TODO: Check if the Cline API is available

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
