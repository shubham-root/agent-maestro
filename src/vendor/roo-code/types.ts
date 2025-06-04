import { z } from "zod";
import { rooCodeEventsSchema, RooCodeEventName } from "@roo-code/types";

/**
 * Ack
 */

export const ackSchema = z.object({
  clientId: z.string(),
  pid: z.number(),
  ppid: z.number(),
});

export type Ack = z.infer<typeof ackSchema>;

/**
 * IpcMessage
 */

export enum IpcMessageType {
  Connect = "Connect",
  Disconnect = "Disconnect",
  Ack = "Ack",
  TaskCommand = "TaskCommand",
  TaskEvent = "TaskEvent",
}

/**
 * TaskCommand
 */

export enum TaskCommandName {
  StartNewTask = "StartNewTask",
  CancelTask = "CancelTask",
  CloseTask = "CloseTask",
}

export const taskCommandSchema = z.discriminatedUnion("commandName", [
  z.object({
    commandName: z.literal(TaskCommandName.StartNewTask),
    data: z.object({
      configuration: z.object({}),
      text: z.string(),
      images: z.array(z.string()).optional(),
      newTab: z.boolean().optional(),
    }),
  }),
  z.object({
    commandName: z.literal(TaskCommandName.CancelTask),
    data: z.string(),
  }),
  z.object({
    commandName: z.literal(TaskCommandName.CloseTask),
    data: z.string(),
  }),
]);

export type TaskCommand = z.infer<typeof taskCommandSchema>;

/**
 * TaskEvent
 */

export const taskEventSchema = z.discriminatedUnion("eventName", [
  z.object({
    eventName: z.literal(RooCodeEventName.Message),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.Message],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskCreated),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskCreated],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskStarted),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskStarted],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskModeSwitched),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskModeSwitched],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskPaused),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskPaused],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskUnpaused),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskUnpaused],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskAskResponded),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskAskResponded],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskAborted),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskAborted],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskSpawned),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskSpawned],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskCompleted),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskCompleted],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskTokenUsageUpdated),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskTokenUsageUpdated],
    taskId: z.number().optional(),
  }),
  z.object({
    eventName: z.literal(RooCodeEventName.TaskToolFailed),
    payload: rooCodeEventsSchema.shape[RooCodeEventName.TaskToolFailed],
    taskId: z.number().optional(),
  }),
]);

export type TaskEvent = z.infer<typeof taskEventSchema>;

/**
 * Client
 */

export type IpcClientEvents = {
  [IpcMessageType.Connect]: [];
  [IpcMessageType.Disconnect]: [];
  [IpcMessageType.Ack]: [data: Ack];
  [IpcMessageType.TaskCommand]: [data: TaskCommand];
  [IpcMessageType.TaskEvent]: [data: TaskEvent];
};
