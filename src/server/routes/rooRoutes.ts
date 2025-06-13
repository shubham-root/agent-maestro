import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger";
import { ExtensionController, ExtensionType } from "../../core/controller";

export interface MessageRequest {
  text: string;
  images?: string[];
}

export interface ActionRequest {
  action: "pressPrimaryButton" | "pressSecondaryButton";
}

const filteredSayTypes = ["api_req_started"];

// Helper function to set up SSE headers and return sendSSE function
function setupSSEResponse(reply: FastifyReply, request: FastifyRequest) {
  // Set up SSE headers
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("Access-Control-Allow-Origin", "*");
  reply.raw.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Helper function to send SSE data
  const sendSSE = (eventType: string, data: any) => {
    const sseData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    reply.raw.write(sseData);
  };

  // Handle client disconnect
  request.raw.on("close", () => {
    logger.info("Client disconnected from SSE stream");
  });

  request.raw.on("error", (err: Error) => {
    logger.error("SSE stream error:", err);
  });

  return { sendSSE };
}

// Helper function to create event handlers for task streaming
function createTaskEventHandlers(
  sendSSE: (eventType: string, data: any) => void,
  reply: FastifyReply,
) {
  return {
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
    onTaskToolFailed: (handlerTaskId: string, tool: string, error: string) => {
      logger.error(`Tool failed in task ${handlerTaskId}: ${tool} - ${error}`);
      sendSSE("tool_failed", {
        taskId: handlerTaskId,
        tool,
        error,
      });
    },
  };
}

export async function registerRooRoutes(
  fastify: FastifyInstance,
  controller: ExtensionController,
) {
  // POST /api/v1/roo/task - Create new RooCode task with SSE stream
  fastify.post(
    "/roo/task",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Create a new RooCode task",
        description:
          "Creates and starts a new task using the RooCode extension. Returns Server-Sent Events stream for task progress.",
        body: {
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
          },
        },
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
        const { text, images } = request.body as MessageRequest;

        if (!text || text.trim() === "") {
          return reply.status(400).send({
            status: "failed",
            message: "Task query is required",
          });
        }

        if (!controller.isExtensionAvailable(ExtensionType.ROO_CODE)) {
          return reply.status(500).send({
            status: "failed",
            message: "RooCode extension is not available",
          });
        }

        // Use shared SSE setup
        const { sendSSE } = setupSSEResponse(reply, request);
        const eventHandlers = createTaskEventHandlers(sendSSE, reply);

        try {
          // Create new task logic
          logger.info("Creating new RooCode task");

          const newTaskId = await controller.startNewTask(
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

          logger.info(`Created new RooCode task with SSE: ${newTaskId}`);
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
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    },
  );

  // POST /api/v1/roo/task/:taskId/message - Send message to existing RooCode task
  fastify.post(
    "/roo/task/:taskId/message",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Send message to existing RooCode task",
        description:
          "Sends a message to an existing RooCode task. Returns Server-Sent Events stream for task progress.",
        params: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "The task ID to send the message to",
            },
          },
          required: ["taskId"],
        },
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              description: "The message text to send",
            },
            images: {
              type: "array",
              items: { type: "string" },
              description: "Optional array of base64-encoded images",
            },
          },
        },
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
          404: {
            description: "Task not found",
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
        const { taskId } = request.params as { taskId: string };
        const { text, images } = request.body as MessageRequest;

        if (!text || text.trim() === "") {
          return reply.status(400).send({
            status: "failed",
            message: "Message text is required",
          });
        }

        if (!controller.isExtensionAvailable(ExtensionType.ROO_CODE)) {
          return reply.status(500).send({
            status: "failed",
            message: "RooCode extension is not available",
          });
        }

        // Check if task exists in active tasks or history
        const activeTaskIds = controller.getActiveTaskIds();
        const isTaskInHistory =
          await controller.rooCodeAdapter.isTaskInHistory(taskId);

        if (!activeTaskIds.includes(taskId) && !isTaskInHistory) {
          return reply.status(404).send({
            status: "failed",
            message: `Task with ID ${taskId} not found`,
          });
        }

        // Use shared SSE setup
        const { sendSSE } = setupSSEResponse(reply, request);
        const eventHandlers = createTaskEventHandlers(sendSSE, reply);

        try {
          // Send message to existing task logic
          logger.info(`Sending message to existing task: ${taskId}`);

          // If task is in history, resume it first
          if (!activeTaskIds.includes(taskId) && isTaskInHistory) {
            await controller.rooCodeAdapter.resumeTask(taskId);
          }

          // Send the message
          await controller.sendMessage(
            {
              text,
              images,
              taskId,
              eventHandlers,
            },
            ExtensionType.ROO_CODE,
          );

          // Send initial task resumed event
          sendSSE("task_resumed", {
            taskId,
            status: "resumed",
            message: "Task resumed successfully",
          });
        } catch (taskError) {
          logger.error("Error processing RooCode task message:", taskError);
          sendSSE("error", {
            error:
              taskError instanceof Error
                ? taskError.message
                : "Unknown error occurred",
          });
          reply.raw.end();
        }
      } catch (error) {
        logger.error("Error processing RooCode task message request:", error);
        return reply.status(500).send({
          status: "failed",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    },
  );

  // POST /api/v1/roo/task/:taskId/action - Handle task actions
  fastify.post(
    "/roo/task/:taskId/action",
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
        const { action } = request.body as ActionRequest;

        if (!controller.isExtensionAvailable(ExtensionType.ROO_CODE)) {
          return reply.status(500).send();
        }

        // Check if task exists in active tasks or history
        const activeTaskIds = controller.getActiveTaskIds();
        const isTaskInHistory =
          await controller.rooCodeAdapter.isTaskInHistory(taskId);

        if (!activeTaskIds.includes(taskId) && !isTaskInHistory) {
          return reply.status(404).send();
        }

        // If task is in history, resume it first
        if (!activeTaskIds.includes(taskId) && isTaskInHistory) {
          await controller.rooCodeAdapter.resumeTask(taskId);
        }

        switch (action) {
          case "pressPrimaryButton":
            await controller.pressPrimaryButton(ExtensionType.ROO_CODE);
            logger.info(`Primary button pressed for task ${taskId}`);
            return reply.status(200).send();

          case "pressSecondaryButton":
            await controller.pressSecondaryButton(ExtensionType.ROO_CODE);
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
}
