import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as http from "http";
import { logger } from "../utils/logger";
import { ClineAPI } from "../types/cline";

export interface ClineTaskOptions {
  task?: string;
  images?: string[];
}

/**
 * Dedicated adapter for Cline extension management
 * Handles Cline-specific logic including test mode setup and API interactions
 */
export class ClineAdapter {
  private extension: vscode.Extension<any> | undefined;
  private api: ClineAPI | undefined;
  private isInitialized = false;

  constructor() {}

  /**
   * Initialize the Cline adapter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info("ClineAdapter already initialized");
      return;
    }

    try {
      await this.discoverExtension();
      await this.activateExtension();

      this.isInitialized = true;
      logger.info("ClineAdapter initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize ClineAdapter:", error);
      throw error;
    }
  }

  /**
   * Discover Cline extension
   */
  private async discoverExtension(): Promise<void> {
    this.extension = vscode.extensions.getExtension("saoudrizwan.claude-dev");

    if (this.extension) {
      logger.info(
        `Found Cline extension v${this.extension.packageJSON.version}`,
      );
    } else {
      throw new Error(
        "Cline extension not found. Please install Cline extension.",
      );
    }
  }

  /**
   * Activate Cline extension
   */
  private async activateExtension(): Promise<void> {
    if (!this.extension) {
      throw new Error("Cline extension not discovered");
    }

    // Enable test mode before activation
    await this.enableTestMode();

    if (!this.extension.isActive) {
      try {
        this.api = await this.extension.activate();

        // Verify test mode is working
        const isTestModeEnabled = await this.isTestModeEnabled();
        if (isTestModeEnabled) {
          logger.info("Cline extension activated with test mode enabled");
        } else {
          logger.warn(
            "Cline test mode is not enabled. Please ensure localhost:9876 is running.",
          );
        }
      } catch (error) {
        logger.error("Failed to activate Cline extension:", error);
        throw error;
      }
    } else {
      this.api = this.extension.exports;
      logger.info("Cline extension already active");
    }
  }

  /**
   * Enable Cline test mode by creating .tmp folder and evals.env file
   */
  private async enableTestMode(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error("No workspace folder found");
      }

      const tmpDir = path.join(workspaceFolder.uri.fsPath, ".tmp");
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
    } catch (error) {
      logger.error("Failed to enable Cline test mode:", error);
      throw error;
    }
  }

  /**
   * Disable Cline test mode by removing .tmp folder
   */
  private async disableTestMode(): Promise<void> {
    try {
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
   * Send message to current task
   */
  async sendMessage(message?: string, images?: string[]): Promise<void> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    logger.info("Sending message to Cline");
    await this.api.sendMessage(message, images);
  }

  /**
   * Press primary button
   */
  async pressPrimaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    logger.info("Pressing Cline primary button");
    await this.api.pressPrimaryButton();
  }

  /**
   * Press secondary button
   */
  async pressSecondaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    logger.info("Pressing Cline secondary button");
    await this.api.pressSecondaryButton();
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
   * Call any function on the Cline API
   */
  async callFunction(functionName: string, payload?: any): Promise<any> {
    if (!this.api) {
      throw new Error("Cline API not available");
    }

    const apiObj = this.api as any;

    if (typeof apiObj[functionName] !== "function") {
      throw new Error(`Function '${functionName}' not found in Cline API`);
    }

    logger.info(`Calling Cline function: ${functionName}`);

    try {
      // Handle different function signatures
      if (payload === undefined) {
        return await apiObj[functionName]();
      } else if (Array.isArray(payload)) {
        return await apiObj[functionName](...payload);
      } else {
        return await apiObj[functionName](payload);
      }
    } catch (error) {
      logger.error(`Error calling Cline function '${functionName}':`, error);
      throw error;
    }
  }

  /**
   * Get available functions
   */
  getAvailableFunctions(): string[] {
    if (!this.api) {
      return [];
    }

    const apiObj = this.api as any;
    return Object.getOwnPropertyNames(Object.getPrototypeOf(apiObj))
      .concat(Object.getOwnPropertyNames(apiObj))
      .filter(
        (name) => typeof apiObj[name] === "function" && name !== "constructor",
      )
      .sort();
  }

  /**
   * Check if adapter is ready
   */
  isReady(): boolean {
    return this.isInitialized && !!this.api;
  }

  /**
   * Check if extension is installed
   */
  isInstalled(): boolean {
    return !!this.extension;
  }

  /**
   * Check if extension is active
   */
  isActive(): boolean {
    return !!this.api;
  }

  /**
   * Get extension version
   */
  getVersion(): string | undefined {
    return this.extension?.packageJSON.version;
  }

  /**
   * Get the API instance
   */
  getApi(): ClineAPI | undefined {
    return this.api;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.api = undefined;
    this.isInitialized = false;
    await this.disableTestMode();
  }
}
