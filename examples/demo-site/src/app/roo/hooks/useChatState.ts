import { useState, useCallback } from "react";
import type { Message } from "../types/chat";

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [showTyping, setShowTyping] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      );
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const resetChatState = useCallback(() => {
    setMessages([]);
    setCurrentTaskId(null);
    setIsWaitingForResponse(false);
    setInputValue("");
    setShowTyping(false);
  }, []);

  const setWaitingState = useCallback((waiting: boolean) => {
    setIsWaitingForResponse(waiting);
    setShowTyping(waiting);
  }, []);

  return {
    // State
    messages,
    inputValue,
    isWaitingForResponse,
    currentTaskId,
    showTyping,

    // Setters
    setInputValue,
    setIsWaitingForResponse,
    setCurrentTaskId,
    setShowTyping,

    // Actions
    addMessage,
    updateMessage,
    clearMessages,
    resetChatState,
    setWaitingState,
  };
};
