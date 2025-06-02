import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as http from "http";
import { logger } from "../utils/logger";
import { ClineAPI } from "../types/cline";
import { ExtensionBaseAdapter } from "./ExtensionBaseAdapter";

export interface ClineTaskOptions {
  task?: string;
  images?: string[];
}

/**
 * Dedicated adapter for Cline extension management
 * Handles Cline-specific logic including test mode setup and API interactions
 */
export class ClineAdapter extends ExtensionBaseAdapter<ClineAPI> {
  constructor() {
    super();
  }

  /**
   * Get the extension ID to discover
   */
  protected getExtensionId(): string {
    return "saoudrizwan.claude-dev";
  }

  /**
   * Get the display name for logging
   */
  protected getDisplayName(): string {
    return "ClineAdapter";
  }

  /**
   * Perform pre-activation setup
   */
  protected async preActivation(): Promise<void> {
    await this.enableTestMode();
  }

  /**
   * Perform post-activation setup
   */
  protected async postActivation(): Promise<void> {
    // Verify test mode is working
    const isTestModeEnabled = await this.isTestModeEnabled();
    if (isTestModeEnabled) {
      logger.info("Cline extension activated with test mode enabled");
    } else {
      logger.warn(
        "Cline test mode is not enabled. Please ensure localhost:9876 is running.",
      );
    }
  }

  /**
   * Enable Cline test mode by creating .tmp folder and evals.env file
   */
  private async enableTestMode(): Promise<void> {
    try {
      let workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri;
      let shouldOpenWorkspace = false;

      if (!workspacePath) {
        workspacePath = vscode.Uri.file(os.homedir());
        shouldOpenWorkspace = true;
      }

      const tmpDir = path.join(workspacePath.fsPath, ".tmp");
      const evalsEnvPath = path.join(tmpDir, "evals.env");

      // Create .tmp directory if it doesn't exist
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
        logger.info("Created .tmp directory for Cline test mode");
      }

      // Create empty evals.env file if it doesn't exist
      if (!fs.existsSync(evalsEnvPath)) {
        fs.writeFileSync(evalsEnvPath, "");
        logger.info("Created evals.env file for Cline test mode");
      }

      if (shouldOpenWorkspace) {
        await vscode.commands.executeCommand(
          "vscode.openFolder",
          vscode.Uri.file(tmpDir),
        );
      }
    } catch (error) {
      logger.error("Failed to enable Cline test mode:", error);
      throw error;
    }
  }

  /**
   * Disable Cline test mode by shutting down the server and removing .tmp folder
   */
  private async disableTestMode(): Promise<void> {
    try {
      // First, try to shutdown the local server
      await this.shutdownServer();

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error("No workspace folder found");
      }

      const tmpDir = path.join(workspaceFolder.uri.fsPath, ".tmp");

      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        logger.info("Removed .tmp directory");
      }
    } catch (error) {
      logger.error("Failed to disable Cline test mode:", error);
      throw error;
    }
  }

  /**
   * Shutdown the Cline test server by calling the /shutdown endpoint
   */
  private async shutdownServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: 9876,
          path: "/shutdown",
          method: "POST",
          timeout: 5000,
        },
        (res) => {
          logger.info("Cline test server shutdown request sent");
          res.on("data", () => {});
          res.on("end", () => {
            resolve();
          });
        },
      );

      req.on("error", (error) => {
        // If the server is not running or already shut down, that's fine
        logger.info(
          "Cline test server shutdown request failed (server may already be down):",
          error.message,
        );
        resolve();
      });

      req.on("timeout", () => {
        req.destroy();
        logger.warn("Cline test server shutdown request timed out");
        resolve();
      });

      req.end();
    });
  }

  /**
   * Check if Cline test mode is enabled by testing if localhost:9876 is alive
   */
  private async isTestModeEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: 9876,
          method: "GET",
          timeout: 3000,
        },
        (res) => {
          resolve(true);
          res.on("data", () => {});
          res.on("end", () => {});
        },
      );

      req.on("error", () => {
        resolve(false);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Start a new task
   */
  async startNewTask(options: ClineTaskOptions = {}): Promise<void> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    logger.info("Starting new Cline task");
    await this.api.startNewTask(options.task, options.images);
  }

  /**
   * Get custom instructions
   */
  async getCustomInstructions(): Promise<string | undefined> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    return await this.api.getCustomInstructions();
  }

  /**
   * Set custom instructions
   */
  async setCustomInstructions(value: string): Promise<void> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    await this.api.setCustomInstructions(value);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.api = undefined;
    if (this.isActive) {
      await this.disableTestMode();
    }
    this.isActive = false;
  }
}
