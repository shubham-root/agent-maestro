"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  suggestions?: string[];
  isCompletionResult?: boolean;
}

export default function RooPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const showStatusMessage = (message: string) => {
    setStatusMessage(message);
    setShowStatus(true);
    setTimeout(() => {
      setShowStatus(false);
    }, 3000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentTaskId(null);
    setIsWaitingForResponse(false);
    setInputValue("");
    setShowTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isWaitingForResponse) return;
    setInputValue(suggestion);
    setTimeout(() => sendMessage(suggestion), 100);
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isWaitingForResponse) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      isUser: true,
      timestamp: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Update UI state
    setIsWaitingForResponse(true);
    setShowTyping(true);

    try {
      const url = `http://127.0.0.1:23333/api/v1/roo/task`;
      const body = currentTaskId
        ? { taskId: currentTaskId, task: message }
        : { task: message };

      showStatusMessage("Connecting to RooCode...");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setShowTyping(false);
      showStatusMessage("Receiving response...");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentAgentMessageId: string | null = null;
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              if (currentEvent === "task_created" && data.taskId) {
                setCurrentTaskId(data.taskId);
                showStatusMessage("Task created, streaming response...");
              } else if (
                currentEvent === "message" &&
                data.message &&
                data.message.partial !== undefined
              ) {
                if (data.message.type === "say" && data.message.text) {
                  // Create agent message only once, then update it
                  if (!currentAgentMessageId) {
                    const newAgentMessageId = uuidv4();
                    currentAgentMessageId = newAgentMessageId;

                    const newAgentMessage: Message = {
                      id: newAgentMessageId,
                      content: data.message.text,
                      isUser: false,
                      timestamp: getCurrentTime(),
                      isCompletionResult:
                        data.message.say === "completion_result",
                    };

                    setMessages((prev) => [...prev, newAgentMessage]);
                    accumulatedText = data.message.text;
                  } else {
                    // Update existing message content
                    accumulatedText = data.message.text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === currentAgentMessageId
                          ? { ...msg, content: accumulatedText }
                          : msg,
                      ),
                    );
                  }

                  // If message is complete (not partial), prepare for next message
                  if (!data.message.partial) {
                    currentAgentMessageId = null;
                    accumulatedText = "";
                    setIsWaitingForResponse(false);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }
                } else if (
                  data.message.type === "ask" &&
                  data.message.ask === "followup" &&
                  data.message.text
                ) {
                  if (data.message.partial) {
                    // When partial is true, text is just the plain question
                    if (!currentAgentMessageId) {
                      const newAgentMessageId = uuidv4();
                      currentAgentMessageId = newAgentMessageId;

                      const newAgentMessage: Message = {
                        id: newAgentMessageId,
                        content: data.message.text,
                        isUser: false,
                        timestamp: getCurrentTime(),
                      };

                      setMessages((prev) => [...prev, newAgentMessage]);
                    } else {
                      // Update existing message content
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === currentAgentMessageId
                            ? { ...msg, content: data.message.text }
                            : msg,
                        ),
                      );
                    }
                  } else {
                    // When partial is false, handle the complete followup ask
                    let finalContent = data.message.text;
                    let suggestions: string[] = [];

                    // Try to parse as JSON first (for structured data)
                    try {
                      const askData = JSON.parse(data.message.text);
                      if (askData.question) {
                        finalContent = askData.question;
                      }
                      if (askData.suggest && Array.isArray(askData.suggest)) {
                        suggestions = askData.suggest;
                      }
                    } catch (e) {
                      console.error("Failed to parse ask data as JSON:", e);
                    }

                    if (currentAgentMessageId) {
                      // Update the existing message with final content and suggestions
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === currentAgentMessageId
                            ? { ...msg, content: finalContent, suggestions }
                            : msg,
                        ),
                      );
                    } else {
                      // Create new message if somehow we don't have an existing one
                      const newAgentMessageId = uuidv4();
                      const newAgentMessage: Message = {
                        id: newAgentMessageId,
                        content: finalContent,
                        isUser: false,
                        timestamp: getCurrentTime(),
                        suggestions,
                      };
                      setMessages((prev) => [...prev, newAgentMessage]);
                    }

                    setTimeout(() => {
                      currentAgentMessageId = null;
                    }, 1);
                    setIsWaitingForResponse(false);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }
                }
              } else if (currentEvent === "task_completed") {
                showStatusMessage("Response completed! Finalizing...");
                // Wait 3 seconds before finishing task to allow any remaining message events
                setTimeout(() => {
                  setIsWaitingForResponse(false);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                  showStatusMessage("Task completed!");
                }, 3000);
              } else if (
                currentEvent === "task_aborted" ||
                currentEvent === "error"
              ) {
                showStatusMessage("Task ended with error");
                setIsWaitingForResponse(false);
                // Only add error message if no current message exists
                if (!currentAgentMessageId) {
                  const errorAgentMessage: Message = {
                    id: uuidv4(),
                    content:
                      "Sorry, there was an error processing your request.",
                    isUser: false,
                    timestamp: getCurrentTime(),
                  };
                  setMessages((prev) => [...prev, errorAgentMessage]);
                }
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setShowTyping(false);
      showStatusMessage(
        `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      const errorMessage: Message = {
        id: uuidv4(),
        content: "Sorry, I encountered a connection error. Please try again.",
        isUser: false,
        timestamp: getCurrentTime(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsWaitingForResponse(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md px-5 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <h1 className="text-2xl font-normal text-gray-800">
            RooCode Chat{" "}
            <span className="text-sm text-gray-500">
              powered by{" "}
              <a
                href="https://github.com/Joouis/agent-maestro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold italic text-blue-500 hover:text-blue-500 hover:underline"
              >
                Agent Maestro
              </a>
            </span>
          </h1>
        </div>
        <button
          onClick={handleNewChat}
          disabled={messages.length === 0}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            messages.length === 0
              ? "opacity-50 pointer-events-none bg-blue-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5"
          }`}
        >
          ✨ New Chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={chatMessagesRef}
        className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-white/80 px-10">
            <h2 className="text-3xl font-light mb-3">
              Welcome to RooCode Chat
            </h2>
            <p className="text-lg opacity-80 max-w-md leading-relaxed">
              Start a conversation by typing your message below. I'm here to
              help you with coding tasks and questions!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex max-w-4xl ${
                message.isUser ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl relative max-w-full break-words ${
                  message.isUser
                    ? "bg-blue-500 text-white rounded-br-md"
                    : message.isCompletionResult
                      ? "bg-green-100 text-green-800 rounded-bl-md border-l-4 border-green-500"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer transition-all hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-0.5 flex items-start gap-2"
                      >
                        <span className="font-semibold text-blue-600 min-w-5 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-gray-700 flex-1 text-sm leading-relaxed">
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-white/60 mx-3 self-end whitespace-nowrap">
                {message.timestamp}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="bg-white/95 backdrop-blur-md p-5 border-t border-black/10">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isWaitingForResponse}
            placeholder={
              isWaitingForResponse
                ? "Waiting for response..."
                : "Type your message..."
            }
            rows={1}
            className="flex-1 min-h-11 max-h-30 px-4 py-3 border-2 border-gray-200 rounded-3xl text-base text-black resize-none outline-none transition-colors focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isWaitingForResponse}
            className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg transition-all hover:bg-blue-600 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="fixed top-20 right-5 px-3 py-2 bg-black/80 text-white rounded-2xl text-xs z-50 animate-in slide-in-from-right">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
