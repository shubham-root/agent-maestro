import Fastify, { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import cors from "@fastify/cors";
import { logger } from "../utils/logger";
import { ExtensionController, ExtensionType } from "../core/controller";
import { registerRooRoutes } from "./routes/rooRoutes";

export interface TaskRequest {
  text: string;
  images?: string[];
  taskId?: string;
}

export class ProxyServer {
  private fastify: FastifyInstance;
  private controller: ExtensionController;
  private isRunning = false;
  private port: number;

  constructor(controller: ExtensionController, port = 23333) {
    this.controller = controller;
    this.port = port;
    this.fastify = Fastify({
      logger: false, // Use our custom logger instead
    });

    this.setupCors();
    this.setupSwagger();
    this.setupRoutes();
  }

  private async setupCors(): Promise<void> {
    await this.fastify.register(cors, {
      origin: true, // Allow all origins, you can restrict this to specific domains if needed
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
      credentials: true,
    });
  }

  private async setupSwagger(): Promise<void> {
    await this.fastify.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "Cline Maestro API",
          description: "API for managing extension tasks",
          version: "0.0.1",
        },
        servers: [
          {
            url: `http://127.0.0.1:${this.port}/api/v1`,
            description: "Development server",
          },
        ],
        tags: [
          {
            name: "Tasks",
            description: "Task management operations",
          },
          {
            name: "Documentation",
            description: "API documentation",
          },
        ],
        components: {},
      },
      refResolver: {
        buildLocalReference: (json, _baseUri, _fragment, i) =>
          String(json.$id) || `id-${i}`,
      },
      prefix: "/api/v1",
    });
    this.fastify.addSchema({
      $id: "TaskRequest",
      type: "object",
      required: ["text"],
      properties: {
        text: {
          type: "string",
          description: "The task query to execute",
        },
        images: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of base64-encoded images",
        },
        taskId: {
          type: "string",
          description:
            "Optional task ID. If provided, sends message to existing task. If not provided, creates a new task.",
        },
      },
    });
    this.fastify.addSchema({
      $id: "TaskResponse",
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Unique task identifier",
        },
        status: {
          type: "string",
          enum: ["created", "running", "completed", "failed"],
          description: "Current task status",
        },
        message: {
          type: "string",
          description: "Status message",
        },
      },
    });
    this.fastify.addSchema({
      $id: "ErrorResponse",
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
    });
  }

  private setupRoutes(): void {
    // Register API routes with prefix
    this.fastify.register(
      async (fastify) => {
        // POST /api/v1/cline/task - Create new Cline task
        fastify.post(
          "/cline/task",
          {
            schema: {
              tags: ["Tasks"],
              summary: "Create a new Cline task",
              description:
                "Creates and starts a new task using the Cline extension",
              body: { $ref: "TaskRequest#" },
              response: {
                200: {
                  description: "Task created successfully",
                  $ref: "TaskResponse#",
                },
                400: {
                  description: "Bad request - invalid input",
                  $ref: "ErrorResponse#",
                },
                500: {
                  description: "Internal server error",
                  $ref: "ErrorResponse#",
                },
              },
            },
          },
          async (request, reply) => {
            try {
              const { text, images } = request.body as TaskRequest;

              if (!text || text.trim() === "") {
                return reply.status(400).send({
                  status: "failed",
                  message: "Task description is required",
                });
              }

              if (!this.controller.isExtensionAvailable(ExtensionType.CLINE)) {
                return reply.status(500).send({
                  status: "failed",
                  message: "Cline extension is not available",
                });
              }

              await this.controller.startNewTask(
                { text, images },
                ExtensionType.CLINE,
              );

              const response = {
                id: "",
                status: "completed",
                message: "Currently Cline does not support returning message",
              };

              logger.info(`Created new Cline task: ${response.id}`);
              return reply.send(response);
            } catch (error) {
              logger.error("Error creating Cline task:", error);
              return reply.status(500).send({
                status: "failed",
                message:
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
              });
            }
          },
        );

        // Register RooCode routes
        await registerRooRoutes(fastify, this.controller);

        // GET /api/v1/openapi.json - OpenAPI specification
        fastify.get(
          "/openapi.json",
          {
            schema: {
              tags: ["Documentation"],
              summary: "Get OpenAPI specification",
              description:
                "Returns the complete OpenAPI v3 specification for this API",
              response: {
                200: {
                  description: "OpenAPI specification",
                  type: "object",
                },
              },
            },
          },
          async (request, reply) => {
            const swaggerDoc = fastify.swagger();
            return reply
              .header("Content-Type", "application/json")
              .send(JSON.stringify(swaggerDoc, null, 2));
          },
        );
      },
      { prefix: "/api/v1" },
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Server is already running");
      return;
    }

    try {
      await this.fastify.listen({
        port: this.port,
        host: "127.0.0.1",
      });
      this.isRunning = true;
      logger.info(`Server started on http://127.0.0.1:${this.port}`);
      logger.info(
        `OpenAPI documentation available at http://127.0.0.1:${this.port}/api/v1/openapi.json`,
      );
    } catch (error) {
      logger.error("Failed to start server:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn("Server is not running");
      return;
    }

    try {
      await this.fastify.close();
      this.isRunning = false;
      logger.info("Server stopped");
    } catch (error) {
      logger.error("Failed to stop server:", error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    logger.info("Restarting server...");
    await this.stop();
    await this.start();
  }

  getStatus(): { isRunning: boolean; port: number; url: string } {
    return {
      isRunning: this.isRunning,
      port: this.port,
      url: `http://localhost:${this.port}`,
    };
  }

  getOpenAPIUrl(): string {
    return `http://localhost:${this.port}/api/v1/openapi.json`;
  }
}
