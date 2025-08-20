import * as vscode from "vscode";
import { logger } from "./logger";

export interface RooCodeExtensionStatus {
  isInstalled: boolean;
  isActive: boolean;
  version?: string;
  error?: string;
}

/**
 * Utility class for managing Roo Code extension activation
 */
export class RooCodeExtensionManager {
  private static readonly EXTENSION_ID = "rooveterinaryinc.roo-cline";

  /**
   * Check if Roo Code extension is active, and activate it if not
   * @returns Promise<RooCodeExtensionStatus> - Status of the extension after check/activation
   */
  static async ensureRooCodeExtensionActive(): Promise<RooCodeExtensionStatus> {
    const status: RooCodeExtensionStatus = {
      isInstalled: false,
      isActive: false,
    };

    try {
      logger.info("Checking Roo Code extension status...");

      // Get the extension
      const extension = vscode.extensions.getExtension(this.EXTENSION_ID);

      if (!extension) {
        const errorMsg = `Roo Code extension (${this.EXTENSION_ID}) is not installed. Please install it from the VS Code marketplace.`;
        logger.error(errorMsg);
        status.error = errorMsg;
        return status;
      }

      status.isInstalled = true;
      status.version = extension.packageJSON.version;
      logger.info(`Found Roo Code extension v${status.version}`);

      // Check if already active
      if (extension.isActive) {
        logger.info("Roo Code extension is already active");
        status.isActive = true;
        return status;
      }

      // Activate the extension
      logger.info("Activating Roo Code extension...");
      await extension.activate();

      // Verify activation
      if (extension.isActive) {
        logger.info("Roo Code extension activated successfully");
        status.isActive = true;
      } else {
        const errorMsg =
          "Roo Code extension failed to activate (unknown reason)";
        logger.error(errorMsg);
        status.error = errorMsg;
      }
    } catch (error) {
      const errorMsg = `Failed to activate Roo Code extension: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg, error);
      status.error = errorMsg;
    }

    return status;
  }

  /**
   * Get current status of Roo Code extension without attempting activation
   * @returns RooCodeExtensionStatus - Current status of the extension
   */
  static getRooCodeExtensionStatus(): RooCodeExtensionStatus {
    const status: RooCodeExtensionStatus = {
      isInstalled: false,
      isActive: false,
    };

    try {
      const extension = vscode.extensions.getExtension(this.EXTENSION_ID);

      if (!extension) {
        status.error = `Roo Code extension (${this.EXTENSION_ID}) is not installed`;
        return status;
      }

      status.isInstalled = true;
      status.isActive = extension.isActive;
      status.version = extension.packageJSON.version;
    } catch (error) {
      status.error = `Error checking Roo Code extension status: ${error instanceof Error ? error.message : String(error)}`;
    }

    return status;
  }

  /**
   * Wait for extension to be fully activated with timeout
   * @param timeoutMs - Timeout in milliseconds (default: 10000)
   * @returns Promise<boolean> - True if extension is active within timeout
   */
  static async waitForExtensionActive(
    timeoutMs: number = 10000,
  ): Promise<boolean> {
    const extension = vscode.extensions.getExtension(this.EXTENSION_ID);

    if (!extension) {
      return false;
    }

    if (extension.isActive) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (extension.isActive) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime >= timeoutMs) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100); // Check every 100ms
    });
  }

  /**
   * Get the extension ID
   */
  static getExtensionId(): string {
    return this.EXTENSION_ID;
  }
}
