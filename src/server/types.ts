export interface MessageRequest {
  text: string;
  images?: string[];
}

export interface ActionRequest {
  action: "pressPrimaryButton" | "pressSecondaryButton";
}
