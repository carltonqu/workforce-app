"use client";

import { Clock } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        .animate-pulse-fast {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="relative">
        {/* Outer ring */}
        <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-800" />
        
        {/* Animated gradient ring */}
        <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-t-blue-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin-slow" />
        
        {/* Inner pulsing circle with clock icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30 animate-pulse-fast">
            <Clock className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 w-24 h-24 animate-spin-slow" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 rounded-full bg-blue-500" />
        </div>
        <div className="absolute inset-0 w-24 h-24 animate-spin-slow" style={{ animationDuration: '3s', animationDelay: '-1s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 rounded-full bg-cyan-500" />
        </div>
        <div className="absolute inset-0 w-24 h-24 animate-spin-slow" style={{ animationDuration: '3s', animationDelay: '-2s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 rounded-full bg-blue-400" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white animate-bounce-subtle">
          Loading...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ClockRoster
        </p>
      </div>
      
      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
