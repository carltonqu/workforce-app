"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Eye,
  Upload, X, AlertCircle, CheckCircle2, Loader2, User, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencyContact { name: string; relationship: string; phone: string; }
interface GovernmentTaxIds { sss: string; philhealth: string; pagibig: string; tin: string; }
interface BankDetails { bankName: string; accountName: string; accountNumber: string; }
interface UploadedDocument { name: string; url: string; uploadedAt: string; }

interface Employee {
  id: string; employeeId: string; fullName: string; profilePhoto?: string;
  email: string; phoneNumber?: string; address?: string; emergencyContact?: string;
  dateOfBirth?: string; gender?: string; hireDate?: string; employmentStatus: string;
  department?: string; position?: string; branchLocation?: string; reportingManager?: string;
  employmentType?: string; payrollType?: string; salaryRate?: number;
  governmentTaxIds?: string; bankDetails?: string; uploadedDocuments?: string;
  orgId?: string; createdAt: string; updatedAt: string;
}

export type FormState = {
  employeeId: string; fullName: string; profilePhoto: string; email: string;
  phoneNumber: string; address: string; emergencyContact: EmergencyContact;
  dateOfBirth: string; gender: string; hireDate: string; employmentStatus: string;
  department: string; position: string; branchLocation: string; reportingManager: string;
  employmentType: string; payrollType: string; salaryRate: string;
  governmentTaxIds: GovernmentTaxIds; bankDetails: BankDetails;
  uploadedDocuments: UploadedDocument[];
};

const EMPTY_FORM: FormState = {
  employeeId: "", fullName: "", profilePhoto: "", email: "", phoneNumber: "",
  address: "", emergencyContact: { name: "", relationship: "", phone: "" },
  dateOfBirth: "", gender: "", hireDate: "", employmentStatus: "Active",
  department: "", position: "", branchLocation: "", reportingManager: "",
  employmentType: "", payrollType: "", salaryRate: "",
  governmentTaxIds: { sss: "", philhealth: "", pagibig: "", tin: "" },
  bankDetails: { bankName: "", accountName: "", accountNumber: "" },
  uploadedDocuments: [],
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "On Leave": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Terminated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function parseJSON<T>(str?: string, fallback?: T): T | undefined {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Shared input primitives ──────────────────────────────────────────────────

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select className={inputCls} {...props}>{children}</select>;
}

function SmartSelect({
  value, onChange, options, placeholder
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newVal, setNewVal] = useState("");

  if (addingNew) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          className={inputCls + " flex-1"}
          placeholder={`New ${placeholder}`}
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && newVal.trim()) { onChange(newVal.trim()); setAddingNew(false); setNewVal(""); }
            if (e.key === "Escape") { setAddingNew(false); setNewVal(""); }
          }}
        />
        <button type="button" onClick={() => { if (newVal.trim()) { onChange(newVal.trim()); setAddingNew(false); setNewVal(""); } }}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
        <button type="button" onClick={() => { setAddingNew(false); setNewVal(""); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
      </div>
    );
  }

  return (
    <select
      className={inputCls}
      value={value}
      onChange={e => {
        if (e.target.value === "__new__") { setAddingNew(true); }
        else { onChange(e.target.value); }
      }}
    >
      <option value="">— Select {placeholder} —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
      <option value="__new__">＋ Add new {placeholder}...</option>
    </select>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ─── Modal shell (defined OUTSIDE main component) ─────────────────────────────

function Modal({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Tab components (defined OUTSIDE — critical for stable identity) ──────────

function PersonalTab({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const ec = form.emergencyContact;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Employee ID" required>
        <FInput placeholder="e.g. EMP-001" value={form.employeeId}
          onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} />
      </Field>
      <Field label="Full Name" required>
        <FInput placeholder="Juan Dela Cruz" value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      </Field>
      <Field label="Email Address" required>
        <FInput type="email" placeholder="juan@company.com" value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      </Field>
      <Field label="Phone Number">
        <FInput placeholder="+63 912 345 6789" value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
      </Field>
      <Field label="Date of Birth">
        <FInput type="date" value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
      </Field>
      <Field label="Gender">
        <FSelect value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </FSelect>
      </Field>
      <Field label="Address">
        <FInput placeholder="123 Main St, City, Province" value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
      </Field>
      <Field label="Profile Photo URL">
        <FInput placeholder="https://..." value={form.profilePhoto}
          onChange={(e) => setForm((f) => ({ ...f, profilePhoto: e.target.value }))} />
      </Field>
      <div className="col-span-full">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 mt-2">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name">
            <FInput placeholder="Maria Dela Cruz" value={ec.name}
              onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))} />
          </Field>
          <Field label="Relationship">
            <FInput placeholder="Spouse / Parent" value={ec.relationship}
              onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, relationship: e.target.value } }))} />
          </Field>
          <Field label="Phone">
            <FInput placeholder="+63 998 765 4321" value={ec.phone}
              onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function EmploymentTab({ form, setForm, departments, branches }: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  departments: string[];
  branches: string[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Hire Date">
        <FInput type="date" value={form.hireDate}
          onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} />
      </Field>
      <Field label="Employment Status">
        <FSelect value={form.employmentStatus} onChange={(e) => setForm((f) => ({ ...f, employmentStatus: e.target.value }))}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </FSelect>
      </Field>
      <Field label="Department">
        <SmartSelect
          value={form.department}
          onChange={(v) => setForm((f) => ({ ...f, department: v }))}
          options={departments}
          placeholder="Department"
        />
      </Field>
      <Field label="Position / Job Title">
        <FInput placeholder="Software Engineer" value={form.position}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
      </Field>
      <Field label="Branch / Location">
        <SmartSelect
          value={form.branchLocation}
          onChange={(v) => setForm((f) => ({ ...f, branchLocation: v }))}
          options={branches}
          placeholder="Branch"
        />
      </Field>
      <Field label="Reporting Manager">
        <FInput placeholder="John Smith" value={form.reportingManager}
          onChange={(e) => setForm((f) => ({ ...f, reportingManager: e.target.value }))} />
      </Field>
      <Field label="Employment Type">
        <FSelect value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}>
          <option value="">Select type</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Probationary">Probationary</option>
          <option value="Freelance">Freelance</option>
        </FSelect>
      </Field>
    </div>
  );
}

function CompensationTab({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Payroll Type">
        <FSelect value={form.payrollType} onChange={(e) => setForm((f) => ({ ...f, payrollType: e.target.value }))}>
          <option value="">Select payroll type</option>
          <option value="Monthly">Monthly</option>
          <option value="Semi-monthly">Semi-monthly</option>
          <option value="Weekly">Weekly</option>
          <option value="Daily">Daily</option>
          <option value="Hourly">Hourly</option>
        </FSelect>
      </Field>
      <Field label="Salary Rate (₱)">
        <FInput type="number" placeholder="0.00" value={form.salaryRate}
          onChange={(e) => setForm((f) => ({ ...f, salaryRate: e.target.value }))} />
      </Field>
    </div>
  );
}

function GovernmentTab({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const gov = form.governmentTaxIds;
  const bank = form.bankDetails;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Government / Tax IDs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SSS Number">
            <FInput placeholder="01-2345678-9" value={gov.sss}
              onChange={(e) => setForm((f) => ({ ...f, governmentTaxIds: { ...f.governmentTaxIds, sss: e.target.value } }))} />
          </Field>
          <Field label="PhilHealth Number">
            <FInput placeholder="0001-234567890-1" value={gov.philhealth}
              onChange={(e) => setForm((f) => ({ ...f, governmentTaxIds: { ...f.governmentTaxIds, philhealth: e.target.value } }))} />
          </Field>
          <Field label="Pag-IBIG / HDMF Number">
            <FInput placeholder="1234-5678-9012" value={gov.pagibig}
              onChange={(e) => setForm((f) => ({ ...f, governmentTaxIds: { ...f.governmentTaxIds, pagibig: e.target.value } }))} />
          </Field>
          <Field label="TIN Number">
            <FInput placeholder="123-456-789-000" value={gov.tin}
              onChange={(e) => setForm((f) => ({ ...f, governmentTaxIds: { ...f.governmentTaxIds, tin: e.target.value } }))} />
          </Field>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Bank Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Bank Name">
            <FInput placeholder="BDO, BPI, Metrobank..." value={bank.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, bankName: e.target.value } }))} />
          </Field>
          <Field label="Account Name">
            <FInput placeholder="Juan Dela Cruz" value={bank.accountName}
              onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, accountName: e.target.value } }))} />
          </Field>
          <Field label="Account Number">
            <FInput placeholder="1234567890" value={bank.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, accountNumber: e.target.value } }))} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const docs = form.uploadedDocuments;

  function addDoc() {
    setForm((f) => ({ ...f, uploadedDocuments: [...f.uploadedDocuments, { name: "", url: "", uploadedAt: new Date().toISOString() }] }));
  }
  function removeDoc(idx: number) {
    setForm((f) => ({ ...f, uploadedDocuments: f.uploadedDocuments.filter((_, i) => i !== idx) }));
  }
  function updateDoc(idx: number, field: keyof UploadedDocument, val: string) {
    setForm((f) => {
      const arr = [...f.uploadedDocuments];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...f, uploadedDocuments: arr };
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Uploaded Documents</p>
        <Button size="sm" variant="outline" onClick={addDoc}>
          <Plus className="w-3 h-3 mr-1" />Add Document
        </Button>
      </div>
      {docs.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No documents added yet</p>
        </div>
      )}
      {docs.map((doc, idx) => (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Field label="Document Name">
            <FInput placeholder="Resume, NBI Clearance..." value={doc.name}
              onChange={(e) => updateDoc(idx, "name", e.target.value)} />
          </Field>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Field label="URL / Link">
                <FInput placeholder="https://drive.google.com/..." value={doc.url}
                  onChange={(e) => updateDoc(idx, "url", e.target.value)} />
              </Field>
            </div>
            <button onClick={() => removeDoc(idx)} className="mb-0.5 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ViewContent({ emp }: { emp: Employee }) {
  const ec = parseJSON<EmergencyContact>(emp.emergencyContact);
  const gov = parseJSON<GovernmentTaxIds>(emp.governmentTaxIds);
  const bank = parseJSON<BankDetails>(emp.bankDetails);
  const docs = parseJSON<UploadedDocument[]>(emp.uploadedDocuments, []) || [];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 mt-4 first:mt-0">{title}</p>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">{children}</div>
    </div>
  );
  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
      <Section title="Personal Information">
        <Row label="Employee ID" value={emp.employeeId} />
        <Row label="Full Name" value={emp.fullName} />
        <Row label="Email" value={emp.email} />
        <Row label="Phone" value={emp.phoneNumber} />
        <Row label="Date of Birth" value={formatDate(emp.dateOfBirth)} />
        <Row label="Gender" value={emp.gender} />
        <Row label="Address" value={emp.address} />
      </Section>
      {ec && (
        <Section title="Emergency Contact">
          <Row label="Name" value={ec.name} />
          <Row label="Relationship" value={ec.relationship} />
          <Row label="Phone" value={ec.phone} />
        </Section>
      )}
      <Section title="Employment">
        <Row label="Hire Date" value={formatDate(emp.hireDate)} />
        <Row label="Status" value={emp.employmentStatus} />
        <Row label="Department" value={emp.department} />
        <Row label="Position" value={emp.position} />
        <Row label="Branch / Location" value={emp.branchLocation} />
        <Row label="Reporting Manager" value={emp.reportingManager} />
        <Row label="Employment Type" value={emp.employmentType} />
      </Section>
      <Section title="Compensation">
        <Row label="Payroll Type" value={emp.payrollType} />
        <Row label="Salary Rate" value={emp.salaryRate ? `₱${emp.salaryRate.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : undefined} />
      </Section>
      {gov && (
        <Section title="Government / Tax IDs">
          <Row label="SSS" value={gov.sss} />
          <Row label="PhilHealth" value={gov.philhealth} />
          <Row label="Pag-IBIG" value={gov.pagibig} />
          <Row label="TIN" value={gov.tin} />
        </Section>
      )}
      {bank && (
        <Section title="Bank Details">
          <Row label="Bank" value={bank.bankName} />
          <Row label="Account Name" value={bank.accountName} />
          <Row label="Account Number" value={bank.accountNumber} />
        </Section>
      )}
      {docs.length > 0 && (
        <Section title="Documents">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{doc.name || "Unnamed"}</span>
              {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View</a>}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Create Account Modal (defined OUTSIDE main component) ────────────────────

function CreateAccountModal({
  emp,
  onClose,
  onSuccess,
}: {
  emp: Employee;
  onClose: () => void;
  onSuccess: (empId: string, username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ username: string; email: string } | null>(null);

  async function handleCreate() {
    setError("");
    if (!username.trim() || username.trim().length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) { setError("Username can only contain letters, numbers, dots, and underscores"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create account"); return; }
      setCreated({ username: data.username, email: data.email });
      onSuccess(emp.id, data.username);
    } finally { setSaving(false); }
  }

  if (created) {
    return (
      <Modal title="Account Created!" onClose={onClose}
        footer={<div className="flex justify-end"><Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Done</Button></div>}
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">{emp.fullName}</p>
            <p className="text-sm text-gray-500 mt-1">Login account has been created</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Login Credentials</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Username</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">{created.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{created.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Password</span>
              <span className="font-mono text-gray-900 dark:text-white">••••••••</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Share these credentials with the employee so they can log in.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Create Login Account" onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !username || !password || !confirmPassword}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Account"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Employee info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{emp.fullName}</p>
            <p className="text-xs text-gray-500">{emp.email}</p>
          </div>
        </div>

        <Field label="Username" required>
          <FInput
            placeholder="e.g. juan.delacruz or jdelacruz"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
          />
          <p className="text-xs text-gray-400 mt-0.5">Letters, numbers, dots, underscores only. Employee will use this to log in.</p>
        </Field>

        <Field label="Password" required>
          <FInput type="password" placeholder="Min. 6 characters" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </Field>

        <Field label="Confirm Password" required>
          <FInput type="password" placeholder="Re-enter password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} />
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            💡 The employee will log in at <strong>/login</strong> using their <strong>username</strong> or email and this password.
          </p>
        </div>
      </div>
    </Modal>
  );
}

const TABS = [
  { id: "personal", label: "Personal Info" },
  { id: "employment", label: "Employment" },
  { id: "compensation", label: "Compensation" },
  { id: "government", label: "Gov't & Bank" },
  { id: "documents", label: "Documents" },
];

export function EmployeesClient({ user }: { user: any }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [modal, setModal] = useState<"none" | "create" | "edit" | "view" | "delete">("none");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [accountedIds, setAccountedIds] = useState<Set<string>>(new Set());
  const [accountModal, setAccountModal] = useState<{ emp: Employee } | null>(null);

  const fetchAccountedIds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employees/accounts");
      if (res.ok) {
        const ids: string[] = await res.json();
        setAccountedIds(new Set(ids));
      }
    } catch { /* noop */ }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDept) params.set("department", filterDept);
      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) setEmployees(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterDept]);

  useEffect(() => { fetchEmployees(); fetchAccountedIds(); }, [fetchEmployees, fetchAccountedIds]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function openEdit(emp: Employee) {
    setSelected(emp);
    setForm({
      employeeId: emp.employeeId, fullName: emp.fullName, profilePhoto: emp.profilePhoto || "",
      email: emp.email, phoneNumber: emp.phoneNumber || "", address: emp.address || "",
      emergencyContact: parseJSON<EmergencyContact>(emp.emergencyContact, { name: "", relationship: "", phone: "" })!,
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "",
      gender: emp.gender || "",
      hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : "",
      employmentStatus: emp.employmentStatus, department: emp.department || "",
      position: emp.position || "", branchLocation: emp.branchLocation || "",
      reportingManager: emp.reportingManager || "", employmentType: emp.employmentType || "",
      payrollType: emp.payrollType || "", salaryRate: emp.salaryRate?.toString() || "",
      governmentTaxIds: parseJSON<GovernmentTaxIds>(emp.governmentTaxIds, { sss: "", philhealth: "", pagibig: "", tin: "" })!,
      bankDetails: parseJSON<BankDetails>(emp.bankDetails, { bankName: "", accountName: "", accountNumber: "" })!,
      uploadedDocuments: parseJSON<UploadedDocument[]>(emp.uploadedDocuments, [])!,
    });
    setActiveTab("personal");
    setModal("edit");
  }

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setActiveTab("personal");
    setModal("create");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, salaryRate: form.salaryRate ? parseFloat(form.salaryRate) : null };
      const url = modal === "create" ? "/api/employees" : `/api/employees/${selected!.id}`;
      const res = await fetch(url, {
        method: modal === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { showToast("error", (await res.json()).error || "Failed to save"); return; }
      showToast("success", modal === "create" ? "Employee created successfully" : "Employee updated successfully");
      setModal("none");
      fetchEmployees();
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${selected.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("error", "Failed to delete employee"); return; }
      showToast("success", "Employee deleted");
      setModal("none");
      fetchEmployees();
    } finally { setSaving(false); }
  }

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];
  const branches = Array.from(new Set(employees.map((e) => e.branchLocation).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />Employee Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
        <select className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d!}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No employees found</p>
              <p className="text-sm mt-1">Add your first employee to get started</p>
              <Button onClick={openCreate} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Employee</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden sm:table-cell">Department</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden md:table-cell">Position</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden lg:table-cell">Hire Date</th>
                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{emp.fullName}</p>
                            <p className="text-xs text-gray-500">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">{emp.department || "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{emp.position || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[emp.employmentStatus] || STATUS_COLORS.Inactive}`}>
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">{formatDate(emp.hireDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {accountedIds.has(emp.id) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />Account
                            </span>
                          ) : (
                            <button
                              onClick={() => setAccountModal({ emp })}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                              title="Create Login Account"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { setSelected(emp); setModal("view"); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelected(emp); setModal("delete"); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Add New Employee" : `Edit — ${selected?.fullName}`}
          onClose={() => setModal("none")}
          wide
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.employeeId || !form.fullName || !form.email}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : modal === "create" ? "Create Employee" : "Save Changes"}
              </Button>
            </div>
          }
        >
          {/* Tab nav */}
          <div className="flex gap-1 mb-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — passes form + setForm as props so no remount on state change */}
          {activeTab === "personal"     && <PersonalTab     form={form} setForm={setForm} />}
          {activeTab === "employment"   && <EmploymentTab   form={form} setForm={setForm} departments={departments} branches={branches} />}
          {activeTab === "compensation" && <CompensationTab form={form} setForm={setForm} />}
          {activeTab === "government"   && <GovernmentTab   form={form} setForm={setForm} />}
          {activeTab === "documents"    && <DocumentsTab    form={form} setForm={setForm} />}
        </Modal>
      )}

      {/* View Modal */}
      {modal === "view" && selected && (
        <Modal title={selected.fullName} onClose={() => setModal("none")} wide
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>Close</Button>
              <Button onClick={() => openEdit(selected)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit2 className="w-4 h-4 mr-2" />Edit
              </Button>
            </div>
          }>
          <ViewContent emp={selected} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === "delete" && selected && (
        <Modal title="Delete Employee" onClose={() => setModal("none")}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
              <Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
              </Button>
            </div>
          }>
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Delete {selected.fullName}?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This action cannot be undone. All data for employee <span className="font-medium">{selected.employeeId}</span> will be permanently removed.
            </p>
          </div>
        </Modal>
      )}

      {/* Create Account Modal */}
      {accountModal && (
        <CreateAccountModal
          emp={accountModal.emp}
          onClose={() => setAccountModal(null)}
          onSuccess={(empId, _username) => {
            setAccountedIds(prev => { const s = new Set(Array.from(prev)); s.add(empId); return s; });
            // Modal shows success state itself before closing
          }}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
