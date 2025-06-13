import React from "react";

interface StatusIndicatorProps {
  show: boolean;
  message: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  show,
  message,
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-5 px-3 py-2 bg-black/80 text-white rounded-2xl text-xs z-50 animate-in slide-in-from-right">
      {message}
    </div>
  );
};
