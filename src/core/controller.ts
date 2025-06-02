import * as vscode from "vscode";
import { EventEmitter } from "events";
import { RooCodeAPI, RooCodeSettings } from "@roo-code/types";
import { v4 } from "uuid";
import { logger } from "../utils/logger";
import { ClineAdapter, ClineTaskOptions } from "./cline-adapter";

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
  private rooCodeExtension: vscode.Extension<any> | undefined;
  private rooCodeApi: RooCodeAPI | undefined;
  private isInitialized = false;

  constructor() {
    super();
    this.clineAdapter = new ClineAdapter();
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

    // Discover RooCode extension
    this.rooCodeExtension = vscode.extensions.getExtension(
      "rooveterinaryinc.roo-cline",
    );
    if (this.rooCodeExtension) {
      logger.info(
        `Found RooCode extension v${this.rooCodeExtension.packageJSON.version}`,
      );
    }

    if (!this.clineAdapter.isInstalled() && !this.rooCodeExtension) {
      throw new Error(
        "No compatible extensions found. Please install Cline or RooCode extension.",
      );
    }
  }

  /**
   * Activate discovered extensions automatically
   */
  private async activateExtensions(): Promise<void> {
    const activationPromises: Promise<void>[] = [];

    // Cline is already initialized in discoverExtensions

    if (this.rooCodeExtension && !this.rooCodeExtension.isActive) {
      const rooCodeActivation = Promise.resolve(
        this.rooCodeExtension.activate(),
      )
        .then((api) => {
          this.rooCodeApi = api;
          logger.info("RooCode extension activated");
        })
        .catch((error: any) => {
          logger.error("Failed to activate RooCode extension:", error);
        });
      activationPromises.push(rooCodeActivation);
    } else if (this.rooCodeExtension?.isActive) {
      this.rooCodeApi = this.rooCodeExtension.exports;
      logger.info("RooCode extension already active");
    }

    await Promise.allSettled(activationPromises);
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
        isInstalled: !!this.rooCodeExtension,
        isActive: !!this.rooCodeApi,
        version: this.rooCodeExtension?.packageJSON.version,
        api: this.rooCodeApi,
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
      if (!this.rooCodeApi) {
        throw new Error("RooCode API not available");
      }
      return this.rooCodeApi;
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
      const api = this.getApi(extensionType) as RooCodeAPI;
      return await api.startNewTask({
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
      const api = this.getApi(extensionType);
      await api.sendMessage(message, images);
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
      const api = this.getApi(extensionType);
      await api.pressPrimaryButton();
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
      const api = this.getApi(extensionType);
      await api.pressSecondaryButton();
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
      const api = this.getApi(extensionType) as any;

      if (typeof api[functionName] !== "function") {
        throw new Error(
          `Function '${functionName}' not found in ${extensionType} API`,
        );
      }

      try {
        // Handle different function signatures
        if (payload === undefined) {
          return await api[functionName]();
        } else if (Array.isArray(payload)) {
          return await api[functionName](...payload);
        } else {
          return await api[functionName](payload);
        }
      } catch (error) {
        logger.error(
          `Error calling ${extensionType} function '${functionName}':`,
          error,
        );
        throw error;
      }
    }
  }

  /**
   * Check if controller is ready
   */
  isReady(): boolean {
    return (
      this.isInitialized && (this.clineAdapter.isReady() || !!this.rooCodeApi)
    );
  }

  /**
   * Check if specific extension is available
   */
  isExtensionAvailable(extensionType: ExtensionType): boolean {
    return extensionType === ExtensionType.CLINE
      ? this.clineAdapter.isReady()
      : !!this.rooCodeApi;
  }

  /**
   * Get available functions for any extension
   * @param extensionType The extension to get functions for
   */
  getExtensionFunctions(extensionType: ExtensionType): string[] {
    if (extensionType === ExtensionType.CLINE) {
      return this.clineAdapter.getAvailableFunctions();
    } else {
      const api = this.rooCodeApi;
      if (!api) {
        return [];
      }

      const apiObj = api as any;
      return Object.getOwnPropertyNames(Object.getPrototypeOf(apiObj))
        .concat(Object.getOwnPropertyNames(apiObj))
        .filter(
          (name) =>
            typeof apiObj[name] === "function" && name !== "constructor",
        )
        .sort();
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
    this.rooCodeApi = undefined;
    this.isInitialized = false;

    await this.clineAdapter.dispose();
  }
}
