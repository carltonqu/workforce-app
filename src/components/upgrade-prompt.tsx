"use client";

import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Tier } from "@/lib/tier";

interface UpgradePromptProps {
  requiredTier: "PRO" | "ADVANCED";
  featureName: string;
  children?: React.ReactNode;
}

export function UpgradePrompt({
  requiredTier,
  featureName,
  children,
}: UpgradePromptProps) {
  const tierColors =
    requiredTier === "PRO"
      ? "from-blue-500 to-blue-700"
      : "from-purple-500 to-purple-700";

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred preview */}
      {children && (
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="text-center p-8 max-w-md">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center mx-auto mb-4`}
          >
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {featureName} requires {requiredTier === "PRO" ? "Pro" : "Advanced"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            {requiredTier === "PRO"
              ? "Upgrade to Pro to unlock scheduling, notifications, and more."
              : "Upgrade to Advanced to unlock payroll, reports, and all features."}
          </p>
          <Link href="/settings#upgrade">
            <Button
              className={`bg-gradient-to-r ${tierColors} text-white border-none hover:opacity-90`}
            >
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to {requiredTier === "PRO" ? "Pro" : "Advanced"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
