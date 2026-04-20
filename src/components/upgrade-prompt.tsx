// Upgrade prompt stub - no longer used
// This file exists to prevent import errors while auth is being removed

interface UpgradePromptProps {
  requiredTier?: string;
  featureName?: string;
}

export function UpgradePrompt({ requiredTier, featureName }: UpgradePromptProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Feature Available</h2>
      <p className="text-gray-500">
        {featureName || "This feature"} is available in your current plan.
      </p>
    </div>
  );
}
