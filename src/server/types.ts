import { RooCodeSettings } from "@roo-code/types";

export interface MessageRequest {
  text: string;
  images?: string[];
  configuration?: RooCodeSettings;
}

export interface ActionRequest {
  action: "pressPrimaryButton" | "pressSecondaryButton";
}

export interface FileReadRequest {
  path: string;
}

export interface FileReadResponse {
  path: string;
  content: string;
  encoding: string;
  size: number;
  mimeType: string;
}
