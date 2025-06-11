import Fastify, { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import cors from "@fastify/cors";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { ExtensionController, ExtensionType } from "../core/controller";

export interface TaskRequest {
  text: string;
  images?: string[];
  taskId?: string;
}

const filteredSayTypes = ["api_req_started"];

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

        // POST /api/v1/roo/task - Create new RooCode task with SSE stream
        fastify.post(
          "/roo/task",
          {
            schema: {
              tags: ["Tasks"],
              summary:
                "Create a new RooCode task or send message to existing task",
              description:
                "Creates and starts a new task using the RooCode extension if no taskId is provided, or sends a message to an existing task if taskId is provided. Returns Server-Sent Events stream for task progress.",
              body: { $ref: "TaskRequest#" },
              response: {
                200: {
                  description: "Server-Sent Events stream for task progress",
                  type: "string",
                  headers: {
                    "Content-Type": {
                      type: "string",
                      example: "text/event-stream",
                    },
                    "Cache-Control": { type: "string", example: "no-cache" },
                    Connection: { type: "string", example: "keep-alive" },
                  },
                },
                400: {
                  description: "Bad request - invalid input",
                  ...{ $ref: "ErrorResponse#" },
                },
                500: {
                  description: "Internal server error",
                  ...{ $ref: "ErrorResponse#" },
                },
              },
            },
          },
          async (request, reply) => {
            try {
              const { text, images, taskId } = request.body as TaskRequest;

              if (!text || text.trim() === "") {
                return reply.status(400).send({
                  status: "failed",
                  message: "Task query is required",
                });
              }

              if (
                !this.controller.isExtensionAvailable(ExtensionType.ROO_CODE)
              ) {
                return reply.status(500).send({
                  status: "failed",
                  message: "RooCode extension is not available",
                });
              }

              // Set up SSE headers
              reply.raw.setHeader("Content-Type", "text/event-stream");
              reply.raw.setHeader("Cache-Control", "no-cache");
              reply.raw.setHeader("Connection", "keep-alive");
              reply.raw.setHeader("Access-Control-Allow-Origin", "*");
              reply.raw.setHeader(
                "Access-Control-Allow-Headers",
                "Cache-Control",
              );

              // Helper function to send SSE data
              const sendSSE = (eventType: string, data: any) => {
                const sseData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
                reply.raw.write(sseData);
              };

              // Handle client disconnect
              request.raw.on("close", () => {
                logger.info("Client disconnected from SSE stream");
              });

              request.raw.on("error", (err) => {
                logger.error("SSE stream error:", err);
              });

              // Define event handlers for streaming task events
              const eventHandlers = {
                onMessage: (handlerTaskId: string, message: any) => {
                  if (filteredSayTypes.includes(message.say)) {
                    return;
                  }
                  sendSSE("message", {
                    taskId: handlerTaskId,
                    message,
                  });
                },
                onTaskCompleted: (
                  handlerTaskId: string,
                  tokenUsage: any,
                  toolUsage: any,
                ) => {
                  logger.info(`Task completed: ${handlerTaskId}`, {
                    tokenUsage,
                    toolUsage,
                  });
                  sendSSE("task_completed", {
                    taskId: handlerTaskId,
                    tokenUsage,
                    toolUsage,
                  });

                  // Wait a bit since there still might be some messages coming in
                  setTimeout(() => {
                    // Close the SSE stream
                    reply.raw.end();
                  }, 30_000);
                },
                onTaskAborted: (handlerTaskId: string) => {
                  logger.warn(`Task aborted: ${handlerTaskId}`);
                  sendSSE("task_aborted", {
                    taskId: handlerTaskId,
                  });

                  // Wait a bit since there still might be some messages coming in
                  setTimeout(() => {
                    // Close the SSE stream
                    reply.raw.end();
                  }, 30_000);
                },
                onTaskToolFailed: (
                  handlerTaskId: string,
                  tool: string,
                  error: string,
                ) => {
                  logger.error(
                    `Tool failed in task ${handlerTaskId}: ${tool} - ${error}`,
                  );
                  sendSSE("tool_failed", {
                    taskId: handlerTaskId,
                    tool,
                    error,
                  });
                },
              };

              try {
                if (taskId) {
                  // Send message to existing task
                  logger.info(`Sending message to existing task: ${taskId}`);

                  // Check if task exists in active tasks or history
                  const activeTaskIds = this.controller.getActiveTaskIds();
                  const isTaskInHistory =
                    await this.controller.rooCodeAdapter.isTaskInHistory(
                      taskId,
                    );

                  if (!activeTaskIds.includes(taskId) && !isTaskInHistory) {
                    return reply.status(404).send({
                      status: "failed",
                      message: `Task with ID ${taskId} not found`,
                    });
                  }

                  // If task is in history, resume it first
                  if (!activeTaskIds.includes(taskId) && isTaskInHistory) {
                    await this.controller.rooCodeAdapter.resumeTask(taskId);
                  }

                  // Send the message
                  await this.controller.sendMessage(
                    {
                      text,
                      images,
                      taskId,
                      eventHandlers,
                    },
                    ExtensionType.ROO_CODE,
                  );

                  // Send initial task created event
                  sendSSE("task_resumed", {
                    taskId,
                    status: "resumed",
                    message: "Task resumed successfully",
                  });
                } else {
                  // Create new task
                  logger.info("Creating new RooCode task");

                  const newTaskId = await this.controller.startNewTask(
                    {
                      text,
                      images,
                      eventHandlers,
                    },
                    ExtensionType.ROO_CODE,
                  );

                  // Send initial task created event
                  sendSSE("task_created", {
                    taskId: newTaskId || uuidv4(),
                    status: "created",
                    message: "Task created successfully",
                  });

                  logger.info(
                    `Created new RooCode task with SSE: ${newTaskId}`,
                  );
                }
              } catch (taskError) {
                logger.error("Error processing RooCode task:", taskError);
                sendSSE("error", {
                  error:
                    taskError instanceof Error
                      ? taskError.message
                      : "Unknown error occurred",
                });
                reply.raw.end();
              }
            } catch (error) {
              logger.error("Error processing RooCode task request:", error);
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

        // POST /api/v1/roo/task/:taskId - Handle task actions
        fastify.post(
          "/roo/task/:taskId",
          {
            schema: {
              tags: ["Tasks"],
              summary: "Perform actions on a RooCode task",
              description:
                "Perform specific actions on an existing RooCode task, such as pressing buttons for approvals",
              params: {
                type: "object",
                properties: {
                  taskId: {
                    type: "string",
                    description: "The task ID to perform the action on",
                  },
                },
                required: ["taskId"],
              },
              body: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["pressPrimaryButton", "pressSecondaryButton"],
                    description: "The action to perform on the task",
                  },
                },
                required: ["action"],
              },
              response: {
                200: {
                  description: "Action performed successfully",
                },
                400: {
                  description: "Bad request - invalid input",
                },
                404: {
                  description: "Task not found",
                },
                500: {
                  description: "Internal server error",
                },
              },
            },
          },
          async (request, reply) => {
            try {
              const { taskId } = request.params as { taskId: string };
              const { action } = request.body as { action: string };

              if (
                !this.controller.isExtensionAvailable(ExtensionType.ROO_CODE)
              ) {
                return reply.status(500).send();
              }

              // Check if task exists in active tasks or history
              const activeTaskIds = this.controller.getActiveTaskIds();
              const isTaskInHistory =
                await this.controller.rooCodeAdapter.isTaskInHistory(taskId);

              if (!activeTaskIds.includes(taskId) && !isTaskInHistory) {
                return reply.status(404).send();
              }

              // If task is in history, resume it first
              if (!activeTaskIds.includes(taskId) && isTaskInHistory) {
                await this.controller.rooCodeAdapter.resumeTask(taskId);
              }

              switch (action) {
                case "pressPrimaryButton":
                  await this.controller.pressPrimaryButton(
                    ExtensionType.ROO_CODE,
                  );
                  logger.info(`Primary button pressed for task ${taskId}`);
                  return reply.status(200).send();

                case "pressSecondaryButton":
                  await this.controller.pressSecondaryButton(
                    ExtensionType.ROO_CODE,
                  );
                  logger.info(`Secondary button pressed for task ${taskId}`);
                  return reply.status(200).send();

                default:
                  return reply.status(400).send();
              }
            } catch (error) {
              logger.error("Error handling task action:", error);
              return reply.status(500).send();
            }
          },
        );

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
