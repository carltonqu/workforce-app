"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, Save, Loader2, X, ChevronLeft, CheckCircle2, AlertCircle,
  Laptop, Smartphone, Receipt, Shirt, Wrench, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ToastState = { type: "success" | "error"; message: string } | null;

const ASSET_TYPES = [
  { value: "Laptop", label: "Laptop", icon: Laptop },
  { value: "Phone", label: "Phone", icon: Smartphone },
  { value: "POS", label: "POS", icon: Receipt },
  { value: "Uniform", label: "Uniform", icon: Shirt },
  { value: "Tool", label: "Tool", icon: Wrench },
  { value: "Other", label: "Other", icon: HelpCircle },
];

const CONDITIONS = ["New", "Good", "Fair", "Damaged"];

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

export function NewAssetClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [form, setForm] = useState({
    name: "",
    type: "Laptop",
    serialNumber: "",
    brand: "",
    model: "",
    condition: "Good",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Asset name is required" });
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        setToast({ type: "success", message: "Asset added successfully" });
        setTimeout(() => {
          router.push("/assets");
          router.refresh();
        }, 1500);
      } else {
        const error = await res.json();
        setToast({ type: "error", message: error.error || "Failed to add asset" });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const selectedType = ASSET_TYPES.find(t => t.value === form.type);
  const TypeIcon = selectedType?.icon || Laptop;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm shadow-lg animate-fade-in-up ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up">
        <button onClick={() => router.push("/assets")} className="hover:text-blue-600 transition-colors">
          Assets
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Add New Asset</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/assets")}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Asset</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add a new asset to the inventory</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Asset Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Asset Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g. MacBook Pro 14"
            />
          </div>

          {/* Type and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Asset Type</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TypeIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                className={INPUT_CLASS}
              >
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Serial Number</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => handleChange("serialNumber", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Optional serial number"
            />
          </div>

          {/* Brand and Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Apple"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. A2442"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className={`${INPUT_CLASS} min-h-[100px] resize-none`}
              rows={3}
              placeholder="Optional notes about this asset..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button 
              variant="outline" 
              onClick={() => router.push("/assets")} 
              className="rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Add Asset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
