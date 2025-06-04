// import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import { logger } from "../utils/logger";
import { waitFor } from "../utils/waitFor";
import {
  RooCodeAPI,
  RooCodeSettings,
  ProviderSettings,
  ProviderSettingsEntry,
  IpcMessageType,
  RooCodeEventName,
} from "@roo-code/types";
import { ExtensionBaseAdapter } from "./ExtensionBaseAdapter";
import { IpcClient } from "../vendor/roo-code/ipc-client";

const socketPath = path.join(
  os.tmpdir(),
  `roo-code-evals-${crypto.randomUUID().slice(0, 8)}.sock`,
);

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
  private ipcClient: IpcClient | undefined;

  constructor() {
    super();
    process.env.ROO_CODE_IPC_SOCKET_PATH = socketPath;
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
    logger.info("Connecting to Roo Code IPC Server from socket:", socketPath);
    this.ipcClient = new IpcClient(socketPath);

    try {
      await waitFor(() => this.ipcClient!.isReady, {
        interval: 250,
        timeout: 5_000,
      });
    } catch (error) {
      logger.error(`IPC client unable to connect`);
      this.ipcClient.disconnect();
      return;
    }

    logger.info("Roo Code IPC client connected");
    this.registerIpcListeners();
  }

  /**
   * Activate extension with force activation
   */
  protected async activateExtension(): Promise<void> {
    await super.activateExtension(true);
  }

  private registerIpcListeners(): void {
    if (!this.ipcClient) {
      return;
    }

    this.ipcClient.on(IpcMessageType.TaskEvent, (evt) => {
      const { eventName, payload } = evt;
      if (eventName === RooCodeEventName.Message) {
        logger.info(JSON.stringify(payload, null, 2));
      }
    });

    this.ipcClient.on(IpcMessageType.Disconnect, () => {
      logger.info("Roo Code IPC client disconnect");
    });
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
}
