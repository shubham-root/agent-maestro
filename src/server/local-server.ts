import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  ExtensionController,
  UnifiedTaskOptions,
  ExtensionType,
} from "../core/controller";
import { logger } from "../utils/logger";

export interface ServerConfig {
  port?: number;
  host?: string;
  enableCors?: boolean;
}

export class LocalServer {
  private server: ReturnType<typeof createServer> | undefined;
  private controller: ExtensionController;
  private config: Required<ServerConfig>;

  constructor(controller: ExtensionController, config: ServerConfig = {}) {
    this.controller = controller;
    this.config = {
      port: config.port || 3000,
      host: config.host || "localhost",
      enableCors: true,
      ...config,
    };
  }

  /**
   * Start the local server
   */
  async start(): Promise<void> {
    if (this.server) {
      throw new Error("Server is already running");
    }

    // Ensure controller is initialized
    if (!this.controller.isReady()) {
      await this.controller.initialize();
    }

    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        logger.info(
          `Local server started on http://${this.config.host}:${this.config.port}`,
        );
        resolve();
      });

      this.server!.on("error", (error) => {
        logger.error("Server error:", error);
        reject(error);
      });
    });
  }

  /**
   * Stop the local server
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        logger.info("Local server stopped");
        this.server = undefined;
        resolve();
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    // Enable CORS if configured
    if (this.config.enableCors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const path = url.pathname;

      switch (path) {
        case "/status":
          await this.handleStatus(req, res);
          break;
        case "/start-task":
          await this.handleStartTask(req, res);
          break;
        case "/send-message":
          await this.handleSendMessage(req, res);
          break;
        case "/press-primary":
          await this.handlePressPrimary(req, res);
          break;
        case "/press-secondary":
          await this.handlePressSecondary(req, res);
          break;
        case "/custom-instructions":
          await this.handleCustomInstructions(req, res);
          break;
        case "/call-function":
          await this.handleCallFunction(req, res);
          break;
        case "/functions":
          await this.handleGetFunctions(req, res);
          break;
        default:
          this.sendResponse(res, 404, { error: "Not found" });
      }
    } catch (error) {
      logger.error("Request handling error:", error);
      this.sendResponse(res, 500, { error: "Internal server error" });
    }
  }

  /**
   * Handle status endpoint
   */
  private async handleStatus(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const status = {
      ready: this.controller.isReady(),
      extensions: this.controller.getExtensionStatus(),
    };
    this.sendResponse(res, 200, status);
  }

  /**
   * Handle start task endpoint
   */
  private async handleStartTask(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "POST") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await this.parseBody(req);
    const { options = {}, extensionType = "cline" } = body as {
      options?: UnifiedTaskOptions;
      extensionType?: ExtensionType;
    };

    try {
      const taskId = await this.controller.startNewTask(options, extensionType);
      this.sendResponse(res, 200, { success: true, taskId });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Handle send message endpoint
   */
  private async handleSendMessage(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "POST") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await this.parseBody(req);
    const {
      message,
      images,
      extensionType = "cline",
    } = body as {
      message?: string;
      images?: string[];
      extensionType?: ExtensionType;
    };

    try {
      await this.controller.sendMessage(message, images, extensionType);
      this.sendResponse(res, 200, { success: true });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Handle press primary button endpoint
   */
  private async handlePressPrimary(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "POST") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await this.parseBody(req);
    const { extensionType = "cline" } = body as {
      extensionType?: ExtensionType;
    };

    try {
      await this.controller.pressPrimaryButton(extensionType);
      this.sendResponse(res, 200, { success: true });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Handle press secondary button endpoint
   */
  private async handlePressSecondary(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "POST") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await this.parseBody(req);
    const { extensionType = "cline" } = body as {
      extensionType?: ExtensionType;
    };

    try {
      await this.controller.pressSecondaryButton(extensionType);
      this.sendResponse(res, 200, { success: true });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Handle custom instructions endpoint
   */
  private async handleCustomInstructions(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method === "GET") {
      try {
        const instructions = await this.controller.getCustomInstructions();
        this.sendResponse(res, 200, { instructions });
      } catch (error) {
        this.sendResponse(res, 400, { error: (error as Error).message });
      }
    } else if (req.method === "POST") {
      const body = await this.parseBody(req);
      const { instructions } = body as { instructions: string };

      try {
        await this.controller.setCustomInstructions(instructions);
        this.sendResponse(res, 200, { success: true });
      } catch (error) {
        this.sendResponse(res, 400, { error: (error as Error).message });
      }
    } else {
      this.sendResponse(res, 405, { error: "Method not allowed" });
    }
  }

  /**
   * Handle call function endpoint
   */
  private async handleCallFunction(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "POST") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await this.parseBody(req);
    const { extensionType, functionName, payload } = body as {
      extensionType: ExtensionType;
      functionName: string;
      payload?: any;
    };

    try {
      const result = await this.controller.callExtensionFunction(
        extensionType,
        functionName,
        payload,
      );
      this.sendResponse(res, 200, { success: true, result });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Handle get functions endpoint
   */
  private async handleGetFunctions(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== "GET") {
      this.sendResponse(res, 405, { error: "Method not allowed" });
      return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const extensionType = url.searchParams.get("extension") as ExtensionType;

    if (!extensionType || !["cline", "roocode"].includes(extensionType)) {
      this.sendResponse(res, 400, {
        error: "Invalid or missing extension parameter",
      });
      return;
    }

    try {
      const functions = this.controller.getExtensionFunctions(extensionType);
      this.sendResponse(res, 200, { functions });
    } catch (error) {
      this.sendResponse(res, 400, { error: (error as Error).message });
    }
  }

  /**
   * Parse request body
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error("Invalid JSON"));
        }
      });
    });
  }

  /**
   * Send response
   */
  private sendResponse(
    res: ServerResponse,
    statusCode: number,
    data: any,
  ): void {
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify(data));
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return !!this.server;
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }
}
