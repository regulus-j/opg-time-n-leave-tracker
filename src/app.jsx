import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import "./index.css";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import {
  applyAttendanceDecision,
  applyLeaveDecision,
  availableToRequest,
  chargeableDays,
  csvEscape,
  directReportIds,
  eligibleLeaveTypes,
  remainingBalance,
  validateLeaveRequest,
  wouldCreateManagerCycle,
} from "./domain/rules";

const DEMO_USERS = {
  "employee@tracker.demo": {
    password: "employee2026",
    name: "Alex Morgan",
    employeeId: "alex",
    role: "Employee",
  },
  "manager@tracker.demo": {
    password: "manager2026",
    name: "Jamie Chen",
    employeeId: "jamie",
    role: "Reporting Manager",
  },
  "hr@tracker.demo": {
    password: "hr2026",
    name: "Maya Patel",
    employeeId: "maya",
    role: "HR Admin",
  },
};
const seed = {
  tenant: {
    id: "tenant-main",
    name: "Northstar Operations",
    timezone: "Asia/Singapore",
    weekStart: 1,
  },
  people: [
    {
      id: "alex",
      name: "Alex Morgan",
      email: "employee@tracker.demo",
      jobId: "designer",
      job: "Product Designer",
      department: "Product",
      managerId: "jamie",
      status: "active",
      schedule: { daily: 480, weekly: 2400 },
    },
    {
      id: "priya",
      name: "Priya Shah",
      email: "priya@tracker.demo",
      jobId: "engineer",
      job: "Engineer",
      department: "Engineering",
      managerId: "jamie",
      status: "active",
      schedule: { daily: 480, weekly: 2400 },
    },
    {
      id: "jamie",
      name: "Jamie Chen",
      email: "manager@tracker.demo",
      jobId: "lead",
      job: "Design Lead",
      department: "Product",
      managerId: "maya",
      status: "active",
      schedule: { daily: 480, weekly: 2400 },
    },
    {
      id: "maya",
      name: "Maya Patel",
      email: "hr@tracker.demo",
      jobId: "vp",
      job: "VP Product",
      department: "Leadership",
      managerId: null,
      status: "active",
      schedule: { daily: 480, weekly: 2400 },
    },
  ],
  jobs: [
    {
      id: "designer",
      title: "Product Designer",
      standardDaily: 480,
      standardWeekly: 2400,
      maxDaily: 720,
      otEligible: true,
      department: "Product",
      active: true,
    },
    {
      id: "engineer",
      title: "Engineer",
      standardDaily: 480,
      standardWeekly: 2400,
      maxDaily: 720,
      otEligible: true,
      department: "Engineering",
      active: true,
    },
    {
      id: "lead",
      title: "Design Lead",
      standardDaily: 480,
      standardWeekly: 2400,
      maxDaily: 720,
      otEligible: true,
      department: "Product",
      active: true,
    },
    {
      id: "vp",
      title: "VP Product",
      standardDaily: 480,
      standardWeekly: 2400,
      maxDaily: null,
      otEligible: false,
      department: "Leadership",
      active: true,
    },
  ],
  leaveTypes: [
    {
      id: "vacation",
      name: "Vacation",
      color: "bg-blue-100 text-blue-800",
      paid: true,
    },
    {
      id: "sick",
      name: "Sick Leave",
      color: "bg-red-100 text-red-800",
      paid: true,
      documentationAfter: 2,
    },
    {
      id: "personal",
      name: "Personal",
      color: "bg-amber-100 text-amber-800",
      paid: false,
    },
  ],
  policies: [
    {
      id: "p1",
      jobId: "designer",
      leaveTypeId: "vacation",
      annual: 18,
      carry: 5,
      allowNegative: false,
    },
    {
      id: "p2",
      jobId: "designer",
      leaveTypeId: "sick",
      annual: 10,
      carry: 0,
      allowNegative: false,
    },
    {
      id: "p3",
      jobId: "designer",
      leaveTypeId: "personal",
      annual: 3,
      carry: 0,
      allowNegative: false,
    },
    {
      id: "p4",
      jobId: "engineer",
      leaveTypeId: "vacation",
      annual: 18,
      carry: 5,
      allowNegative: false,
    },
    {
      id: "p5",
      jobId: "engineer",
      leaveTypeId: "sick",
      annual: 10,
      carry: 0,
      allowNegative: false,
    },
  ],
  balances: {
    alex: {
      vacation: { accrued: 18, used: 3, pending: 5, carry: 2 },
      sick: { accrued: 10, used: 1, pending: 0, carry: 0 },
      personal: { accrued: 3, used: 0, pending: 0, carry: 0 },
    },
    priya: {
      vacation: { accrued: 18, used: 6, pending: 0, carry: 1 },
      sick: { accrued: 10, used: 0, pending: 0, carry: 0 },
    },
    jamie: {
      vacation: { accrued: 18, used: 4, pending: 0, carry: 2 },
      sick: { accrued: 10, used: 1, pending: 0, carry: 0 },
    },
    maya: { vacation: { accrued: 20, used: 2, pending: 0, carry: 0 } },
  },
  attendance: [
    {
      id: "a1",
      employeeId: "alex",
      date: "2026-09-14",
      start: "09:00",
      end: "17:30",
      minutes: 510,
      status: "complete",
    },
    {
      id: "a2",
      employeeId: "alex",
      date: "2026-09-15",
      start: "08:55",
      end: null,
      minutes: 0,
      status: "missing_punch",
    },
    {
      id: "a3",
      employeeId: "priya",
      date: "2026-09-15",
      start: "09:15",
      end: "16:00",
      minutes: 405,
      status: "below_standard",
    },
    {
      id: "a4",
      employeeId: "jamie",
      date: "2026-09-15",
      start: "08:45",
      end: "18:00",
      minutes: 555,
      status: "complete",
    },
  ],
  leave: [
    {
      id: "l1",
      employeeId: "alex",
      type: "vacation",
      from: "2026-10-12",
      to: "2026-10-16",
      days: 5,
      reason: "Family trip",
      status: "pending",
      history: ["Submitted Sep 10"],
    },
    {
      id: "l2",
      employeeId: "priya",
      type: "vacation",
      from: "2026-09-28",
      to: "2026-10-02",
      days: 5,
      reason: "Rest and travel",
      status: "pending",
      history: ["Submitted Sep 11"],
    },
    {
      id: "l3",
      employeeId: "jamie",
      type: "vacation",
      from: "2026-10-12",
      to: "2026-10-16",
      days: 5,
      reason: "Time away",
      status: "approved",
      history: ["Approved Sep 5"],
    },
  ],
  adjustments: [
    {
      id: "adj1",
      employeeId: "priya",
      date: "2026-09-12",
      proposed: "09:00–17:00",
      reason: "Forgot to clock out",
      status: "pending",
    },
  ],
  holidays: [
    { id: "h1", date: "2026-10-26", name: "Deepavali", type: "public" },
    { id: "h2", date: "2026-12-25", name: "Christmas Day", type: "public" },
  ],
  audit: [],
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const today = "2026-09-15";
const fmt = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const dayCount = (from, to) =>
  Math.max(
    0,
    Math.floor(
      (new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000,
    ) + 1,
  );
const initials = (name) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
const saveData = (data) =>
  localStorage.setItem("tlt-data-v1:tenant-main", JSON.stringify(data));
const loadData = () => {
  try {
    const value = JSON.parse(
      localStorage.getItem("tlt-data-v1:tenant-main") || "null",
    );
    return value?.people && value?.tenant?.id === seed.tenant.id
      ? value
      : clone(seed);
  } catch {
    return clone(seed);
  }
};
const typeName = (data, id) =>
  data.leaveTypes.find((x) => x.id === id)?.name || id;
const directReports = (data, id) =>
  data.people.filter((p) => p.managerId === id);
const isHR = (role) => role === "HR Admin";

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "forgot") {
      setMessage("If an account exists, reset instructions have been sent.");
      return;
    }
    if (mode === "reset") {
      if (password.length < 8) return setError("Use at least 8 characters.");
      setMode("login");
      setMessage("Password updated. Sign in with your new password.");
      return;
    }
    const user = DEMO_USERS[email.trim().toLowerCase()];
    if (!user || user.password !== password)
      return setError("We could not sign you in with those details.");
    const scopedUser = { ...user, tenantId: seed.tenant.id };
    localStorage.setItem("tlt-session-v1", JSON.stringify(scopedUser));
    onLogin(scopedUser);
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              T
            </div>
            <div>
              <CardTitle>Time & Leave Tracker</CardTitle>
              <CardDescription>
                Work time, attendance, and leave in one place.
              </CardDescription>
            </div>
          </div>
          <CardTitle>
            {mode === "login"
              ? "Welcome back"
              : mode === "forgot"
                ? "Reset your password"
                : "Choose a new password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode !== "reset" && (
              <label className="block text-sm font-medium">
                Email
                <input
                  aria-label="Email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-11 w-full rounded-md border bg-background px-3"
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label className="block text-sm font-medium">
                Password
                <input
                  aria-label="Password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-11 w-full rounded-md border bg-background px-3"
                />
              </label>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                {message}
              </p>
            )}
            <Button className="h-11 w-full">
              {mode === "login"
                ? "Sign in"
                : mode === "forgot"
                  ? "Send reset instructions"
                  : "Update password"}
            </Button>
          </form>
          <div className="mt-5 flex justify-between text-sm">
            <button
              className="text-primary underline"
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setMode(mode === "login" ? "forgot" : "login");
              }}
            >
              {mode === "login" ? "Forgot password?" : "Back to sign in"}
            </button>
            {mode === "forgot" && (
              <button
                className="text-primary underline"
                type="button"
                onClick={() => setMode("reset")}
              >
                Use reset code
              </button>
            )}
          </div>
          <div className="mt-6 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            <b className="text-foreground">Demo accounts</b>
            <p>employee@tracker.demo / employee2026</p>
            <p>manager@tracker.demo / manager2026</p>
            <p>hr@tracker.demo / hr2026</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Header({ user, role, setRole, onSignOut, onReset }) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-background px-4 py-3 md:px-8">
      <div>
        <p className="text-xs text-muted-foreground">
          {seed.tenant.name} · {seed.tenant.timezone}
        </p>
        <h1 className="font-semibold">
          Good morning, {user.name.split(" ")[0]}
        </h1>
        <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
          Prototype · mock data only
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Current workspace"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-md border bg-background px-2 text-xs font-medium"
        >
          <option>Employee</option>
          <option>Reporting Manager</option>
          <option>HR Admin</option>
        </select>
        <Button
          variant="outline"
          size="icon"
          title="Reset demo data"
          onClick={onReset}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Sign out"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
function SideNav({ role, page, go, team }) {
  const employee = [
    ["Dashboard", "Dashboard"],
    ["My Attendance", "Attendance"],
    ["Leave", "Leave"],
    ["Holiday Calendar", "Holidays"],
    ["Profile", "Profile"],
  ];
  const manager = [
    ["Team Dashboard", "Dashboard"],
    ["Approvals", "Approvals"],
    ["Who's In", "WhosIn"],
    ["Team Leave Calendar", "TeamCalendar"],
    ["Overtime & Alerts", "Alerts"],
  ];
  const hr = [
    ["Organization Dashboard", "Dashboard"],
    ["Job Profiles", "Jobs"],
    ["Leave Policy Mapping", "Policies"],
    ["Directory", "Directory"],
    ["Overrides", "Overrides"],
    ["Approvals", "Approvals"],
    ["Master Reports", "Reports"],
    ["Holidays", "Holidays"],
  ];
  const items =
    role === "HR Admin"
      ? hr
      : role === "Reporting Manager" && team
        ? manager
        : employee;
  return (
    <nav className="space-y-1 p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
          T
        </div>
        <b>Time & Leave</b>
      </div>
      <p className="mb-2 px-2 text-xs text-muted-foreground">
        {role}
        {role === "Reporting Manager" && ` · ${team ? "Team" : "Myself"}`}
      </p>
      {items.map(([label, value]) => (
        <Button
          key={value}
          title={`Open ${label}`}
          variant={page === value ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => go(value)}
        >
          {label === "Dashboard" ? (
            <Clock3 className="mr-2 h-4 w-4" />
          ) : label === "Approvals" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : label.includes("Calendar") ||
            label === "Leave" ||
            label === "Holidays" ? (
            <CalendarDays className="mr-2 h-4 w-4" />
          ) : label === "Directory" || label === "Who's In" ? (
            <Users className="mr-2 h-4 w-4" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      ))}
    </nav>
  );
}
const Shell = ({
  children,
  user,
  role,
  setRole,
  team,
  setTeam,
  page,
  go,
  onSignOut,
  onReset,
}) => (
  <div className="min-h-screen">
    <aside className="fixed inset-y-0 hidden w-64 border-r bg-background md:block">
      <SideNav role={role} page={page} go={go} team={team} />
    </aside>
    <main className="md:pl-64">
      <Header
        user={user}
        role={role}
        setRole={setRole}
        onSignOut={onSignOut}
        onReset={onReset}
      />
      {role === "Reporting Manager" && (
        <div className="border-b bg-muted/30 px-4 py-2 md:px-8">
          <div className="mx-auto flex max-w-7xl gap-2">
            <Button
              size="sm"
              variant={!team ? "secondary" : "outline"}
              onClick={() => {
                setTeam(false);
                go("Dashboard");
              }}
            >
              Myself
            </Button>
            <Button
              size="sm"
              variant={team ? "secondary" : "outline"}
              onClick={() => {
                setTeam(true);
                go("Dashboard");
              }}
            >
              Team
            </Button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">{children}</div>
    </main>
  </div>
);
const Head = ({ title, desc, action }) => (
  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
    {action}
  </div>
);
const Empty = ({ text }) => (
  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
    {text}
  </div>
);
const Metric = ({ label, value, detail }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{label}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </CardContent>
  </Card>
);
const Status = ({ children, tone = "outline" }) => (
  <Badge variant={tone}>{children}</Badge>
);

function EmployeeDashboard({ data, person, running, setRunning, onNavigate }) {
  const rows = data.attendance.filter((x) => x.employeeId === person.id);
  const mins = rows.reduce((a, x) => a + x.minutes, 0);
  const job = data.jobs.find((x) => x.id === person.jobId);
  const limit = job?.maxDaily;
  const todayRow = rows.find((x) => x.date === today);
  const percent = limit
    ? Math.min(
        100,
        Math.round(((todayRow?.minutes || (running ? 60 : 0)) / limit) * 100),
      )
    : 0;
  return (
    <>
      <Head
        title="Your action dashboard"
        desc="Keep time, attendance, and leave in sync."
        action={
          <Button variant="outline" onClick={() => onNavigate("Attendance")}>
            View attendance <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />
      <Card className="overflow-hidden bg-primary text-primary-foreground">
        <div className="grid gap-6 p-6 md:grid-cols-[1.35fr_1fr] md:p-8">
          <div>
            <p className="text-sm text-primary-foreground/75">
              Personal workspace
            </p>
            <h3 className="mt-2 text-3xl font-semibold">
              Make your time count.
            </h3>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
              Clock your work and stay ahead of exceptions before they become a
              problem.
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => setRunning(!running)}
            >
              {running ? "Clock Out" : "Clock In"}{" "}
              <span className="ml-2 font-mono">
                {running ? "00:01:00" : "00:00:00"}
              </span>
            </Button>
          </div>
          <div className="rounded-lg bg-accent p-5 text-accent-foreground">
            <p className="text-sm font-medium">Daily limit</p>
            {limit ? (
              <>
                <div className="mt-3 flex items-center gap-5">
                  <div
                    className="relative flex h-28 w-28 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#ffdd9c ${percent * 3.6}deg, rgba(255,255,255,.25) 0deg)`,
                    }}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold">
                      {percent}%
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {Math.round((todayRow?.minutes || 0) / 60)}h
                    </p>
                    <p className="text-sm">
                      of {Math.round(limit / 60)}h maximum
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs">
                  {percent >= 80
                    ? "Approaching your hard daily limit."
                    : "You are within today's limit."}
                </p>
              </>
            ) : (
              <p className="mt-5 text-sm">
                No daily hard limit is configured for this job.
              </p>
            )}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Hours this week"
          value={`${(mins / 60).toFixed(1)}h`}
          detail="Recorded attendance"
        />
        <Metric
          label="Leave remaining"
          value={`${Object.values(data.balances[person.id] || {}).reduce((a, b) => a + b.accrued + b.carry - b.used - b.pending, 0)} days`}
          detail="Across eligible types"
        />
        <Metric
          label="Pending requests"
          value={
            data.leave.filter(
              (x) => x.employeeId === person.id && x.status === "pending",
            ).length
          }
          detail="Awaiting review"
        />
        <Metric
          label="Exceptions"
          value={rows.filter((x) => x.status !== "complete").length}
          detail="Need your attention"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>Attendance status and next action</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRow ? (
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <b>
                    {todayRow.start}
                    {todayRow.end ? ` – ${todayRow.end}` : " – open session"}
                  </b>
                  <p className="text-sm text-muted-foreground">
                    {todayRow.status === "missing_punch"
                      ? "Missing punch requires an adjustment."
                      : `${Math.round((todayRow.minutes / 60) * 10) / 10} hours recorded.`}
                  </p>
                </div>
                <Status
                  tone={
                    todayRow.status === "complete" ? "secondary" : "destructive"
                  }
                >
                  {todayRow.status.replace("_", " ")}
                </Status>
              </div>
            ) : (
              <Empty text="No attendance recorded today." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.balances[person.id] || {}).map(([id, b]) => (
              <div key={id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{typeName(data, id)}</span>
                  <b>{b.accrued + b.carry - b.used - b.pending} days</b>
                </div>
                <Progress
                  value={((b.used + b.pending) / (b.accrued + b.carry)) * 100}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Attendance({ data, person, setData, notify }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const monthDate = new Date(Date.UTC(2026, 8 + monthOffset, 1));
  const month = monthDate.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const monthKey = monthDate.toISOString().slice(0, 7);
  const daysInMonth = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: today,
    start: "09:00",
    end: "17:00",
    reason: "",
  });
  const rows = data.attendance.filter((x) => x.employeeId === person.id);
  const submit = (e) => {
    e.preventDefault();
    if (
      !form.reason.trim() ||
      !form.start ||
      !form.end ||
      form.end <= form.start
    )
      return notify("Enter corrected times and a reason.");
    setData((d) => ({
      ...d,
      adjustments: [
        ...d.adjustments,
        {
          id: `adj${Date.now()}`,
          employeeId: person.id,
          date: form.date,
          proposed: `${form.start}–${form.end}`,
          reason: form.reason,
          status: "pending",
        },
      ],
    }));
    setOpen(false);
    notify("Attendance adjustment submitted for manager review.");
  };
  return (
    <>
      <Head
        title="My Attendance"
        desc="Review worked time, exceptions, and adjustments."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Attendance Adjustment
          </Button>
        }
      />
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setMonthOffset((value) => value - 1)}
        >
          Previous month
        </Button>
        <b>{month}</b>
        <Button
          variant="outline"
          onClick={() => setMonthOffset((value) => value + 1)}
        >
          Next month
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance calendar</CardTitle>
          <CardDescription>
            Red states indicate a missing punch or missed standard hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            aria-label={`${month} attendance calendar`}
            className="grid grid-cols-7 gap-1 rounded-lg border bg-muted/20 p-2"
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const date = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
              const row = rows.find((item) => item.date === date);
              const exception = row && row.status !== "complete";
              return (
                <div
                  key={date}
                  className={`min-h-12 rounded-md border p-2 text-xs ${exception ? "border-red-300 bg-red-50 text-red-800" : row ? "bg-emerald-50 text-emerald-800" : "bg-background"}`}
                  title={row ? `${date}: ${row.status}` : `${date}: no record`}
                >
                  <span className="font-medium">{index + 1}</span>
                  {row && (
                    <span className="mt-1 block">
                      {row.minutes
                        ? `${Math.round((row.minutes / 60) * 10) / 10}h`
                        : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {[
            ...rows,
            ...(monthKey === "2026-09"
              ? [
                  {
                    id: "empty",
                    date: "2026-09-11",
                    status: "below_standard",
                    minutes: 360,
                    start: "10:00",
                    end: "16:00",
                  },
                ]
              : []),
          ].map((row) => (
            <div
              key={row.id}
              className={`flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between ${row.status !== "complete" ? "border-red-300 bg-red-50" : ""}`}
            >
              <div>
                <b>{fmt(row.date)}</b>
                <p className="text-sm text-muted-foreground">
                  {row.start || "No punch"}{" "}
                  {row.end ? `– ${row.end}` : "– missing punch"} ·{" "}
                  {row.minutes
                    ? `${Math.round((row.minutes / 60) * 10) / 10}h worked`
                    : "No approved duration"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Status
                  tone={row.status === "complete" ? "secondary" : "destructive"}
                >
                  {row.status === "complete"
                    ? "Complete"
                    : row.status === "missing_punch"
                      ? "Missing punch"
                      : "Below standard"}
                </Status>
                {row.status !== "complete" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({ ...form, date: row.date });
                      setOpen(true);
                    }}
                  >
                    Correct
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {open && (
        <Dialog
          title="Submit attendance adjustment"
          close={() => setOpen(false)}
        >
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Date
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Corrected in
                <input
                  required
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
              <label className="text-sm font-medium">
                Corrected out
                <input
                  required
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Reason
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 h-24 w-full rounded-md border p-3"
                placeholder="Explain what needs correcting and why."
              />
            </label>
            <Button className="w-full">Submit for approval</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}

function Leave({ data, person, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "vacation",
    from: "",
    to: "",
    reason: "",
    file: null,
  });
  const balance = data.balances[person.id] || {};
  const eligible = eligibleLeaveTypes(data, person);
  const selected = data.leaveTypes.find((x) => x.id === form.type);
  const days = chargeableDays(form.from, form.to, data.holidays);
  const requiresDoc =
    selected?.documentationAfter && days > selected.documentationAfter;
  const submit = (e) => {
    e.preventDefault();
    const validation = validateLeaveRequest({
      data,
      employee: person,
      typeId: form.type,
      from: form.from,
      to: form.to,
      reason: form.reason,
      hasAttachment: Boolean(form.file),
    });
    if (!validation.valid) return notify(validation.errors[0]);
    const b = balance[form.type];
    const available = b ? b.accrued + b.carry - b.used - b.pending : 0;
    if (!form.from || !form.to || days <= 0 || !form.reason.trim())
      return notify("Choose dates and provide a reason.");
    if (
      data.leave.some(
        (x) =>
          x.employeeId === person.id &&
          x.status !== "rejected" &&
          form.from <= x.to &&
          form.to >= x.from,
      )
    )
      return notify("This request overlaps another leave request.");
    if (days > available)
      return notify(`Only ${available} day(s) remain for this leave type.`);
    if (requiresDoc && !form.file)
      return notify("Documentation is required for this request.");
    setData((d) => ({
      ...d,
      leave: [
        {
          id: `l${Date.now()}`,
          employeeId: person.id,
          type: form.type,
          from: form.from,
          to: form.to,
          days,
          reason: form.reason,
          status: "pending",
          attachment: form.file?.name || null,
          history: ["Submitted today"],
        },
        ...d.leave,
      ],
    }));
    setOpen(false);
    notify("Leave request submitted.");
  };
  return (
    <>
      <Head
        title="Leave Management"
        desc="Balances, requests, history, and approved time away."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(balance).map(([id, b]) => {
          const remaining = b.accrued + b.carry - b.used - b.pending;
          return (
            <Card key={id}>
              <CardHeader>
                <CardDescription>{typeName(data, id)}</CardDescription>
                <CardTitle>{remaining} days remaining</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Accrued {b.accrued} · Used {b.used} · Pending {b.pending} ·
                Carry-over {b.carry}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.leave
            .filter((x) => x.employeeId === person.id)
            .map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <b>
                    {typeName(data, item.type)} · {fmt(item.from)} –{" "}
                    {fmt(item.to)}
                  </b>
                  <p className="text-sm text-muted-foreground">
                    {item.days} day(s) · {item.reason}
                    {item.attachment && ` · ${item.attachment}`}
                  </p>
                </div>
                <Status
                  tone={
                    item.status === "approved"
                      ? "secondary"
                      : item.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {item.status}
                </Status>
              </div>
            ))}
        </CardContent>
      </Card>
      {open && (
        <Dialog title="Request leave" close={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Leave type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                {eligible.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                From
                <input
                  required
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
              <label className="text-sm font-medium">
                To
                <input
                  required
                  type="date"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
            </div>
            <p className="rounded-md bg-muted p-3 text-sm">
              Projected charge: <b>{days || 0} day(s)</b>.{" "}
              {requiresDoc
                ? "Documentation is required because this request exceeds the policy threshold."
                : "No documentation is required for this duration."}
            </p>
            <label className="block text-sm font-medium">
              Reason
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 h-20 w-full rounded-md border p-3"
              />
            </label>
            {requiresDoc && (
              <label className="block text-sm font-medium">
                Supporting document
                <input
                  required
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setForm({ ...form, file: e.target.files?.[0] || null })
                  }
                  className="mt-1 block w-full rounded-md border p-2 text-sm"
                />
              </label>
            )}
            <Button className="w-full">Submit request</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}

function Holidays({ data, hr = false, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", name: "" });
  const add = (e) => {
    e.preventDefault();
    if (!form.date || !form.name) return;
    if (
      data.holidays.some(
        (holiday) => holiday.date === form.date && holiday.active !== false,
      )
    )
      return notify("A holiday already exists on that date.");
    setData((d) => ({
      ...d,
      holidays: [
        ...d.holidays,
        {
          id: `h${Date.now()}`,
          date: form.date,
          name: form.name,
          type: "company",
          active: true,
        },
      ],
    }));
    setOpen(false);
    notify("Holiday saved.");
  };
  return (
    <>
      <Head
        title="Holiday Calendar"
        desc={
          hr
            ? "Manage tenant public and company holidays."
            : "Tenant-specific holidays are read-only here."
        }
        action={
          hr && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add holiday
            </Button>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Northstar holiday calendar</CardTitle>
          <CardDescription>
            Applicable public holidays in the tenant time zone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.holidays
            .filter((holiday) => hr || holiday.active !== false)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((h) => (
              <div
                className="flex items-center justify-between rounded-md border p-4"
                key={h.id}
              >
                <div>
                  <b>{h.name}</b>
                  <p className="text-sm text-muted-foreground">{fmt(h.date)}</p>
                </div>
                {hr ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setData((d) => ({
                        ...d,
                        holidays: d.holidays.map((x) =>
                          x.id === h.id
                            ? { ...x, active: x.active === false }
                            : x,
                        ),
                      }));
                      notify(
                        h.active === false
                          ? "Holiday activated."
                          : "Holiday deactivated.",
                      );
                    }}
                  >
                    {h.active === false ? "Activate" : "Deactivate"}
                  </Button>
                ) : (
                  <Status tone="secondary">{h.type}</Status>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
      {open && (
        <Dialog title="Add holiday" close={() => setOpen(false)}>
          <form onSubmit={add} className="space-y-4">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-10 w-full rounded-md border px-3"
            />
            <input
              required
              placeholder="Holiday name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full rounded-md border px-3"
            />
            <Button className="w-full">Save holiday</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}

function Approvals({ data, scope, setData, notify }) {
  const [filter, setFilter] = useState("all");
  const [note, setNote] = useState("");
  const reports = data.people.filter((p) => scope.includes(p.id));
  const rows = [
    ...data.leave
      .filter(
        (x) =>
          x.status === "pending" && reports.some((p) => p.id === x.employeeId),
      )
      .map((x) => ({ ...x, kind: "Leave Request" })),
    ...data.adjustments
      .filter(
        (x) =>
          x.status === "pending" && reports.some((p) => p.id === x.employeeId),
      )
      .map((x) => ({ ...x, kind: "Attendance Adjustment" })),
  ].filter((x) => filter === "all" || x.kind === filter);
  const decide = (item, status) => {
    if (item.kind === "Leave Request")
      setData((d) => applyLeaveDecision(d, item.id, status, note));
    else setData((d) => applyAttendanceDecision(d, item.id, status, note));
    setNote("");
    notify(item.kind + " " + status);
  };
  return (
    <>
      <Head
        title="Approvals Inbox"
        desc="Review pending leave and attendance items from direct reports."
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "secondary" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === "Leave Request" ? "secondary" : "outline"}
          onClick={() => setFilter("Leave Request")}
        >
          Leave
        </Button>
        <Button
          size="sm"
          variant={filter === "Attendance Adjustment" ? "secondary" : "outline"}
          onClick={() => setFilter("Attendance Adjustment")}
        >
          Attendance
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-3 p-0">
          {rows.length ? (
            rows.map((item) => {
              const person = data.people.find((p) => p.id === item.employeeId);
              return (
                <div className="border-b p-5 last:border-0" key={item.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <b>{person?.name}</b>
                        <Status>{item.kind}</Status>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.kind === "Leave Request"
                          ? `${typeName(data, item.type)} · ${fmt(item.from)} – ${fmt(item.to)} · ${item.days} day(s)`
                          : `${fmt(item.date)} · Proposed ${item.proposed}`}
                      </p>
                      <p className="mt-2 text-sm">
                        <b>Reason:</b> {item.reason}
                      </p>
                      {item.kind === "Leave Request" && (
                        <p className="text-sm text-muted-foreground">
                          Current balance:{" "}
                          {data.balances[item.employeeId]?.[item.type]
                            ? data.balances[item.employeeId][item.type]
                                .accrued +
                              data.balances[item.employeeId][item.type].carry -
                              data.balances[item.employeeId][item.type].used
                            : 0}{" "}
                          days
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
                      <textarea
                        aria-label={`Decision note for ${item.id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional decision note"
                        className="h-10 flex-1 rounded-md border p-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide(item, "rejected")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => decide(item, "approved")}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty text="All caught up. No pending items in your scope." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function WhosIn({ data, scope }) {
  const now = data.people.filter((p) => scope.includes(p.id));
  return (
    <>
      <Head
        title="Who's In"
        desc="Current direct-report presence in the tenant time zone."
      />
      <Card>
        <CardContent className="divide-y p-0">
          {now.map((p) => {
            const leave = data.leave.some(
              (x) =>
                x.employeeId === p.id &&
                x.status === "approved" &&
                x.from <= today &&
                x.to >= today,
            );
            const open = data.attendance.some(
              (x) => x.employeeId === p.id && x.date === today && !x.end,
            );
            const status = leave
              ? "On Leave"
              : open
                ? "Clocked In"
                : "Clocked Out";
            return (
              <div className="flex items-center justify-between p-5" key={p.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    {initials(p.name)}
                  </div>
                  <div>
                    <b>{p.name}</b>
                    <p className="text-sm text-muted-foreground">
                      {p.job} · {p.department}
                    </p>
                  </div>
                </div>
                <Status
                  tone={
                    status === "Clocked In"
                      ? "secondary"
                      : status === "On Leave"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {status}
                </Status>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

function TeamCalendar({ data, scope }) {
  const [showPending, setShowPending] = useState(false);
  const items = data.leave.filter(
    (x) =>
      scope.includes(x.employeeId) &&
      (x.status === "approved" || (showPending && x.status === "pending")),
  );
  const overlaps = new Set(
    items.flatMap((item, index) =>
      items
        .slice(index + 1)
        .filter((other) => item.from <= other.to && item.to >= other.from)
        .flatMap((other) => [item.id, other.id]),
    ),
  );
  return (
    <>
      <Head
        title="Team Leave Calendar"
        desc="Approved upcoming leave and coverage visibility."
      />
      <Button
        variant="outline"
        onClick={() => setShowPending((value) => !value)}
      >
        {showPending ? "Hide pending requests" : "Show pending requests"}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming approved leave</CardTitle>
          <CardDescription>
            Overlapping leave is highlighted for staffing review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length ? (
            items.map((x) => (
              <div
                className="flex items-center justify-between rounded-md border p-4"
                key={x.id}
              >
                <div>
                  <b>{data.people.find((p) => p.id === x.employeeId)?.name}</b>
                  <p className="text-sm text-muted-foreground">
                    {typeName(data, x.type)} · {fmt(x.from)} – {fmt(x.to)}
                  </p>
                </div>
                <Status tone={overlaps.has(x.id) ? "destructive" : "secondary"}>
                  {overlaps.has(x.id)
                    ? "Overlap review"
                    : x.status === "pending"
                      ? "Pending"
                      : "Approved"}
                </Status>
              </div>
            ))
          ) : (
            <Empty text="No approved upcoming leave." />
          )}
        </CardContent>
      </Card>
    </>
  );
}
function Alerts({ data, scope }) {
  const alerts = data.people
    .filter((p) => scope.includes(p.id))
    .map((p) => {
      const job = data.jobs.find((j) => j.id === p.jobId);
      const mins = data.attendance
        .filter((x) => x.employeeId === p.id)
        .reduce((a, x) => a + x.minutes, 0);
      return {
        p,
        job,
        mins,
        percent: Math.round((mins / (job?.standardWeekly || 2400)) * 100),
      };
    })
    .filter((x) => x.percent >= 80 || (!x.job?.otEligible && x.percent > 100));
  return (
    <>
      <Head
        title="Overtime & Limit Alerts"
        desc="Proactive warnings from effective job profiles."
      />
      <Card>
        <CardContent className="space-y-3 p-5">
          {alerts.length ? (
            alerts.map((x) => (
              <div
                className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 p-4"
                key={x.p.id}
              >
                <div>
                  <b>{x.p.name}</b>
                  <p className="text-sm text-muted-foreground">
                    {x.mins} of {x.job.standardWeekly} weekly minutes ·{" "}
                    {x.job.otEligible
                      ? "overtime eligible"
                      : "not overtime eligible"}
                  </p>
                </div>
                <Status tone="destructive">{x.percent}% of standard</Status>
              </div>
            ))
          ) : (
            <Empty text="No overtime or weekly-limit alerts." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Jobs({ data, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    department: "",
    standardDaily: 480,
    standardWeekly: 2400,
    maxDaily: 720,
    otEligible: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: "",
  });
  const save = (e) => {
    e.preventDefault();
    if (!form.title || Number(form.standardDaily) > Number(form.maxDaily))
      return notify("Enter a title and a valid daily limit.");
    setData((d) => ({
      ...d,
      jobs: editingId
        ? d.jobs.map((job) =>
            job.id === editingId
              ? {
                  ...job,
                  ...form,
                  standardDaily: Number(form.standardDaily),
                  standardWeekly: Number(form.standardWeekly),
                  maxDaily: Number(form.maxDaily),
                  effectiveFrom: form.effectiveFrom,
                  effectiveTo: form.effectiveTo || null,
                }
              : job,
          )
        : [
            ...d.jobs,
            {
              ...form,
              id: `job${Date.now()}`,
              standardDaily: Number(form.standardDaily),
              standardWeekly: Number(form.standardWeekly),
              maxDaily: Number(form.maxDaily),
              effectiveFrom: form.effectiveFrom,
              active: true,
            },
          ],
    }));
    setOpen(false);
    setEditingId(null);
    notify(editingId ? "Job profile updated." : "Job profile created.");
  };
  return (
    <>
      <Head
        title="Jobs & Policies"
        desc="Configure effective work limits and overtime eligibility."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New job profile
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-5">
          {data.jobs.map((job) => (
            <div
              className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
              key={job.id}
            >
              <div>
                <b>{job.title}</b>
                <p className="text-sm text-muted-foreground">
                  {job.department} · {job.standardDaily} daily /{" "}
                  {job.standardWeekly} weekly minutes ·{" "}
                  {job.maxDaily
                    ? `${job.maxDaily} hard daily limit`
                    : "No hard limit"}
                </p>
              </div>
              <div className="flex gap-2">
                <Status tone="secondary">
                  {job.otEligible ? "OT eligible" : "No OT"}
                </Status>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(job.id);
                    setForm({
                      title: job.title,
                      department: job.department,
                      standardDaily: job.standardDaily,
                      standardWeekly: job.standardWeekly,
                      maxDaily: job.maxDaily ?? 0,
                      otEligible: job.otEligible,
                      effectiveFrom: job.effectiveFrom || "2026-01-01",
                      effectiveTo: job.effectiveTo || "",
                    });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const assigned = data.people.filter(
                      (person) =>
                        person.jobId === job.id && person.status === "active",
                    );
                    setData((d) => ({
                      ...d,
                      jobs: d.jobs.map((x) =>
                        x.id === job.id ? { ...x, active: !x.active } : x,
                      ),
                    }));
                    if (job.active && assigned.length)
                      notify(
                        `${assigned.length} active employee(s) remain assigned to this job.`,
                      );
                    notify(job.active ? "Job deactivated." : "Job activated.");
                  }}
                >
                  {job.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {open && (
        <Dialog
          title={editingId ? "Edit job profile" : "Create job profile"}
          close={() => {
            setOpen(false);
            setEditingId(null);
          }}
        >
          <form onSubmit={save} className="space-y-3">
            {[
              ["title", "Job title"],
              ["department", "Department"],
              ["standardDaily", "Standard daily minutes"],
              ["standardWeekly", "Standard weekly minutes"],
              ["maxDaily", "Hard daily limit minutes"],
            ].map(([key, label]) => (
              <label className="block text-sm font-medium" key={key}>
                {label}
                <input
                  required
                  type={
                    key.includes("Daily") || key.includes("Weekly")
                      ? "number"
                      : "text"
                  }
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
            ))}
            <label className="block text-sm font-medium">
              Effective from
              <input
                required
                type="date"
                value={form.effectiveFrom}
                onChange={(e) =>
                  setForm({ ...form, effectiveFrom: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Effective to (optional)
              <input
                type="date"
                value={form.effectiveTo}
                onChange={(e) =>
                  setForm({ ...form, effectiveTo: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.otEligible}
                onChange={(e) =>
                  setForm({ ...form, otEligible: e.target.checked })
                }
              />{" "}
              Overtime eligible
            </label>
            <Button className="w-full">Save job profile</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
function Policies({ data, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [form, setForm] = useState({
    jobId: data.jobs[0]?.id || "",
    leaveTypeId: data.leaveTypes[0]?.id || "",
    annual: 18,
    carry: 0,
    effectiveFrom: "2026-01-01",
    effectiveTo: "",
  });
  const [typeForm, setTypeForm] = useState({ name: "", paid: true });
  const save = (e) => {
    e.preventDefault();
    if (!form.jobId || !form.leaveTypeId || Number(form.annual) < 0)
      return notify("Complete the policy fields.");
    if (
      data.policies.some(
        (p) =>
          p.id !== editingId &&
          p.jobId === form.jobId &&
          p.leaveTypeId === form.leaveTypeId &&
          p.active !== false,
      )
    )
      return notify(
        "An active mapping already exists for this job and leave type.",
      );
    setData((d) => ({
      ...d,
      policies: editingId
        ? d.policies.map((policy) =>
            policy.id === editingId
              ? {
                  ...policy,
                  jobId: form.jobId,
                  leaveTypeId: form.leaveTypeId,
                  annual: Number(form.annual),
                  carry: Number(form.carry),
                  effectiveFrom: form.effectiveFrom,
                  effectiveTo: form.effectiveTo || null,
                }
              : policy,
          )
        : [
            ...d.policies,
            {
              id: `p${Date.now()}`,
              jobId: form.jobId,
              leaveTypeId: form.leaveTypeId,
              annual: Number(form.annual),
              carry: Number(form.carry),
              effectiveFrom: form.effectiveFrom,
              active: true,
              allowNegative: false,
            },
          ],
    }));
    setOpen(false);
    setEditingId(null);
    notify(
      editingId
        ? "Leave policy mapping updated."
        : "Leave policy mapping created.",
    );
  };
  const saveType = (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return notify("Enter a leave type name.");
    setData((d) => ({
      ...d,
      leaveTypes: [
        ...d.leaveTypes,
        {
          id: typeForm.name.toLowerCase().replace(/\s+/g, "-"),
          name: typeForm.name.trim(),
          paid: typeForm.paid,
          color: "bg-slate-100 text-slate-800",
        },
      ],
    }));
    setTypeForm({ name: "", paid: true });
    setTypeOpen(false);
    notify("Leave type created.");
  };
  return (
    <>
      <Head
        title="Leave Policy Mapping"
        desc="Create leave types, map them to job profiles, and define allotments."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTypeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New leave type
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New mapping
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Leave types</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {data.leaveTypes.map((t) => (
            <div className="rounded-md border p-4" key={t.id}>
              <b>{t.name}</b>
              <p className="text-sm text-muted-foreground">
                {t.paid ? "Paid" : "Unpaid"} · tenant active
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Job policy mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.policies.map((p) => (
            <div
              className="flex items-center justify-between rounded-md border p-4"
              key={p.id}
            >
              <div>
                <b>
                  {data.jobs.find((j) => j.id === p.jobId)?.title} →{" "}
                  {typeName(data, p.leaveTypeId)}
                </b>
                <p className="text-sm text-muted-foreground">
                  {p.annual} annual days · {p.carry} carry-over · negative
                  balance disabled
                </p>
                <p className="text-xs text-muted-foreground">
                  Effective {p.effectiveFrom || "now"}
                  {p.effectiveTo ? ` through ${p.effectiveTo}` : " onward"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Status tone="secondary">
                  {p.active === false ? "Inactive" : "Active policy"}
                </Status>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(p.id);
                    setForm({
                      jobId: p.jobId,
                      leaveTypeId: p.leaveTypeId,
                      annual: p.annual,
                      carry: p.carry,
                      effectiveFrom: p.effectiveFrom || "2026-01-01",
                      effectiveTo: p.effectiveTo || "",
                    });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {open && (
        <Dialog
          title={
            editingId
              ? "Edit leave policy mapping"
              : "Create leave policy mapping"
          }
          close={() => {
            setOpen(false);
            setEditingId(null);
          }}
        >
          <form onSubmit={save} className="space-y-4">
            <label className="block text-sm font-medium">
              Job
              <select
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Leave type
              <select
                value={form.leaveTypeId}
                onChange={(e) =>
                  setForm({ ...form, leaveTypeId: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                {data.leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Annual allotment
                <input
                  required
                  type="number"
                  min="0"
                  value={form.annual}
                  onChange={(e) => setForm({ ...form, annual: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
              <label className="text-sm font-medium">
                Carry-over limit
                <input
                  required
                  type="number"
                  min="0"
                  value={form.carry}
                  onChange={(e) => setForm({ ...form, carry: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border px-3"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Effective from
              <input
                required
                type="date"
                value={form.effectiveFrom}
                onChange={(e) =>
                  setForm({ ...form, effectiveFrom: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Effective to (optional)
              <input
                type="date"
                value={form.effectiveTo}
                onChange={(e) =>
                  setForm({ ...form, effectiveTo: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <Button className="w-full">Save policy</Button>
          </form>
        </Dialog>
      )}
      {typeOpen && (
        <Dialog title="Create leave type" close={() => setTypeOpen(false)}>
          <form onSubmit={saveType} className="space-y-4">
            <label className="block text-sm font-medium">
              Name
              <input
                required
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={typeForm.paid}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, paid: e.target.checked })
                }
              />{" "}
              Paid leave
            </label>
            <Button className="w-full">Save leave type</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
function Directory({ data, setData, notify }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  const list = data.people.filter(
    (p) =>
      ((status === "all" || p.status === status) &&
        p.name.toLowerCase().includes(q.toLowerCase())) ||
      ((status === "all" || p.status === status) &&
        p.email.includes(q.toLowerCase())),
  );
  return (
    <>
      <Head
        title="Global Directory"
        desc="Manage active employees, jobs, and reporting hierarchy."
      />
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          aria-label="Search directory"
          placeholder="Search people"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 w-full rounded-md border pl-9 pr-3"
        />
      </div>
      <label className="mt-3 block text-sm font-medium">
        Directory status
        <select
          aria-label="Directory status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="ml-2 h-10 rounded-md border bg-background px-3"
        >
          <option value="active">Active employees</option>
          <option value="inactive">Inactive employees</option>
          <option value="all">All statuses</option>
        </select>
      </label>
      <Card>
        <CardContent className="space-y-3 p-0">
          {list.map((p) => (
            <div
              className="grid gap-3 border-b p-5 md:grid-cols-[2fr_1fr_1fr] md:items-center"
              key={p.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs">
                  {initials(p.name)}
                </div>
                <div>
                  <b>{p.name}</b>
                  <p className="text-xs text-muted-foreground">
                    {p.email} · {p.job}
                  </p>
                </div>
              </div>
              <select
                aria-label={`Reporting manager for ${p.name}`}
                value={p.managerId || ""}
                onChange={(e) => {
                  const managerId = e.target.value || null;
                  if (wouldCreateManagerCycle(data.people, p.id, managerId))
                    return notify(
                      "That reporting assignment would create a hierarchy cycle.",
                    );
                  setData((d) => ({
                    ...d,
                    people: d.people.map((x) =>
                      x.id === p.id ? { ...x, managerId } : x,
                    ),
                  }));
                  notify("Reporting manager updated.");
                }}
                className="h-10 rounded-md border bg-background px-3"
              >
                <option value="">No manager</option>
                {data.people
                  .filter((x) => x.id !== p.id)
                  .map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
              <select
                aria-label={`Job for ${p.name}`}
                value={p.jobId}
                onChange={(e) => {
                  setData((d) => ({
                    ...d,
                    people: d.people.map((x) =>
                      x.id === p.id
                        ? {
                            ...x,
                            jobId: e.target.value,
                            job:
                              d.jobs.find((j) => j.id === e.target.value)
                                ?.title || x.job,
                          }
                        : x,
                    ),
                  }));
                  notify("Job updated.");
                }}
                className="h-10 rounded-md border bg-background px-3"
              >
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Status tone="secondary">{p.status}</Status>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    notify(`Password reset initiated for ${p.name}.`)
                  }
                >
                  Reset password
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
function Overrides({ data, setData, notify }) {
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("leave");
  const [requestId, setRequestId] = useState("");
  const [employeeId, setEmployeeId] = useState(data.people[0]?.id || "");
  const [leaveTypeId, setLeaveTypeId] = useState(data.leaveTypes[0]?.id || "");
  const [amount, setAmount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const adjust = () => {
    if (!confirming) {
      setConfirming(true);
      return notify("Review the preview, then confirm this audited action.");
    }
    if (!reason.trim()) return notify("A reason is required for HR overrides.");
    if (target === "force" && !requestId)
      return notify("Select one pending leave request.");
    if (target === "leave" && !Number(amount))
      return notify("Enter a non-zero balance adjustment.");
    setData((d) => ({
      ...d,
      audit: [
        ...d.audit,
        {
          action:
            target === "leave"
              ? "leave_balance_adjustment"
              : target === "attendance"
                ? "bulk_attendance_regularization"
                : "force_approve_request",
          actor: "hr",
          reason,
          at: new Date().toISOString(),
        },
      ],
      leave:
        target === "force"
          ? d.leave.map((x) =>
              x.id === requestId
                ? {
                    ...x,
                    status: "approved",
                    history: [...x.history, "Force-approved by HR"],
                  }
                : x,
            )
          : d.leave,
      balances:
        target === "leave"
          ? {
              ...d.balances,
              [employeeId]: {
                ...d.balances[employeeId],
                [leaveTypeId]: {
                  ...d.balances[employeeId]?.[leaveTypeId],
                  manualAdjustments:
                    (d.balances[employeeId]?.[leaveTypeId]?.manualAdjustments ||
                      0) + Number(amount),
                },
              },
            }
          : target === "force" && d.leave.find((x) => x.id === requestId)
            ? (() => {
                const request = d.leave.find((x) => x.id === requestId);
                const current = d.balances[request.employeeId]?.[request.type];
                if (!current) return d.balances;
                return {
                  ...d.balances,
                  [request.employeeId]: {
                    ...d.balances[request.employeeId],
                    [request.type]: {
                      ...current,
                      pending: Math.max(0, current.pending - request.days),
                      used: current.used + request.days,
                    },
                  },
                };
              })()
            : d.balances,
      adjustments:
        target === "attendance"
          ? d.adjustments.map((x) =>
              x.status === "pending" ? { ...x, status: "approved" } : x,
            )
          : d.adjustments,
    }));
    setReason("");
    setConfirming(false);
    notify(
      target === "force"
        ? "Pending request force-approved and audited."
        : target === "attendance"
          ? "Bulk attendance regularization completed."
          : "Leave balance adjustment recorded in the audit ledger.",
    );
  };
  return (
    <>
      <Head
        title="Override Controls"
        desc="Audited HR actions for balances, approvals, and attendance."
      />
      <Card>
        <CardHeader>
          <CardTitle>HR override action</CardTitle>
          <CardDescription>
            Every override requires a reason and creates an audit event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3"
          >
            <option value="leave">Leave balance adjustment</option>
            <option value="force">Force-approve pending leave</option>
            <option value="attendance">
              Bulk-regularize pending attendance
            </option>
          </select>
          {target === "force" && (
            <select
              aria-label="Pending leave request"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">Select pending request</option>
              {data.leave
                .filter((x) => x.status === "pending")
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {data.people.find((p) => p.id === x.employeeId)?.name} ·{" "}
                    {typeName(data, x.type)} · {fmt(x.from)}
                  </option>
                ))}
            </select>
          )}
          {target === "leave" && (
            <div className="grid gap-3 md:grid-cols-3">
              <select
                aria-label="Employee balance target"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              >
                {data.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Leave balance target"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              >
                {data.leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Balance adjustment amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 rounded-md border px-3"
                placeholder="Days (+/-)"
              />
            </div>
          )}
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-24 w-full rounded-md border p-3"
            placeholder="Required reason for this administrative action"
          />
          {confirming && (
            <p
              role="status"
              className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
            >
              Preview ready. This action will update mock records and append an
              audit event.
            </p>
          )}
          <Button onClick={adjust}>
            {confirming ? "Confirm audited action" : "Preview action"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent audit events</CardTitle>
        </CardHeader>
        <CardContent>
          {data.audit.length ? (
            data.audit
              .slice()
              .reverse()
              .map((x, i) => (
                <p className="border-b py-2 text-sm" key={i}>
                  {x.action} · {x.reason || "No note"} ·{" "}
                  {fmt((x.at || new Date().toISOString()).slice(0, 10))}
                </p>
              ))
          ) : (
            <Empty text="No HR overrides recorded yet." />
          )}
        </CardContent>
      </Card>
    </>
  );
}
function Reports({ data }) {
  const [preset, setPreset] = useState("absenteeism");
  const [department, setDepartment] = useState("all");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");
  const rows = data.people
    .filter((p) => department === "all" || p.department === department)
    .map((p) => {
      const worked = data.attendance
        .filter((x) => x.employeeId === p.id && x.date >= from && x.date <= to)
        .reduce((a, x) => a + x.minutes, 0);
      const leave = data.leave
        .filter(
          (x) =>
            x.employeeId === p.id &&
            x.status === "approved" &&
            x.from <= to &&
            x.to >= from,
        )
        .reduce((a, x) => a + x.days, 0);
      const job = data.jobs.find((x) => x.id === p.jobId);
      const overtime = job?.otEligible
        ? Math.max(0, worked - (job.standardWeekly || 2400))
        : 0;
      const remaining = Object.values(data.balances[p.id] || {}).reduce(
        (sum, balance) => sum + Math.max(0, remainingBalance(balance)),
        0,
      );
      return { p, worked, leave, overtime, remaining };
    });
  const exportCsv = () => {
    const csv = [
      ["Employee", "Department", "Worked minutes", "Approved leave days"],
      ...rows.map((x) => [x.p.name, x.p.department, x.worked, x.leave]),
    ]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "attendance-summaries.csv";
    a.click();
  };
  return (
    <>
      <Head
        title="Master Reports"
        desc="Tenant-wide attendance summaries, absence, overtime, and leave liability."
        action={
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-medium">
          Report preset
          <select
            aria-label="Report preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="ml-2 h-10 rounded-md border bg-background px-3"
          >
            <option value="absenteeism">Organization absenteeism</option>
            <option value="overtime">Overtime by department</option>
            <option value="liability">End-of-year leave liability</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          From
          <input
            aria-label="Report start date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-2 h-10 rounded-md border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          To
          <input
            aria-label="Report end date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-2 h-10 rounded-md border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Department
          <select
            aria-label="Report department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="ml-2 h-10 rounded-md border bg-background px-3"
          >
            <option value="all">All departments</option>
            {[...new Set(data.people.map((p) => p.department))].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric
          label="Absenteeism"
          value={`${rows.length ? Math.round((rows.filter((x) => data.attendance.some((a) => a.employeeId === x.p.id && a.date >= from && a.date <= to && ["absent", "missing", "below_standard"].includes(a.status))).length / rows.length) * 100) : 0}%`}
          detail="Missing or below-standard days"
        />
        <Metric
          label="Overtime accrued"
          value={`${rows.reduce((a, x) => a + x.overtime, 0)} min`}
          detail="By effective job profile"
        />
        <Metric
          label="Leave liability"
          value={`${rows.reduce((a, x) => a + x.remaining, 0)} days`}
          detail="Estimated balance exposure"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance summaries</CardTitle>
          <CardDescription>
            Generated from the active tenant scope and current filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted">
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Worked minutes</th>
                <th className="p-3 text-left">Approved leave</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((x) => (
                  <tr className="border-b" key={x.p.id}>
                    <td className="p-3">{x.p.name}</td>
                    <td className="p-3">{x.p.department}</td>
                    <td className="p-3">{x.worked}</td>
                    <td className="p-3">{x.leave} days</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="p-6 text-center text-muted-foreground"
                    colSpan="4"
                  >
                    No employees match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
function Dialog({ title, close, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              title="Close dialog"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("tlt-session-v1") || "null",
      );
      return stored?.tenantId === seed.tenant.id ? stored : null;
    } catch {
      return null;
    }
  });
  const [data, setDataState] = useState(loadData);
  const [role, setRole] = useState(session?.role || "Employee");
  const [page, setPage] = useState(() => {
    const key = window.location.hash.split("/").pop();
    const map = {
      attendance: "Attendance",
      leave: "Leave",
      holidays: "Holidays",
      approvals: "Approvals",
      whosin: "WhosIn",
      teamcalendar: "TeamCalendar",
      alerts: "Alerts",
      jobs: "Jobs",
      policies: "Policies",
      directory: "Directory",
      overrides: "Overrides",
      reports: "Reports",
      profile: "Profile",
    };
    return map[key] || "Dashboard";
  });
  const [team, setTeam] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState("");
  const setData = (updater) =>
    setDataState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => {
    if (session) window.location.hash = "#/app/dashboard";
    else window.location.hash = "#/login";
  }, [session]);
  useEffect(() => {
    const employeePages = [
      "Dashboard",
      "Attendance",
      "Leave",
      "Holidays",
      "Profile",
    ];
    if (role === "Employee" && !employeePages.includes(page))
      setPage("Dashboard");
    if (
      role === "Reporting Manager" &&
      ![
        "Dashboard",
        "Attendance",
        "Leave",
        "Holidays",
        "Profile",
        "Approvals",
        "WhosIn",
        "TeamCalendar",
        "Alerts",
      ].includes(page)
    )
      setPage("Dashboard");
  }, [role, page]);
  const signOut = () => {
    localStorage.removeItem("tlt-session-v1");
    setSession(null);
    setPage("Dashboard");
    setTeam(false);
  };
  const resetDemo = () => {
    localStorage.removeItem("tlt-data-v1:tenant-main");
    setDataState(clone(seed));
    setPage("Dashboard");
    setTeam(false);
    notify("Demo data reset.");
  };
  if (!session)
    return (
      <AuthScreen
        onLogin={(user) => {
          setSession(user);
          setRole(user.role);
          setPage("Dashboard");
          setTeam(false);
        }}
      />
    );
  const person =
    data.people.find((p) => p.id === session.employeeId) || data.people[0];
  const reports =
    role === "Reporting Manager"
      ? directReports(data, "jamie").map((p) => p.id)
      : role === "HR Admin"
        ? data.people.map((p) => p.id)
        : [person.id];
  const navigate = (next) => {
    setPage(next);
    window.location.hash = "#/app/" + next.toLowerCase();
  };
  let view;
  if (page === "Dashboard")
    view =
      team && role === "Reporting Manager" ? (
        <>
          <Head
            title="Team command center"
            desc="Coverage, approvals, and workload signals for your direct reports."
          />
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="Direct reports"
              value={reports.length}
              detail="Active team members"
            />
            <Metric
              label="Pending approvals"
              value={
                data.leave.filter(
                  (x) =>
                    reports.includes(x.employeeId) && x.status === "pending",
                ).length +
                data.adjustments.filter(
                  (x) =>
                    reports.includes(x.employeeId) && x.status === "pending",
                ).length
              }
              detail="Needs review"
            />
            <Metric
              label="Coverage"
              value="92%"
              detail="Scheduled availability"
            />
            <Metric label="Alerts" value="2" detail="Limit warnings" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Manager actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" onClick={() => setPage("Approvals")}>
                Review approvals
              </Button>
              <Button variant="outline" onClick={() => setPage("WhosIn")}>
                Who's In
              </Button>
              <Button variant="outline" onClick={() => setPage("TeamCalendar")}>
                Team leave calendar
              </Button>
            </CardContent>
          </Card>
        </>
      ) : role === "HR Admin" ? (
        <>
          <Head
            title="Organization overview"
            desc="Tenant administration, compliance, and workforce visibility."
          />
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="People"
              value={data.people.length}
              detail="Active directory"
            />
            <Metric
              label="Jobs"
              value={data.jobs.length}
              detail="Configured profiles"
            />
            <Metric
              label="Leave requests"
              value={data.leave.length}
              detail="All statuses"
            />
            <Metric
              label="Audit events"
              value={data.audit.length}
              detail="Recorded actions"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Admin workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" onClick={() => setPage("Jobs")}>
                Jobs & policies
              </Button>
              <Button variant="outline" onClick={() => setPage("Directory")}>
                Global directory
              </Button>
              <Button variant="outline" onClick={() => setPage("Reports")}>
                Master reports
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmployeeDashboard
          data={data}
          person={person}
          running={running}
          setRunning={setRunning}
          onNavigate={navigate}
        />
      );
  if (page === "Attendance")
    view = (
      <Attendance
        data={data}
        person={person}
        setData={setData}
        notify={notify}
      />
    );
  if (page === "Leave")
    view = (
      <Leave data={data} person={person} setData={setData} notify={notify} />
    );
  if (page === "Holidays")
    view = (
      <Holidays
        data={data}
        hr={role === "HR Admin"}
        setData={setData}
        notify={notify}
      />
    );
  if (page === "Approvals")
    view = (
      <Approvals
        data={data}
        scope={reports}
        setData={setData}
        notify={notify}
      />
    );
  if (page === "WhosIn") view = <WhosIn data={data} scope={reports} />;
  if (page === "TeamCalendar")
    view = <TeamCalendar data={data} scope={reports} />;
  if (page === "Alerts") view = <Alerts data={data} scope={reports} />;
  if (page === "Jobs")
    view = <Jobs data={data} setData={setData} notify={notify} />;
  if (page === "Policies")
    view = <Policies data={data} setData={setData} notify={notify} />;
  if (page === "Directory")
    view = <Directory data={data} setData={setData} notify={notify} />;
  if (page === "Overrides")
    view = <Overrides data={data} setData={setData} notify={notify} />;
  if (page === "Reports") view = <Reports data={data} />;
  if (page === "Profile")
    view = (
      <Card>
        <CardHeader>
          <CardTitle>{person.name}</CardTitle>
          <CardDescription>
            {person.job} · {role}
          </CardDescription>
        </CardHeader>
        <CardContent>{person.email}</CardContent>
      </Card>
    );
  return (
    <Shell
      user={session}
      role={role}
      setRole={(value) => {
        setRole(value);
        setPage("Dashboard");
        if (value !== "Reporting Manager") setTeam(false);
      }}
      team={team}
      setTeam={setTeam}
      page={page}
      go={navigate}
      onSignOut={signOut}
      onReset={resetDemo}
    >
      {view}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[60] rounded-md border bg-background px-4 py-3 text-sm shadow-lg"
        >
          <Check className="mr-2 inline h-4 w-4 text-emerald-600" />
          {toast}
        </div>
      )}
    </Shell>
  );
}

createRoot(document.getElementById("root")).render(<App />);
