// import * as vscode from "vscode";
import { logger } from "../utils/logger";
import {
  RooCodeAPI,
  RooCodeSettings,
  ProviderSettings,
  ProviderSettingsEntry,
  RooCodeEventName,
} from "@roo-code/types";
import { ExtensionBaseAdapter } from "./ExtensionBaseAdapter";

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
   * Perform any post-activation setup
   */
  protected async postActivation(): Promise<void> {
    this.registerEventListeners();
  }

  /**
   * Activate extension with force activation
   */
  protected async activateExtension(): Promise<void> {
    await super.activateExtension(true);
  }

  /**
   * Register event listeners using this.api.on()
   */
  private registerEventListeners(): void {
    if (!this.api) {
      logger.error("RooCode API not available for event listeners");
      return;
    }

    // Listen for message events
    this.api.on(RooCodeEventName.Message, (data) => {
      logger.info("RooCode Message Event:", JSON.stringify(data, null, 2));
    });

    // Listen for task created events
    this.api.on(RooCodeEventName.TaskCreated, (taskId) => {
      logger.info(`RooCode Task Created: ${taskId}`);
    });

    // Listen for task started events
    this.api.on(RooCodeEventName.TaskStarted, (taskId) => {
      logger.info(`RooCode Task Started: ${taskId}`);
    });

    // Listen for task completed events
    this.api.on(
      RooCodeEventName.TaskCompleted,
      (taskId, tokenUsage, toolUsage) => {
        logger.info(`RooCode Task Completed: ${taskId}`, {
          tokenUsage,
          toolUsage,
        });
      },
    );

    // Listen for task aborted events
    this.api.on(RooCodeEventName.TaskAborted, (taskId) => {
      logger.info(`RooCode Task Aborted: ${taskId}`);
    });

    // Listen for task paused events
    this.api.on(RooCodeEventName.TaskPaused, (taskId) => {
      logger.info(`RooCode Task Paused: ${taskId}`);
    });

    // Listen for task unpaused events
    this.api.on(RooCodeEventName.TaskUnpaused, (taskId) => {
      logger.info(`RooCode Task Unpaused: ${taskId}`);
    });

    // Listen for task mode switched events
    this.api.on(RooCodeEventName.TaskModeSwitched, (taskId, mode) => {
      logger.info(`RooCode Task Mode Switched: ${taskId} -> ${mode}`);
    });

    // Listen for task spawned events
    this.api.on(RooCodeEventName.TaskSpawned, (parentTaskId, childTaskId) => {
      logger.info(`RooCode Task Spawned: ${parentTaskId} -> ${childTaskId}`);
    });

    // Listen for task ask responded events
    this.api.on(RooCodeEventName.TaskAskResponded, (taskId) => {
      logger.info(`RooCode Task Ask Responded: ${taskId}`);
    });

    // Listen for task token usage updated events
    this.api.on(
      RooCodeEventName.TaskTokenUsageUpdated,
      (taskId, tokenUsage) => {
        logger.info(`RooCode Task Token Usage Updated: ${taskId}`, tokenUsage);
      },
    );

    // Listen for task tool failed events
    this.api.on(RooCodeEventName.TaskToolFailed, (taskId, tool, error) => {
      logger.error(`RooCode Task Tool Failed: ${taskId} - ${tool}`, error);
    });

    logger.info("RooCode event listeners registered successfully");
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
   * Send message to current task
   */
  async sendMessage(message?: string, images?: string[]): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Sending message to RooCode current task");
    await this.api.sendMessage(message, images);
  }

  /**
   * Press primary button in chat interface
   */
  async pressPrimaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Pressing RooCode primary button");
    await this.api.pressPrimaryButton();
  }

  /**
   * Press secondary button in chat interface
   */
  async pressSecondaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info("Pressing RooCode secondary button");
    await this.api.pressSecondaryButton();
  }

  /**
   * Check if API is ready to use
   */
  isReady(): boolean {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.isReady();
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
   * Get profile entry by name
   */
  getProfileEntry(name: string): ProviderSettingsEntry | undefined {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    return this.api.getProfileEntry(name);
  }

  /**
   * Create a new API configuration profile
   */
  async createProfile(
    name: string,
    profile?: ProviderSettings,
    activate?: boolean,
  ): Promise<string> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Creating RooCode profile: ${name}`);
    return await this.api.createProfile(name, profile, activate);
  }

  /**
   * Update an existing API configuration profile
   */
  async updateProfile(
    name: string,
    profile: ProviderSettings,
    activate?: boolean,
  ): Promise<string | undefined> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Updating RooCode profile: ${name}`);
    return await this.api.updateProfile(name, profile, activate);
  }

  /**
   * Create or update an API configuration profile
   */
  async upsertProfile(
    name: string,
    profile: ProviderSettings,
    activate?: boolean,
  ): Promise<string | undefined> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Upserting RooCode profile: ${name}`);
    return await this.api.upsertProfile(name, profile, activate);
  }

  /**
   * Delete a profile by name
   */
  async deleteProfile(name: string): Promise<void> {
    if (!this.api) {
      throw new Error("RooCode API not available");
    }

    logger.info(`Deleting RooCode profile: ${name}`);
    await this.api.deleteProfile(name);
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

  /**
   * Cleanup resources and remove event listeners
   */
  async dispose(): Promise<void> {
    if (this.api) {
      // Remove all event listeners
      this.api.removeAllListeners();
    }

    await super.dispose();
  }
}
