import React from "react";

interface MessageSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
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
  );
};
