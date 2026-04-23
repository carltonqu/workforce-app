"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Brain, Lightbulb, RefreshCw, TrendingUp, Users, Wallet, Sparkles, Loader2, 
  ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, AlertTriangle,
  BarChart3, Calendar, Filter, X
} from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Insight = {
  type: "positive" | "neutral" | "negative";
  title: string;
  description: string;
  recommendation: string;
};

type Summary = {
  totalEmployees: number;
  avgAttendance: number;
  avgLateRate: number;
  avgUndertimeRate: number;
};

type Report = {
  insights: Insight[];
  summary: Summary;
  topPerformers: { name: string; department: string; score: number }[];
  needsImprovement: { name: string; department: string; score: number }[];
  departmentPerformance: {
    name: string;
    attendanceRate: number;
    lateRate: number;
    undertimeRate: number;
    attendanceDelta: number;
  }[];
  monthlyTrend: { month: string; attendance: number; lateRate: number; undertimeRate: number }[];
};

type EmployeeMonthlyResponse = {
  employees: { id: string; name: string; department: string; userId: string | null }[];
  selectedEmployee: { id: string; name: string; department: string; userId: string | null } | null;
  trend: { month: string; attendance: number; lateRate: number; undertimeRate: number; score: number; shifts: number }[];
};

type FinanceResponse = {
  employees: { id: string; name: string }[];
  rows: {
    id: string;
    employeeId: string;
    employeeName: string;
    cutoff: string;
    basicPay: number;
    allowances: number;
    deductions: number;
    netPay: number;
  }[];
};

type SortDirection = "asc" | "desc";
type TabKey = "overview" | "employee-month" | "finance";

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  delay = 0,
  hint
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  gradient: string;
  delay?: number;
  hint?: string;
}) {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className={`bg-gradient-to-br ${gradient} p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function deltaColor(delta: number, reversed = false) {
  if (delta === 0) return "text-gray-500";
  const positive = reversed ? delta < 0 : delta > 0;
  return positive ? "text-emerald-600" : "text-red-600";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value || 0);
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDirection,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th className={`py-3 px-4 ${className}`}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 text-left hover:text-gray-900 dark:hover:text-white transition-colors">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        <span className={`text-xs ${active ? "text-blue-600" : "text-gray-300"}`}>{active ? (currentDirection === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

interface AIInsight {
  type: "positive" | "neutral" | "negative";
  title: string;
  description: string;
  recommendation: string;
}

interface FullAIReport {
  insights: AIInsight[];
  summary: {
    period: string;
    totalEmployees: number;
    avgAttendance: number;
    avgLateRate: number;
    avgUndertimeRate: number;
  };
  topPerformers: { name: string; department: string; score: number }[];
  needsImprovement: { name: string; department: string; score: number }[];
  departmentPerformance: { name: string; attendanceRate: number; lateRate: number; undertimeRate: number }[];
}

const INSIGHT_CONFIG: Record<string, { icon: any; gradient: string; bg: string }> = {
  positive: { 
    icon: CheckCircle2, 
    gradient: "from-emerald-500 to-green-500",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
  },
  neutral: { 
    icon: Minus, 
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
  },
  negative: { 
    icon: AlertTriangle, 
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
  },
};

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const config = INSIGHT_CONFIG[insight.type];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl p-4 border ${config.bg} animate-fade-in-up`} style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
          <div className="flex items-start gap-2 mt-3 text-sm">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300"><span className="font-medium">Action:</span> {insight.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIInsightsClient({ userTier }: { userTier: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [aiReport, setAiReport] = useState<FullAIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  
  const isAdvancedTier = userTier === "ADVANCED";

  const [employeeMonthly, setEmployeeMonthly] = useState<EmployeeMonthlyResponse | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [selectedFinanceEmployeeId, setSelectedFinanceEmployeeId] = useState("");

  const [topSort, setTopSort] = useState<{ key: string; dir: SortDirection }>({ key: "score", dir: "desc" });
  const [needsSort, setNeedsSort] = useState<{ key: string; dir: SortDirection }>({ key: "score", dir: "asc" });
  const [deptSort, setDeptSort] = useState<{ key: string; dir: SortDirection }>({ key: "attendanceRate", dir: "desc" });
  const [employeeMonthSort, setEmployeeMonthSort] = useState<{ key: string; dir: SortDirection }>({ key: "month", dir: "asc" });
  const [financeSort, setFinanceSort] = useState<{ key: string; dir: SortDirection }>({ key: "cutoff", dir: "desc" });

  const sortRows = <T extends Record<string, any>>(rows: T[], key: string, dir: SortDirection) => {
    return [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }
      return dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  };

  const handleSort = (
    current: { key: string; dir: SortDirection },
    setCurrent: (value: { key: string; dir: SortDirection }) => void,
    key: string
  ) => {
    if (current.key === key) {
      setCurrent({ key, dir: current.dir === "asc" ? "desc" : "asc" });
      return;
    }
    setCurrent({ key, dir: "asc" });
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/performance/insights", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAIPerformanceInsight = async () => {
    if (!isAdvancedTier) return;
    setAiLoading(true);
    setShowAIReport(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const res = await fetch("/api/admin/performance/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, fullReport: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const fetchEmployeeMonthly = useCallback(async (employeeId?: string) => {
    setEmployeeLoading(true);
    try {
      const query = employeeId ? `?employeeId=${employeeId}` : "";
      const res = await fetch(`/api/admin/performance/employee-monthly${query}`);
      if (!res.ok) return;
      const data: EmployeeMonthlyResponse = await res.json();
      setEmployeeMonthly(data);
      if (!employeeId && data.employees.length > 0) {
        setSelectedEmployeeId((prev) => prev || data.employees[0].id);
      }
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const fetchFinance = useCallback(async (employeeId?: string) => {
    setFinanceLoading(true);
    try {
      const query = employeeId ? `?employeeId=${employeeId}` : "";
      const res = await fetch(`/api/admin/performance/finance-report${query}`);
      if (!res.ok) return;
      const data: FinanceResponse = await res.json();
      setFinance(data);
      if (!employeeId && data.employees.length > 0) {
        setSelectedFinanceEmployeeId((prev) => prev || data.employees[0].id);
      }
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
    fetchEmployeeMonthly();
    fetchFinance();
  }, [fetchReport, fetchEmployeeMonthly, fetchFinance]);

  useEffect(() => {
    if (selectedEmployeeId) fetchEmployeeMonthly(selectedEmployeeId);
  }, [selectedEmployeeId, fetchEmployeeMonthly]);

  useEffect(() => {
    if (selectedFinanceEmployeeId) fetchFinance(selectedFinanceEmployeeId);
  }, [selectedFinanceEmployeeId, fetchFinance]);

  const sortedTop = useMemo(() => sortRows(report?.topPerformers || [], topSort.key, topSort.dir), [report?.topPerformers, topSort]);
  const sortedNeeds = useMemo(() => sortRows(report?.needsImprovement || [], needsSort.key, needsSort.dir), [report?.needsImprovement, needsSort]);
  const sortedDept = useMemo(() => sortRows(report?.departmentPerformance || [], deptSort.key, deptSort.dir), [report?.departmentPerformance, deptSort]);
  const sortedEmployeeTrend = useMemo(() => sortRows(employeeMonthly?.trend || [], employeeMonthSort.key, employeeMonthSort.dir), [employeeMonthly?.trend, employeeMonthSort]);
  const sortedFinance = useMemo(() => sortRows(finance?.rows || [], financeSort.key, financeSort.dir), [finance?.rows, financeSort]);

  if (loading && !report) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardContent className="py-16 text-center text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4 mx-auto">
            <Brain className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          Unable to load AI insights.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-500" />
              AI Workforce Insights
            </h1>
            <Badge className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" /> AI Powered
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Operational health, trend analysis, and payroll visibility in one dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdvancedTier && (
            <Button 
              onClick={generateAIPerformanceInsight} 
              disabled={aiLoading}
              className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/30"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {aiLoading ? "Analyzing..." : "AI Performance Insight"}
            </Button>
          )}
          <Button 
            onClick={fetchReport} 
            variant="outline" 
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {[
          { key: "overview", label: "Overview", icon: TrendingUp },
          { key: "employee-month", label: "Employee Performance", icon: Users },
          { key: "finance", label: "Finance Report", icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* AI Performance Insight Report */}
      {showAIReport && (
        <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up">
          <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">AI Performance Insight Report</CardTitle>
                  <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAIReport(false)} className="rounded-xl">
                <X className="w-4 h-4 mr-1" /> Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing employee performance...</h3>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </div>
            ) : aiReport ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Employees" value={aiReport.summary.totalEmployees} gradient="from-violet-500 to-purple-500" delay={0} />
                  <StatCard icon={CheckCircle2} label="Avg Attendance" value={`${aiReport.summary.avgAttendance}%`} gradient="from-emerald-500 to-green-500" delay={100} />
                  <StatCard icon={AlertTriangle} label="Late Rate" value={`${aiReport.summary.avgLateRate}%`} gradient="from-amber-500 to-orange-500" delay={200} />
                  <StatCard icon={Minus} label="Undertime Rate" value={`${aiReport.summary.avgUndertimeRate}%`} gradient="from-blue-500 to-cyan-500" delay={300} />
                </div>

                {/* Key Insights */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Key Insights & Recommendations
                  </h3>
                  <div className="space-y-3">
                    {aiReport.insights.map((insight, index) => (
                      <InsightCard key={index} insight={insight} index={index} />
                    ))}
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {aiReport.topPerformers.length > 0 && (
                    <Card className="border-gray-100 dark:border-gray-800">
                      <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          Top Performers
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {aiReport.topPerformers.slice(0, 5).map((emp, index) => (
                            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                                  #{index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                                  <p className="text-xs text-gray-500">{emp.department}</p>
                                </div>
                              </div>
                              <span className="text-emerald-600 font-semibold">{emp.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {aiReport.needsImprovement.length > 0 && (
                    <Card className="border-gray-100 dark:border-gray-800">
                      <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          Needs Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {aiReport.needsImprovement.slice(0, 5).map((emp, index) => (
                            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                  #{index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                                  <p className="text-xs text-gray-500">{emp.department}</p>
                                </div>
                              </div>
                              <span className="text-rose-600 font-semibold">{emp.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Department Performance */}
                {aiReport.departmentPerformance.length > 0 && (
                  <Card className="border-gray-100 dark:border-gray-800">
                    <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        Department Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiReport.departmentPerformance.map((dept, index) => (
                          <div key={index} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
                              <span className="text-emerald-600 font-semibold">{dept.attendanceRate}%</span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span className="text-orange-600">{dept.lateRate}% late</span>
                              <span className="text-yellow-600">{dept.undertimeRate}% undertime</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Employees" value={report.summary.totalEmployees} gradient="from-violet-500 to-purple-500" delay={0} hint="Active workforce" />
            <StatCard icon={CheckCircle2} label="Attendance" value={`${report.summary.avgAttendance}%`} gradient="from-emerald-500 to-green-500" delay={100} hint="Monthly average" />
            <StatCard icon={AlertTriangle} label="Late Rate" value={`${report.summary.avgLateRate}%`} gradient="from-amber-500 to-orange-500" delay={200} hint="Schedule adherence" />
            <StatCard icon={Minus} label="Undertime" value={`${report.summary.avgUndertimeRate}%`} gradient="from-blue-500 to-cyan-500" delay={300} hint="Hours missed" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Chart */}
            <Card className="xl:col-span-8 border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Monthly Performance Trend
                </CardTitle>
                <p className="text-xs text-gray-500">Attendance should trend up while late and undertime rates trend down.</p>
              </CardHeader>
              <CardContent className="h-[320px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} width={34} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2.5} dot={false} name="Attendance" />
                    <Line type="monotone" dataKey="lateRate" stroke="#f97316" strokeWidth={2.5} dot={false} name="Late Rate" />
                    <Line type="monotone" dataKey="undertimeRate" stroke="#eab308" strokeWidth={2.5} dot={false} name="Undertime Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card className="xl:col-span-4 border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Key Insights
                </CardTitle>
                <p className="text-xs text-gray-500">Priority findings and recommended actions.</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 max-h-[320px] overflow-auto custom-scrollbar">
                {report.insights.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} index={idx} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <SortHeader label="Employee" sortKey="name" currentKey={topSort.key} currentDirection={topSort.dir} onSort={(key) => handleSort(topSort, setTopSort, key)} />
                        <SortHeader label="Department" sortKey="department" currentKey={topSort.key} currentDirection={topSort.dir} onSort={(key) => handleSort(topSort, setTopSort, key)} />
                        <SortHeader label="Score" sortKey="score" currentKey={topSort.key} currentDirection={topSort.dir} onSort={(key) => handleSort(topSort, setTopSort, key)} className="text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedTop.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{emp.department || "Unassigned"}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">{emp.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <SortHeader label="Employee" sortKey="name" currentKey={needsSort.key} currentDirection={needsSort.dir} onSort={(key) => handleSort(needsSort, setNeedsSort, key)} />
                        <SortHeader label="Department" sortKey="department" currentKey={needsSort.key} currentDirection={needsSort.dir} onSort={(key) => handleSort(needsSort, setNeedsSort, key)} />
                        <SortHeader label="Score" sortKey="score" currentKey={needsSort.key} currentDirection={needsSort.dir} onSort={(key) => handleSort(needsSort, setNeedsSort, key)} className="text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedNeeds.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{emp.department || "Unassigned"}</td>
                          <td className="py-3 px-4 text-right font-semibold text-rose-600">{emp.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <SortHeader label="Department" sortKey="name" currentKey={deptSort.key} currentDirection={deptSort.dir} onSort={(key) => handleSort(deptSort, setDeptSort, key)} />
                      <SortHeader label="Attendance" sortKey="attendanceRate" currentKey={deptSort.key} currentDirection={deptSort.dir} onSort={(key) => handleSort(deptSort, setDeptSort, key)} />
                      <SortHeader label="Late" sortKey="lateRate" currentKey={deptSort.key} currentDirection={deptSort.dir} onSort={(key) => handleSort(deptSort, setDeptSort, key)} />
                      <SortHeader label="Undertime" sortKey="undertimeRate" currentKey={deptSort.key} currentDirection={deptSort.dir} onSort={(key) => handleSort(deptSort, setDeptSort, key)} />
                      <SortHeader label="Vs Prev" sortKey="attendanceDelta" currentKey={deptSort.key} currentDirection={deptSort.dir} onSort={(key) => handleSort(deptSort, setDeptSort, key)} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sortedDept.map((dept, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{dept.name}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">{dept.attendanceRate}%</td>
                        <td className="py-3 px-4 text-orange-600">{dept.lateRate}%</td>
                        <td className="py-3 px-4 text-yellow-600">{dept.undertimeRate}%</td>
                        <td className={`py-3 px-4 font-medium ${deltaColor(dept.attendanceDelta)}`}>{dept.attendanceDelta > 0 ? "+" : ""}{dept.attendanceDelta}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "employee-month" && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Employee Performance by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="max-w-sm">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Select Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select employee</option>
                  {(employeeMonthly?.employees || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
                  ))}
                </select>
              </div>

              <div className="h-[300px] rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={employeeMonthly?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} width={34} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2.5} dot={false} name="Attendance" />
                    <Line type="monotone" dataKey="lateRate" stroke="#f97316" strokeWidth={2.5} dot={false} name="Late Rate" />
                    <Line type="monotone" dataKey="undertimeRate" stroke="#eab308" strokeWidth={2.5} dot={false} name="Undertime Rate" />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <SortHeader label="Month" sortKey="month" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                      <SortHeader label="Attendance" sortKey="attendance" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                      <SortHeader label="Late" sortKey="lateRate" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                      <SortHeader label="Undertime" sortKey="undertimeRate" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                      <SortHeader label="Score" sortKey="score" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                      <SortHeader label="Shifts" sortKey="shifts" currentKey={employeeMonthSort.key} currentDirection={employeeMonthSort.dir} onSort={(key) => handleSort(employeeMonthSort, setEmployeeMonthSort, key)} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(employeeLoading ? [] : sortedEmployeeTrend).map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.month}</td>
                        <td className="py-3 px-4 text-emerald-600">{row.attendance}%</td>
                        <td className="py-3 px-4 text-orange-600">{row.lateRate}%</td>
                        <td className="py-3 px-4 text-yellow-600">{row.undertimeRate}%</td>
                        <td className="py-3 px-4 text-blue-600 font-medium">{row.score}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{row.shifts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Finance Report by Employee & Cutoff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="max-w-sm">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Filter by Employee</label>
                <select
                  value={selectedFinanceEmployeeId}
                  onChange={(e) => setSelectedFinanceEmployeeId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All employees</option>
                  {(finance?.employees || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <SortHeader label="Employee" sortKey="employeeName" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} />
                      <SortHeader label="Cutoff" sortKey="cutoff" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} />
                      <SortHeader label="Basic Pay" sortKey="basicPay" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} className="text-right" />
                      <SortHeader label="Allowances" sortKey="allowances" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} className="text-right" />
                      <SortHeader label="Deductions" sortKey="deductions" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} className="text-right" />
                      <SortHeader label="Net Pay" sortKey="netPay" currentKey={financeSort.key} currentDirection={financeSort.dir} onSort={(key) => handleSort(financeSort, setFinanceSort, key)} className="text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(financeLoading ? [] : sortedFinance).map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.employeeName}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{row.cutoff}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.basicPay)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.allowances)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{formatCurrency(row.deductions)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(row.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
