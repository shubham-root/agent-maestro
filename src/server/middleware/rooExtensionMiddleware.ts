import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { logger } from "../../utils/logger";
import { RooCodeExtensionManager } from "../../utils/rooCodeExtensionManager";

/**
 * Middleware to ensure Roo Code extension is active before processing /roo routes
 */
export const ensureRooCodeExtensionActive = createMiddleware(
  async (c, next) => {
    try {
      logger.debug(
        "Checking Roo Code extension status before processing request...",
      );

      // Check and activate Roo Code extension if needed
      const status =
        await RooCodeExtensionManager.ensureRooCodeExtensionActive();

      if (!status.isActive) {
        logger.error(`Roo Code extension check failed: ${status.error}`);

        // Return appropriate error response
        if (!status.isInstalled) {
          throw new HTTPException(500, {
            message: `Roo Code extension is not installed. Please install the extension (${RooCodeExtensionManager.getExtensionId()}) from the VS Code marketplace.`,
          });
        } else {
          throw new HTTPException(500, {
            message: `Roo Code extension failed to activate: ${String(status.error)}`,
          });
        }
      }

      logger.debug(
        `Roo Code extension is active (v${status.version}), proceeding with request`,
      );

      // Extension is active, proceed to the next middleware/handler
      await next();
    } catch (error) {
      // If it's already an HTTPException, re-throw it
      if (error instanceof HTTPException) {
        throw error;
      }

      // For any other error, wrap it in an HTTPException
      logger.error("Unexpected error in Roo Code extension middleware:", error);
      throw new HTTPException(500, {
        message: `Internal error while checking Roo Code extension: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
);

/**
 * Lightweight middleware to check extension status without activation
 * Useful for read-only operations that don't require activation
 */
export const checkRooCodeExtensionStatus = createMiddleware(async (c, next) => {
  try {
    const status = RooCodeExtensionManager.getRooCodeExtensionStatus();

    if (!status.isInstalled) {
      throw new HTTPException(500, {
        message: `Roo Code extension is not installed. Please install the extension (${RooCodeExtensionManager.getExtensionId()}) from the VS Code marketplace.`,
      });
    }

    if (!status.isActive) {
      throw new HTTPException(500, {
        message: `Roo Code extension is not active. Please activate the extension first.`,
      });
    }

    // Extension is active, proceed
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    logger.error("Error in Roo Code extension status check:", error);
    throw new HTTPException(500, {
      message: `Error checking Roo Code extension status: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});
