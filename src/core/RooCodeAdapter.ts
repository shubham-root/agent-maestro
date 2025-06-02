import * as vscode from "vscode";
import { logger } from "../utils/logger";
import { RooCodeAPI, RooCodeSettings } from "@roo-code/types";
import { ExtensionBaseAdapter } from "./ExtensionBaseAdapter";

// [TODO] Will start Roo Code IPC work after Cline adapter finished
export interface RooCodeTaskOptions {
  configuration?: RooCodeSettings;
  text?: string;
  images?: string[];
  newTab?: boolean;
}

/**
 * Dedicated adapter for RooCode extension management
 * Handles RooCode-specific logic and API interactions
 */
export class RooCodeAdapter extends ExtensionBaseAdapter<RooCodeAPI> {
  constructor() {
    super();
  }

  /**
   * Get the extension ID to discover
   */
  protected getExtensionId(): string {
    return "rooveterinaryinc.roo-cline";
  }

  /**
   * Get the display name for logging
   */
  protected getDisplayName(): string {
    return "RooCodeAdapter";
  }

  /**
   * Start a new task
   */
  async startNewTask(options: RooCodeTaskOptions = {}): Promise<string> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Starting new RooCode task");
    return await this.api.startNewTask(options);
  }

  /**
   * Resume a task
   */
  async resumeTask(taskId: string): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Resuming RooCode task: ${taskId}`);
    await this.api.resumeTask(taskId);
  }

  /**
   * Check if task is in history
   */
  async isTaskInHistory(taskId: string): Promise<boolean> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return await this.api.isTaskInHistory(taskId);
  }

  /**
   * Get current task stack
   */
  getCurrentTaskStack(): string[] {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.getCurrentTaskStack();
  }

  /**
   * Clear current task
   */
  async clearCurrentTask(lastMessage?: string): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Clearing RooCode current task");
    await this.api.clearCurrentTask(lastMessage);
  }

  /**
   * Cancel current task
   */
  async cancelCurrentTask(): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Canceling RooCode current task");
    await this.api.cancelCurrentTask();
  }

  /**
   * Get configuration
   */
  getConfiguration(): RooCodeSettings {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.getConfiguration();
  }

  /**
   * Set configuration
   */
  async setConfiguration(values: RooCodeSettings): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    await this.api.setConfiguration(values);
  }

  /**
   * Get profiles
   */
  getProfiles(): string[] {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.getProfiles();
  }

  /**
   * Get active profile
   */
  getActiveProfile(): string | undefined {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.getActiveProfile();
  }

  /**
   * Set active profile
   */
  async setActiveProfile(name: string): Promise<string | undefined> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Setting RooCode active profile: ${name}`);
    return await this.api.setActiveProfile(name);
  }
}
