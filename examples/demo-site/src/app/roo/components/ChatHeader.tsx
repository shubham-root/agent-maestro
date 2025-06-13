import React from "react";

interface ChatHeaderProps {
  onNewChat: () => void;
  hasMessages: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onNewChat,
  hasMessages,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md px-5 py-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">🤖</span>
        <h1 className="text-xl font-normal text-gray-800">
          RooCode Chat{" "}
          <span className="text-sm text-gray-500">
            powered by{" "}
            <a
              href="https://github.com/Joouis/agent-maestro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold italic text-blue-500 hover:text-blue-500 hover:underline"
            >
              Agent Maestro
            </a>
          </span>
        </h1>
      </div>
      <button
        onClick={onNewChat}
        disabled={!hasMessages}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !hasMessages
            ? "opacity-50 pointer-events-none bg-blue-500 text-white"
            : "bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5"
        }`}
      >
        ✨ New Chat
      </button>
    </div>
  );
};
