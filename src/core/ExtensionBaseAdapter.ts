import * as vscode from "vscode";
import { logger } from "../utils/logger";

/**
 * Extension base adapter class providing common functionality for extension adapters
 * Handles extension discovery, activation, and common API operations
 */
export abstract class ExtensionBaseAdapter<TApi = any> {
  protected extension: vscode.Extension<any> | undefined;
  protected api: TApi | undefined;
  protected isInitialized = false;

  constructor() {}

  /**
   * Get the extension ID to discover
   */
  protected abstract getExtensionId(): string;

  /**
   * Get the display name for logging
   */
  protected abstract getDisplayName(): string;

  /**
   * Perform any pre-activation setup
   */
  protected async preActivation(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override for specific setup
  }

  /**
   * Perform any post-activation setup
   */
  protected async postActivation(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override for specific setup
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info(`${this.getDisplayName()} already initialized`);
      return;
    }

    try {
      await this.discoverExtension();
      await this.activateExtension();

      this.isInitialized = true;
      logger.info(`${this.getDisplayName()} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize ${this.getDisplayName()}:`, error);
      throw error;
    }
  }

  /**
   * Discover extension
   */
  protected async discoverExtension(): Promise<void> {
    this.extension = vscode.extensions.getExtension(this.getExtensionId());

    if (this.extension) {
      logger.info(
        `Found ${this.getDisplayName()} v${this.extension.packageJSON.version}`,
      );
    } else {
      throw new Error(
        `${this.getDisplayName()} not found. Please install ${this.getDisplayName()}.`,
      );
    }
  }

  /**
   * Activate extension
   */
  protected async activateExtension(): Promise<void> {
    if (!this.extension) {
      throw new Error(`${this.getDisplayName()} not discovered`);
    }

    // Perform pre-activation setup
    await this.preActivation();

    if (!this.extension.isActive) {
      try {
        this.api = await this.extension.activate();
        logger.info(`${this.getDisplayName()} activated`);
      } catch (error) {
        logger.error(`Failed to activate ${this.getDisplayName()}:`, error);
        throw error;
      }
    } else {
      this.api = this.extension.exports;
      logger.info(`${this.getDisplayName()} already active`);
    }

    // Perform post-activation setup
    await this.postActivation();
  }

  /**
   * Send message to current task
   */
  async sendMessage(message?: string, images?: string[]): Promise<void> {
    if (!this.api) {
      throw new Error(`${this.getDisplayName()} API not available`);
    }

    logger.info(`Sending message to ${this.getDisplayName()}`);
    await (this.api as any).sendMessage(message, images);
  }

  /**
   * Press primary button
   */
  async pressPrimaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error(`${this.getDisplayName()} API not available`);
    }

    logger.info(`Pressing ${this.getDisplayName()} primary button`);
    await (this.api as any).pressPrimaryButton();
  }

  /**
   * Press secondary button
   */
  async pressSecondaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error(`${this.getDisplayName()} API not available`);
    }

    logger.info(`Pressing ${this.getDisplayName()} secondary button`);
    await (this.api as any).pressSecondaryButton();
  }

  /**
   * Call any function on the API
   */
  async callFunction(functionName: string, payload?: any): Promise<any> {
    if (!this.api) {
      throw new Error(`${this.getDisplayName()} API not available`);
    }

    const apiObj = this.api as any;

    if (typeof apiObj[functionName] !== "function") {
      throw new Error(
        `Function '${functionName}' not found in ${this.getDisplayName()} API`,
      );
    }

    logger.info(`Calling ${this.getDisplayName()} function: ${functionName}`);

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
      logger.error(
        `Error calling ${this.getDisplayName()} function '${functionName}':`,
        error,
      );
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
  getApi(): TApi | undefined {
    return this.api;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.api = undefined;
    this.isInitialized = false;
  }
}
