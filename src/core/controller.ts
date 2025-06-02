// import * as vscode from "vscode";
import { EventEmitter } from "events";
import { RooCodeSettings } from "@roo-code/types";
import { v4 } from "uuid";
import { logger } from "../utils/logger";
import { ClineAdapter } from "./ClineAdapter";
import { RooCodeAdapter } from "./RooCodeAdapter";

export interface ExtensionStatus {
  isInstalled: boolean;
  isActive: boolean;
  version?: string;
  api?: any;
}

export interface UnifiedTaskOptions {
  task?: string;
  images?: string[];
  configuration?: RooCodeSettings;
  newTab?: boolean;
}

export enum ExtensionType {
  CLINE = "cline",
  ROO_CODE = "roo-code",
}

/**
 * Core controller to manage Cline and RooCode extensions
 * Provides unified API access and can be used by both VSCode extension and local server
 */
export class ExtensionController extends EventEmitter {
  private clineAdapter: ClineAdapter;
  private rooCodeAdapter: RooCodeAdapter;
  private isInitialized = false;

  constructor() {
    super();
    this.clineAdapter = new ClineAdapter();
    this.rooCodeAdapter = new RooCodeAdapter();
  }

  /**
   * Initialize the controller by discovering and activating extensions
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info("Controller already initialized");
      return;
    }

    try {
      await this.discoverExtensions();
      await this.activateExtensions();

      this.isInitialized = true;
      logger.info("Extension controller initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize controller:", error);
      throw error;
    }
  }

  /**
   * Discover installed extensions
   */
  private async discoverExtensions(): Promise<void> {
    // Initialize Cline adapter (which handles Cline discovery internally)
    try {
      await this.clineAdapter.initialize();
    } catch (error) {
      logger.warn("Cline extension not available:", error);
    }

    // Initialize RooCode adapter (which handles RooCode discovery internally)
    try {
      await this.rooCodeAdapter.initialize();
    } catch (error) {
      logger.warn("RooCode extension not available:", error);
    }

    if (
      !this.clineAdapter.isInstalled() &&
      !this.rooCodeAdapter.isInstalled()
    ) {
      throw new Error(
        "No compatible extensions found. Please install Cline or RooCode extension.",
      );
    }
  }

  /**
   * Activate discovered extensions automatically
   */
  private async activateExtensions(): Promise<void> {
    // Both Cline and RooCode are already initialized in discoverExtensions
    // No additional activation needed as adapters handle this internally
  }

  /**
   * Get status of both extensions
   */
  getExtensionStatus(): { cline: ExtensionStatus; rooCode: ExtensionStatus } {
    return {
      cline: {
        isInstalled: this.clineAdapter.isInstalled(),
        isActive: this.clineAdapter.isActive(),
        version: this.clineAdapter.getVersion(),
        api: this.clineAdapter.getApi(),
      },
      rooCode: {
        isInstalled: this.rooCodeAdapter.isInstalled(),
        isActive: this.rooCodeAdapter.isActive(),
        version: this.rooCodeAdapter.getVersion(),
        api: this.rooCodeAdapter.getApi(),
      },
    };
  }

  /**
   * Get API for specified extension type
   */
  private getApi(extensionType: ExtensionType): any {
    if (extensionType === ExtensionType.CLINE) {
      const api = this.clineAdapter.getApi();
      if (!api) {
        throw new Error("Cline API not available");
      }
      return api;
    } else {
      const api = this.rooCodeAdapter.getApi();
      if (!api) {
        throw new Error("RooCode API not available");
      }
      return api;
    }
  }

  /**
   * Unified API: Start a new task
   * @param options Task options
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async startNewTask(
    options: UnifiedTaskOptions = {},
    extensionType = ExtensionType.CLINE,
  ): Promise<string | void> {
    logger.info(`Starting new task with ${extensionType}`);

    if (extensionType === ExtensionType.CLINE) {
      await this.clineAdapter.startNewTask({
        task: options.task,
        images: options.images,
      });
      return v4(); // Cline doesn't return task ID
    } else {
      return await this.rooCodeAdapter.startNewTask({
        configuration: options.configuration,
        text: options.task,
        images: options.images,
        newTab: options.newTab,
      });
    }
  }

  /**
   * Unified API: Send message to current task
   * @param message Message to send
   * @param images Optional images
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async sendMessage(
    message?: string,
    images?: string[],
    extensionType = ExtensionType.CLINE,
  ): Promise<void> {
    logger.info(`Sending message with ${extensionType}`);

    if (extensionType === ExtensionType.CLINE) {
      await this.clineAdapter.sendMessage(message, images);
    } else {
      await this.rooCodeAdapter.sendMessage(message, images);
    }
  }

  /**
   * Unified API: Press primary button
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async pressPrimaryButton(extensionType = ExtensionType.CLINE): Promise<void> {
    logger.info(`Pressing primary button with ${extensionType}`);

    if (extensionType === ExtensionType.CLINE) {
      await this.clineAdapter.pressPrimaryButton();
    } else {
      await this.rooCodeAdapter.pressPrimaryButton();
    }
  }

  /**
   * Unified API: Press secondary button
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async pressSecondaryButton(
    extensionType = ExtensionType.CLINE,
  ): Promise<void> {
    logger.info(`Pressing secondary button with ${extensionType}`);

    if (extensionType === ExtensionType.CLINE) {
      await this.clineAdapter.pressSecondaryButton();
    } else {
      await this.rooCodeAdapter.pressSecondaryButton();
    }
  }

  /**
   * Cline-specific: Get/Set custom instructions
   */
  async getCustomInstructions(): Promise<string | undefined> {
    return await this.clineAdapter.getCustomInstructions();
  }

  async setCustomInstructions(value: string): Promise<void> {
    await this.clineAdapter.setCustomInstructions(value);
  }

  /**
   * Universal method to call any function on any extension API
   * @param extensionType - The extension to call the function on
   * @param functionName - The name of the API function to call
   * @param payload - The arguments to pass to the function
   * @returns The result of the function call
   */
  async callExtensionFunction(
    extensionType: ExtensionType,
    functionName: string,
    payload?: any,
  ): Promise<any> {
    logger.info(`Calling ${extensionType} function: ${functionName}`);

    if (extensionType === ExtensionType.CLINE) {
      return await this.clineAdapter.callFunction(functionName, payload);
    } else {
      return await this.rooCodeAdapter.callFunction(functionName, payload);
    }
  }

  /**
   * Check if controller is ready
   */
  isReady(): boolean {
    return (
      this.isInitialized &&
      (this.clineAdapter.isReady() || this.rooCodeAdapter.isReady())
    );
  }

  /**
   * Check if specific extension is available
   */
  isExtensionAvailable(extensionType: ExtensionType): boolean {
    return extensionType === ExtensionType.CLINE
      ? this.clineAdapter.isReady()
      : this.rooCodeAdapter.isReady();
  }

  /**
   * Get available functions for any extension
   * @param extensionType The extension to get functions for
   */
  getExtensionFunctions(extensionType: ExtensionType): string[] {
    if (extensionType === ExtensionType.CLINE) {
      return this.clineAdapter.getAvailableFunctions();
    } else {
      return this.rooCodeAdapter.getAvailableFunctions();
    }
  }

  /**
   * Get available RooCode functions (for backward compatibility)
   */
  getRooCodeFunctions(): string[] {
    return this.getExtensionFunctions(ExtensionType.ROO_CODE);
  }

  /**
   * Get available Cline functions (for backward compatibility)
   */
  getClineFunctions(): string[] {
    return this.getExtensionFunctions(ExtensionType.CLINE);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.removeAllListeners();
    this.isInitialized = false;

    await this.clineAdapter.dispose();
    await this.rooCodeAdapter.dispose();
  }
}
