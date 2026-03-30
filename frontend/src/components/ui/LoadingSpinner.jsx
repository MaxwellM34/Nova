import React from "react";

export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-4 border-nova-200 border-t-nova-600 rounded-full animate-spin" />
    </div>
  );
}
