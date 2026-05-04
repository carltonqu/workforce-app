"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function ResetEmployeesButton() {
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm("Are you sure you want to reset all employees? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-employees", {
        method: "POST",
      });
      
      if (res.ok) {
        alert("All employees have been reset successfully.");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reset employees.");
      }
    } catch (error) {
      alert("An error occurred while resetting employees.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleReset}
      disabled={loading}
      className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 mr-2" />
      )}
      {loading ? "Resetting..." : "Reset All Employees"}
    </Button>
  );
}
