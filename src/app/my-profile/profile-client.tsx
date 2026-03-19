"use client";

import { useState, useEffect } from "react";
import { Camera, Save, Lock, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

interface EmergencyContact { name: string; relationship: string; phone: string; }

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const readonlyCls = "w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed";

export function ProfileClient({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Editable fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [motto, setMotto] = useState("");
  const [ec, setEc] = useState<EmergencyContact>({ name: "", relationship: "", phone: "" });

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    fetch("/api/employee/profile")
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setPhoneNumber(data.phoneNumber || "");
        setAddress(data.address || "");
        setProfilePhoto(data.profilePhoto || "");
        setPhotoPreview(data.profilePhoto || "");
        setMotto(data.motto || "");
        try {
          const parsed = typeof data.emergencyContact === "string"
            ? JSON.parse(data.emergencyContact)
            : data.emergencyContact;
          if (parsed) setEc(parsed);
        } catch { /* empty */ }
      })
      .finally(() => setLoading(false));
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setPhotoPreview(b64);
      setProfilePhoto(b64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, address, profilePhoto, motto, emergencyContact: ec }),
      });
      if (!res.ok) { showToast("error", (await res.json()).error || "Failed to save"); return; }
      showToast("success", "Profile updated successfully");
    } finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { showToast("error", "Passwords don't match"); return; }
    setChangingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Failed to change password"); return; }
      showToast("success", "Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } finally { setChangingPw(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const nameInitials = (user?.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header with photo upload */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                {nameInitials}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{profile?.fullName || user?.name}</p>
            <p className="text-sm text-gray-500">{profile?.email || user?.email}</p>
            {motto && <p className="text-xs text-gray-400 italic mt-1">&ldquo;{motto}&rdquo;</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-gray-500 text-sm">{profile?.position || "Employee"}</p>
            <p className="text-gray-400 text-xs mt-0.5">ID: {profile?.employeeId || "—"}</p>
          </div>
        </div>
      </div>

      {/* Personal Information (read-only) */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Employee ID">
            <div className={readonlyCls}>{profile?.employeeId || "—"}</div>
          </Field>
          <Field label="Email Address">
            <div className={readonlyCls}>{profile?.email || user.email || "—"}</div>
          </Field>
          <Field label="Department">
            <div className={readonlyCls}>{profile?.department || "—"}</div>
          </Field>
          <Field label="Position">
            <div className={readonlyCls}>{profile?.position || "—"}</div>
          </Field>
          <Field label="Branch / Location">
            <div className={readonlyCls}>{profile?.branchLocation || "—"}</div>
          </Field>
          <Field label="Reporting Manager">
            <div className={readonlyCls}>{profile?.reportingManager || "—"}</div>
          </Field>
          <Field label="Hire Date">
            <div className={readonlyCls}>{formatDate(profile?.hireDate)}</div>
          </Field>
          <Field label="Employment Status">
            <div className={readonlyCls}>{profile?.employmentStatus || "—"}</div>
          </Field>
        </div>
      </div>

      {/* Editable Details */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">My Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Phone Number">
            <input className={inputCls} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+63 912 345 6789" />
          </Field>
          <div className="col-span-full">
            <Field label="Address">
              <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, Province" />
            </Field>
          </div>
          <div className="col-span-full">
            <Field label="Personal Motto / Bio">
              <div className="relative">
                <input
                  className={inputCls}
                  placeholder="Add a personal motto or bio..."
                  value={motto}
                  maxLength={120}
                  onChange={e => setMotto(e.target.value)}
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">{motto.length}/120</span>
              </div>
            </Field>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-600 mb-3">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Name">
            <input className={inputCls} value={ec.name} onChange={e => setEc(p => ({ ...p, name: e.target.value }))} placeholder="Maria Dela Cruz" />
          </Field>
          <Field label="Relationship">
            <input className={inputCls} value={ec.relationship} onChange={e => setEc(p => ({ ...p, relationship: e.target.value }))} placeholder="Spouse / Parent" />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={ec.phone} onChange={e => setEc(p => ({ ...p, phone: e.target.value }))} placeholder="+63 998 765 4321" />
          </Field>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Current Password">
            <input type="password" className={inputCls} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="New Password">
            <input type="password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" className={inputCls} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </Field>
        </div>
        <button
          onClick={handleChangePassword}
          disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {changingPw ? "Updating..." : "Update Password"}
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
