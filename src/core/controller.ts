import * as vscode from "vscode";
import { EventEmitter } from "events";
import { v4 } from "uuid";
import { logger } from "../utils/logger";
import { ClineAPI } from "../types/cline";
import { RooCodeAPI, RooCodeSettings } from "../types/kilocode";

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

export type ExtensionType = "cline" | "roocode";

/**
 * Core controller to manage Cline and RooCode extensions
 * Provides unified API access and can be used by both VSCode extension and local server
 */
export class ExtensionController extends EventEmitter {
  private clineExtension: vscode.Extension<any> | undefined;
  private rooCodeExtension: vscode.Extension<any> | undefined;
  private clineApi: ClineAPI | undefined;
  private rooCodeApi: RooCodeAPI | undefined;
  private isInitialized = false;

  constructor() {
    super();
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
      this.emit("initialized");
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
    // Discover Cline extension
    this.clineExtension = vscode.extensions.getExtension(
      "saoudrizwan.claude-dev",
    );
    if (this.clineExtension) {
      logger.info(
        `Found Cline extension v${this.clineExtension.packageJSON.version}`,
      );
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

    if (!this.clineExtension && !this.rooCodeExtension) {
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

    if (this.clineExtension && !this.clineExtension.isActive) {
      const clineActivation = Promise.resolve(this.clineExtension.activate())
        .then((api) => {
          this.clineApi = api;
          logger.info("Cline extension activated");
          this.emit("clineActivated", api);
        })
        .catch((error: any) => {
          logger.error("Failed to activate Cline extension:", error);
        });
      activationPromises.push(clineActivation);
    } else if (this.clineExtension?.isActive) {
      this.clineApi = this.clineExtension.exports;
      logger.info("Cline extension already active");
    }

    if (this.rooCodeExtension && !this.rooCodeExtension.isActive) {
      const rooCodeActivation = Promise.resolve(
        this.rooCodeExtension.activate(),
      )
        .then((api) => {
          this.rooCodeApi = api;
          logger.info("RooCode extension activated");
          this.emit("rooCodeActivated", api);
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
        isInstalled: !!this.clineExtension,
        isActive: !!this.clineApi,
        version: this.clineExtension?.packageJSON.version,
        api: this.clineApi,
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
  private getApi(extensionType: ExtensionType): ClineAPI | RooCodeAPI {
    if (extensionType === "cline") {
      if (!this.clineApi) {
        throw new Error("Cline API not available");
      }
      return this.clineApi;
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
    extensionType: ExtensionType = "cline",
  ): Promise<string | void> {
    const api = this.getApi(extensionType);

    logger.info(`Starting new task with ${extensionType}`);

    if (extensionType === "cline") {
      await (api as ClineAPI).startNewTask(options.task, options.images);
      return v4(); // Cline doesn't return task ID
    } else {
      return await (api as RooCodeAPI).startNewTask({
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
    extensionType: ExtensionType = "cline",
  ): Promise<void> {
    const api = this.getApi(extensionType);

    logger.info(`Sending message with ${extensionType}`);
    await api.sendMessage(message, images);
  }

  /**
   * Unified API: Press primary button
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async pressPrimaryButton(
    extensionType: ExtensionType = "cline",
  ): Promise<void> {
    const api = this.getApi(extensionType);

    logger.info(`Pressing primary button with ${extensionType}`);
    await api.pressPrimaryButton();
  }

  /**
   * Unified API: Press secondary button
   * @param extensionType Which extension to use (defaults to "cline")
   */
  async pressSecondaryButton(
    extensionType: ExtensionType = "cline",
  ): Promise<void> {
    const api = this.getApi(extensionType);

    logger.info(`Pressing secondary button with ${extensionType}`);
    await api.pressSecondaryButton();
  }

  /**
   * Cline-specific: Get/Set custom instructions
   */
  async getCustomInstructions(): Promise<string | undefined> {
    if (!this.clineApi) {
      throw new Error("Cline API not available");
    }
    return await this.clineApi.getCustomInstructions();
  }

  async setCustomInstructions(value: string): Promise<void> {
    if (!this.clineApi) {
      throw new Error("Cline API not available");
    }
    await this.clineApi.setCustomInstructions(value);
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
    const api = this.getApi(extensionType) as any;

    if (typeof api[functionName] !== "function") {
      throw new Error(
        `Function '${functionName}' not found in ${extensionType} API`,
      );
    }

    logger.info(`Calling ${extensionType} function: ${functionName}`);

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

  /**
   * Check if controller is ready
   */
  isReady(): boolean {
    return this.isInitialized && (!!this.clineApi || !!this.rooCodeApi);
  }

  /**
   * Check if specific extension is available
   */
  isExtensionAvailable(extensionType: ExtensionType): boolean {
    return extensionType === "cline" ? !!this.clineApi : !!this.rooCodeApi;
  }

  /**
   * Get direct access to specific extension APIs
   */
  getClineApi(): ClineAPI | undefined {
    return this.clineApi;
  }

  getRooCodeApi(): RooCodeAPI | undefined {
    return this.rooCodeApi;
  }

  /**
   * Get available functions for any extension
   * @param extensionType The extension to get functions for
   */
  getExtensionFunctions(extensionType: ExtensionType): string[] {
    const api = extensionType === "cline" ? this.clineApi : this.rooCodeApi;

    if (!api) {
      return [];
    }

    const apiObj = api as any;
    return Object.getOwnPropertyNames(Object.getPrototypeOf(apiObj))
      .concat(Object.getOwnPropertyNames(apiObj))
      .filter(
        (name) => typeof apiObj[name] === "function" && name !== "constructor",
      )
      .sort();
  }

  /**
   * Get available RooCode functions (for backward compatibility)
   */
  getRooCodeFunctions(): string[] {
    return this.getExtensionFunctions("roocode");
  }

  /**
   * Get available Cline functions (for backward compatibility)
   */
  getClineFunctions(): string[] {
    return this.getExtensionFunctions("cline");
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.removeAllListeners();
    this.clineApi = undefined;
    this.rooCodeApi = undefined;
    this.isInitialized = false;
  }
}
