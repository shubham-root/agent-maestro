// import * as vscode from "vscode";
import { EventEmitter } from "events";
import { RooCodeSettings } from "@roo-code/types";
import { v4 } from "uuid";
import { logger } from "../utils/logger";
import { ClineAdapter } from "./ClineAdapter";
import { RooCodeAdapter } from "./RooCodeAdapter";
import { ExtensionBaseAdapter } from "./ExtensionBaseAdapter";

export interface ExtensionStatus {
  isInstalled: boolean;
  isActive: boolean;
  version?: string;
}

export interface UnifiedTaskOptions {
  task: string;
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
  public readonly clineAdapter: ClineAdapter;
  public readonly rooCodeAdapter: RooCodeAdapter;
  private adapters: Record<ExtensionType, ExtensionBaseAdapter>;
  public isInitialized = false;

  constructor() {
    super();
    this.clineAdapter = new ClineAdapter();
    this.rooCodeAdapter = new RooCodeAdapter();
    this.adapters = {
      [ExtensionType.CLINE]: this.clineAdapter,
      [ExtensionType.ROO_CODE]: this.rooCodeAdapter,
    };
  }

  /**
   * Initialize the controller by discovering and activating extensions
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info("Controller already initialized");
      return;
    }

    for (const a in this.adapters) {
      await this.adapters[a as ExtensionType].initialize();
    }

    if (Object.values(this.adapters).every((adapter) => !adapter.isActive)) {
      throw new Error(
        "No active extension found. This may be due to missing installations or activation issues.",
      );
    }

    this.isInitialized = true;
    logger.info("Extension controller initialized successfully");
  }

  /**
   * Get status of both extensions
   */
  getExtensionStatus(): Record<ExtensionType, ExtensionStatus> {
    const status: Record<ExtensionType, ExtensionStatus> = {} as Record<
      ExtensionType,
      ExtensionStatus
    >;
    for (const t in this.adapters) {
      const type = t as ExtensionType;
      const adapter = this.adapters[type];
      status[type] = {
        isInstalled: adapter.isActive,
        isActive: adapter.isActive,
        version: adapter.getVersion ? adapter.getVersion() : undefined,
      };
    }
    return status;
  }

  /**
   * Unified API: Start a new task
   * @param options Task options
   * @param extensionType Which extension to use (defaults to "roo-code")
   */
  async startNewTask(
    options: UnifiedTaskOptions,
    extensionType = ExtensionType.ROO_CODE,
  ): Promise<string | void> {
    logger.info(`Starting new task with ${extensionType}`);

    switch (extensionType) {
      case ExtensionType.CLINE:
        return this.clineAdapter.startNewTaskInTestMode(options.task);
      case ExtensionType.ROO_CODE:
        return await this.rooCodeAdapter.startNewTask({
          configuration: options.configuration,
          text: options.task,
          images: options.images,
          // newTab: options.newTab ?? true,
          newTab: options.newTab,
        });
      default:
    }
  }

  /**
   * Unified API: Send message to current task
   * @param message Message to send
   * @param images Optional images
   * @param extensionType Which extension to use (defaults to "roo-code")
   */
  async sendMessage(
    message?: string,
    images?: string[],
    extensionType = ExtensionType.ROO_CODE,
  ): Promise<void> {
    logger.info(`Sending message with ${extensionType}`);
    await this.adapters[extensionType].sendMessage(message, images);
  }

  /**
   * Unified API: Press primary button
   * @param extensionType Which extension to use (defaults to "roo-code")
   */
  async pressPrimaryButton(
    extensionType = ExtensionType.ROO_CODE,
  ): Promise<void> {
    logger.info(`Pressing primary button with ${extensionType}`);
    await this.adapters[extensionType].pressPrimaryButton();
  }

  /**
   * Unified API: Press secondary button
   * @param extensionType Which extension to use (defaults to "roo-code")
   */
  async pressSecondaryButton(
    extensionType = ExtensionType.ROO_CODE,
  ): Promise<void> {
    logger.info(`Pressing secondary button with ${extensionType}`);
    await this.adapters[extensionType].pressSecondaryButton();
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
   * Check if specific extension is available
   */
  isExtensionAvailable(extensionType: ExtensionType): boolean {
    return this.adapters[extensionType].isActive;
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
