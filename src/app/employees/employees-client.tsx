"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface GovernmentTaxIds {
  sss: string;
  philhealth: string;
  pagibig: string;
  tin: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface UploadedDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  profilePhoto?: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string; // JSON
  dateOfBirth?: string;
  gender?: string;
  hireDate?: string;
  employmentStatus: string;
  department?: string;
  position?: string;
  branchLocation?: string;
  reportingManager?: string;
  employmentType?: string;
  payrollType?: string;
  salaryRate?: number;
  governmentTaxIds?: string; // JSON
  bankDetails?: string; // JSON
  uploadedDocuments?: string; // JSON
  orgId?: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  employeeId: "",
  fullName: "",
  profilePhoto: "",
  email: "",
  phoneNumber: "",
  address: "",
  emergencyContact: { name: "", relationship: "", phone: "" },
  dateOfBirth: "",
  gender: "",
  hireDate: "",
  employmentStatus: "Active",
  department: "",
  position: "",
  branchLocation: "",
  reportingManager: "",
  employmentType: "",
  payrollType: "",
  salaryRate: "",
  governmentTaxIds: { sss: "", philhealth: "", pagibig: "", tin: "" },
  bankDetails: { bankName: "", accountName: "", accountNumber: "" },
  uploadedDocuments: [] as UploadedDocument[],
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "On Leave": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Terminated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function parseJSON<T>(str?: string, fallback?: T): T | undefined {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
}) {
  return (
    <select className={inputCls} {...props}>
      {children}
    </select>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-600" />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmployeesClient({ user }: { user: any }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Modal state
  const [modal, setModal] = useState<"none" | "create" | "edit" | "view" | "delete">("none");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDept) params.set("department", filterDept);
      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterDept]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // Populate form from employee
  function openEdit(emp: Employee) {
    setSelected(emp);
    setForm({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      profilePhoto: emp.profilePhoto || "",
      email: emp.email,
      phoneNumber: emp.phoneNumber || "",
      address: emp.address || "",
      emergencyContact: parseJSON<EmergencyContact>(emp.emergencyContact, {
        name: "",
        relationship: "",
        phone: "",
      })!,
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "",
      gender: emp.gender || "",
      hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : "",
      employmentStatus: emp.employmentStatus,
      department: emp.department || "",
      position: emp.position || "",
      branchLocation: emp.branchLocation || "",
      reportingManager: emp.reportingManager || "",
      employmentType: emp.employmentType || "",
      payrollType: emp.payrollType || "",
      salaryRate: emp.salaryRate?.toString() || "",
      governmentTaxIds: parseJSON<GovernmentTaxIds>(emp.governmentTaxIds, {
        sss: "",
        philhealth: "",
        pagibig: "",
        tin: "",
      })!,
      bankDetails: parseJSON<BankDetails>(emp.bankDetails, {
        bankName: "",
        accountName: "",
        accountNumber: "",
      })!,
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
      const payload = {
        ...form,
        salaryRate: form.salaryRate ? parseFloat(form.salaryRate as string) : null,
      };

      const url =
        modal === "create"
          ? "/api/employees"
          : `/api/employees/${selected!.id}`;
      const method = modal === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.error || "Failed to save");
        return;
      }

      showToast(
        "success",
        modal === "create" ? "Employee created successfully" : "Employee updated successfully"
      );
      setModal("none");
      fetchEmployees();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${selected.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("error", "Failed to delete employee");
        return;
      }
      showToast("success", "Employee deleted");
      setModal("none");
      fetchEmployees();
    } finally {
      setSaving(false);
    }
  }

  // Unique departments for filter
  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "employment", label: "Employment" },
    { id: "compensation", label: "Compensation" },
    { id: "government", label: "Gov't & Bank" },
    { id: "documents", label: "Documents" },
  ];

  // ─── Form tabs ─────────────────────────────────────────────────────────────

  function PersonalTab() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee ID" required>
          <Input
            placeholder="e.g. EMP-001"
            value={form.employeeId}
            onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
          />
        </Field>
        <Field label="Full Name" required>
          <Input
            placeholder="Juan Dela Cruz"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </Field>
        <Field label="Email Address" required>
          <Input
            type="email"
            placeholder="juan@company.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Phone Number">
          <Input
            placeholder="+63 912 345 6789"
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
          />
        </Field>
        <Field label="Date of Birth">
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          />
        </Field>
        <Field label="Gender">
          <Select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </Select>
        </Field>
        <Field label="Address" required={false}>
          <Input
            placeholder="123 Main St, City, Province"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </Field>
        <Field label="Profile Photo URL">
          <Input
            placeholder="https://..."
            value={form.profilePhoto}
            onChange={(e) => setForm((f) => ({ ...f, profilePhoto: e.target.value }))}
          />
        </Field>

        {/* Emergency Contact */}
        <div className="col-span-full">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 mt-2">
            Emergency Contact
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Name">
              <Input
                placeholder="Maria Dela Cruz"
                value={(form.emergencyContact as EmergencyContact).name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    emergencyContact: { ...(f.emergencyContact as EmergencyContact), name: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Relationship">
              <Input
                placeholder="Spouse / Parent / Sibling"
                value={(form.emergencyContact as EmergencyContact).relationship}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    emergencyContact: { ...(f.emergencyContact as EmergencyContact), relationship: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                placeholder="+63 998 765 4321"
                value={(form.emergencyContact as EmergencyContact).phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    emergencyContact: { ...(f.emergencyContact as EmergencyContact), phone: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  function EmploymentTab() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Hire Date">
          <Input
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
          />
        </Field>
        <Field label="Employment Status">
          <Select
            value={form.employmentStatus}
            onChange={(e) => setForm((f) => ({ ...f, employmentStatus: e.target.value }))}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </Select>
        </Field>
        <Field label="Department">
          <Input
            placeholder="Engineering, HR, Sales..."
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          />
        </Field>
        <Field label="Position / Job Title">
          <Input
            placeholder="Software Engineer"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />
        </Field>
        <Field label="Branch / Location">
          <Input
            placeholder="Head Office / Cebu Branch"
            value={form.branchLocation}
            onChange={(e) => setForm((f) => ({ ...f, branchLocation: e.target.value }))}
          />
        </Field>
        <Field label="Reporting Manager">
          <Input
            placeholder="John Smith"
            value={form.reportingManager}
            onChange={(e) => setForm((f) => ({ ...f, reportingManager: e.target.value }))}
          />
        </Field>
        <Field label="Employment Type">
          <Select
            value={form.employmentType}
            onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
          >
            <option value="">Select type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Probationary">Probationary</option>
            <option value="Freelance">Freelance</option>
          </Select>
        </Field>
      </div>
    );
  }

  function CompensationTab() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Payroll Type">
          <Select
            value={form.payrollType}
            onChange={(e) => setForm((f) => ({ ...f, payrollType: e.target.value }))}
          >
            <option value="">Select payroll type</option>
            <option value="Monthly">Monthly</option>
            <option value="Semi-monthly">Semi-monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
            <option value="Hourly">Hourly</option>
          </Select>
        </Field>
        <Field label="Salary Rate (₱)">
          <Input
            type="number"
            placeholder="0.00"
            value={form.salaryRate}
            onChange={(e) => setForm((f) => ({ ...f, salaryRate: e.target.value }))}
          />
        </Field>
      </div>
    );
  }

  function GovernmentTab() {
    const govIds = form.governmentTaxIds as GovernmentTaxIds;
    const bank = form.bankDetails as BankDetails;
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Government / Tax IDs
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SSS Number">
              <Input
                placeholder="01-2345678-9"
                value={govIds.sss}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    governmentTaxIds: { ...(f.governmentTaxIds as GovernmentTaxIds), sss: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="PhilHealth Number">
              <Input
                placeholder="0001-234567890-1"
                value={govIds.philhealth}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    governmentTaxIds: { ...(f.governmentTaxIds as GovernmentTaxIds), philhealth: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Pag-IBIG / HDMF Number">
              <Input
                placeholder="1234-5678-9012"
                value={govIds.pagibig}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    governmentTaxIds: { ...(f.governmentTaxIds as GovernmentTaxIds), pagibig: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="TIN Number">
              <Input
                placeholder="123-456-789-000"
                value={govIds.tin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    governmentTaxIds: { ...(f.governmentTaxIds as GovernmentTaxIds), tin: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Bank Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Bank Name">
              <Input
                placeholder="BDO, BPI, Metrobank..."
                value={bank.bankName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bankDetails: { ...(f.bankDetails as BankDetails), bankName: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Account Name">
              <Input
                placeholder="Juan Dela Cruz"
                value={bank.accountName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bankDetails: { ...(f.bankDetails as BankDetails), accountName: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Account Number">
              <Input
                placeholder="1234567890"
                value={bank.accountNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bankDetails: { ...(f.bankDetails as BankDetails), accountNumber: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  function DocumentsTab() {
    const docs = form.uploadedDocuments as UploadedDocument[];

    function addDoc() {
      setForm((f) => ({
        ...f,
        uploadedDocuments: [
          ...(f.uploadedDocuments as UploadedDocument[]),
          { name: "", url: "", uploadedAt: new Date().toISOString() },
        ],
      }));
    }

    function removeDoc(idx: number) {
      setForm((f) => ({
        ...f,
        uploadedDocuments: (f.uploadedDocuments as UploadedDocument[]).filter((_, i) => i !== idx),
      }));
    }

    function updateDoc(idx: number, field: keyof UploadedDocument, val: string) {
      setForm((f) => {
        const arr = [...(f.uploadedDocuments as UploadedDocument[])];
        arr[idx] = { ...arr[idx], [field]: val };
        return { ...f, uploadedDocuments: arr };
      });
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Uploaded Documents
          </p>
          <Button size="sm" variant="outline" onClick={addDoc}>
            <Plus className="w-3 h-3 mr-1" />
            Add Document
          </Button>
        </div>
        {docs.length === 0 && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No documents added yet</p>
          </div>
        )}
        {docs.map((doc, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <Field label="Document Name">
              <Input
                placeholder="Resume, NBI Clearance..."
                value={doc.name}
                onChange={(e) => updateDoc(idx, "name", e.target.value)}
              />
            </Field>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Field label="URL / Link">
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={doc.url}
                    onChange={(e) => updateDoc(idx, "url", e.target.value)}
                  />
                </Field>
              </div>
              <button
                onClick={() => removeDoc(idx)}
                className="mb-0.5 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── View modal content ────────────────────────────────────────────────────

  function ViewContent({ emp }: { emp: Employee }) {
    const ec = parseJSON<EmergencyContact>(emp.emergencyContact);
    const gov = parseJSON<GovernmentTaxIds>(emp.governmentTaxIds);
    const bank = parseJSON<BankDetails>(emp.bankDetails);
    const docs = parseJSON<UploadedDocument[]>(emp.uploadedDocuments, []) || [];

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 mt-4 first:mt-0">
          {title}
        </p>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">{children}</div>
      </div>
    );

    const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
          {value ?? "—"}
        </span>
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
          <Row
            label="Salary Rate"
            value={emp.salaryRate ? `₱${emp.salaryRate.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : undefined}
          />
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
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    );
  }

  // ─── Modal shell ───────────────────────────────────────────────────────────

  function Modal({
    title,
    onClose,
    children,
    footer,
    wide,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    wide?: boolean;
  }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${
            wide ? "max-w-2xl" : "max-w-md"
          } max-h-[90vh] flex flex-col`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">{footer}</div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employee Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
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
        <select
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
        <select
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d!}>
              {d}
            </option>
          ))}
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
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                      Employee
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden sm:table-cell">
                      Department
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden md:table-cell">
                      Position
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden lg:table-cell">
                      Hire Date
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {emp.profilePhoto ? (
                            <img
                              src={emp.profilePhoto}
                              alt={emp.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {emp.fullName}
                            </p>
                            <p className="text-xs text-gray-500">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {emp.department || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {emp.position || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[emp.employmentStatus] || STATUS_COLORS.Inactive
                          }`}
                        >
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(emp.hireDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelected(emp);
                              setModal("view");
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(emp);
                              setModal("delete");
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete"
                          >
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

      {/* ─── Create / Edit Modal ───────────────────────────────────────────── */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Add New Employee" : `Edit — ${selected?.fullName}`}
          onClose={() => setModal("none")}
          wide
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.employeeId || !form.fullName || !form.email}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : modal === "create" ? (
                  "Create Employee"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          }
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "personal" && <PersonalTab />}
          {activeTab === "employment" && <EmploymentTab />}
          {activeTab === "compensation" && <CompensationTab />}
          {activeTab === "government" && <GovernmentTab />}
          {activeTab === "documents" && <DocumentsTab />}
        </Modal>
      )}

      {/* ─── View Modal ────────────────────────────────────────────────────── */}
      {modal === "view" && selected && (
        <Modal
          title={selected.fullName}
          onClose={() => setModal("none")}
          wide
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>
                Close
              </Button>
              <Button
                onClick={() => openEdit(selected)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          }
        >
          <ViewContent emp={selected} />
        </Modal>
      )}

      {/* ─── Delete Confirm ────────────────────────────────────────────────── */}
      {modal === "delete" && selected && (
        <Modal
          title="Delete Employee"
          onClose={() => setModal("none")}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModal("none")}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">
              Delete {selected.fullName}?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This action cannot be undone. All data for employee{" "}
              <span className="font-medium">{selected.employeeId}</span> will be permanently
              removed.
            </p>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
