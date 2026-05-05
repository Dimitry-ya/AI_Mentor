import { useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Search,
  Download,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "../store";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Назначено: "hsl(220 9% 46%)",
  "В процессе": "hsl(34 94% 45%)",
  Завершено: "hsl(152 56% 38%)",
};

export default function Analytics() {
  const { trainings, employees, analytics, resetAttempt } = useAppStore();
  const [search, setSearch] = useState("");
  const [trainingFilter, setTrainingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.filter((a) => {
      if (trainingFilter !== "all" && a.trainingId !== trainingFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q) {
        const emp = employees.find((e) => e.id === a.employeeId);
        const tr = trainings.find((t) => t.id === a.trainingId);
        const text = `${emp?.name ?? ""} ${tr?.name ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [analytics, employees, trainings, search, trainingFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((a) => a.status === "Завершено");
    const inProgress = filtered.filter((a) => a.status === "В процессе");
    const avgScore =
      done.length > 0
        ? Math.round(done.reduce((a, x) => a + (x.score ?? 0), 0) / done.length)
        : 0;
    const avgTime =
      done.length > 0
        ? Math.round(done.reduce((a, x) => a + x.timeMinutes, 0) / done.length)
        : 0;
    return { total, doneCount: done.length, inProgressCount: inProgress.length, avgScore, avgTime };
  }, [filtered]);

  const byTrainingChart = useMemo(() => {
    const map = new Map<string, { name: string; завершено: number; "в процессе": number; назначено: number }>();
    trainings.forEach((t) =>
      map.set(t.id, {
        name: shortName(t.name),
        завершено: 0,
        "в процессе": 0,
        назначено: 0,
      }),
    );
    filtered.forEach((a) => {
      const row = map.get(a.trainingId);
      if (!row) return;
      if (a.status === "Завершено") row["завершено"]++;
      else if (a.status === "В процессе") row["в процессе"]++;
      else row["назначено"]++;
    });
    return Array.from(map.values()).filter((r) => r.завершено + r["в процессе"] + r.назначено > 0);
  }, [filtered, trainings]);

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = { Назначено: 0, "В процессе": 0, Завершено: 0 };
    filtered.forEach((a) => counts[a.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const exportCsv = () => {
    const rows: string[][] = [
      ["Сотрудник", "Табельный", "Обучение", "Статус", "Балл", "Попыток", "Минут", "Активность"],
    ];
    filtered.forEach((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      const tr = trainings.find((t) => t.id === a.trainingId);
      rows.push([
        emp?.name ?? "",
        emp?.tabel ?? "",
        tr?.name ?? "",
        a.status,
        a.score == null ? "" : String(a.score),
        String(a.attempts),
        String(a.timeMinutes),
        new Date(a.lastActivity).toLocaleString("ru-RU"),
      ]);
    });
    const csv = rows
      .map((r) =>
        r
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(";"),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-mentor-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Файл выгружен");
  };

  return (
    <div className="px-10 py-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Аналитика</h1>
            <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-1">
              Сводка по прохождению обучений сотрудниками банка.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Выгрузить CSV
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-[420px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ink-muted))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по сотруднику или обучению"
              className="pl-9"
              size={40}
            />
          </div>
          <Select value={trainingFilter} onValueChange={setTrainingFilter}>
            <SelectTrigger className="w-[260px] h-10 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все обучения</SelectItem>
              {trainings.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="Назначено">Назначено</SelectItem>
              <SelectItem value="В процессе">В процессе</SelectItem>
              <SelectItem value="Завершено">Завершено</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={<Users />} label="Записей всего" value={stats.total} />
          <KpiCard icon={<TrendingUp />} label="Средний балл" value={`${stats.avgScore}%`} accent="success" />
          <KpiCard icon={<BarChart3 />} label="Завершено" value={stats.doneCount} />
          <KpiCard icon={<Clock />} label="Среднее время" value={`${stats.avgTime} мин`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="am-card lg:col-span-2 p-5">
            <div className="text-[14px] font-semibold mb-3">Прогресс по обучениям</div>
            {byTrainingChart.length === 0 ? (
              <div className="text-[13px] text-[hsl(var(--ink-muted))] py-10 text-center">
                Нет данных под выбранные фильтры
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTrainingChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="hsl(220 13% 92%)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} interval={0} angle={-12} dy={10} height={50} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(216 20% 96%)" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="назначено" stackId="a" fill="hsl(220 9% 70%)" />
                    <Bar dataKey="в процессе" stackId="a" fill="hsl(34 94% 60%)" />
                    <Bar dataKey="завершено" stackId="a" fill="hsl(152 56% 45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="am-card p-5">
            <div className="text-[14px] font-semibold mb-3">Статусы</div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "hsl(220 9% 70%)"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="am-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="text-[14px] font-semibold">Прохождения</div>
            <div className="text-[12px] text-[hsl(var(--ink-muted))]">{filtered.length} записей</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[hsl(216_20%_98%)] text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Сотрудник</th>
                  <th className="text-left px-4 py-2.5 font-medium">Обучение</th>
                  <th className="text-left px-4 py-2.5 font-medium">Статус</th>
                  <th className="text-right px-4 py-2.5 font-medium">Балл</th>
                  <th className="text-right px-4 py-2.5 font-medium">Попыток</th>
                  <th className="text-right px-4 py-2.5 font-medium">Минут</th>
                  <th className="text-left px-4 py-2.5 font-medium">Активность</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[hsl(var(--ink-muted))]">
                      Записей не найдено
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 200).map((a) => {
                    const emp = employees.find((e) => e.id === a.employeeId);
                    const tr = trainings.find((t) => t.id === a.trainingId);
                    return (
                      <tr key={a.id} className="hover:bg-[hsl(216_20%_98%)]">
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{emp?.name ?? "—"}</div>
                          <div className="text-[11px] text-[hsl(var(--ink-muted))]">{emp?.tabel}</div>
                        </td>
                        <td className="px-4 py-2.5">{tr?.name ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {a.score == null ? "—" : `${a.score}%`}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[hsl(var(--ink-muted))]">{a.attempts}</td>
                        <td className="px-4 py-2.5 text-right text-[hsl(var(--ink-muted))]">{a.timeMinutes}</td>
                        <td className="px-4 py-2.5 text-[hsl(var(--ink-muted))]">
                          {new Date(a.lastActivity).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-[12px] h-7"
                            onClick={() => {
                              resetAttempt(a.id);
                              toast("Попытка сброшена");
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Сбросить
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortName(s: string) {
  return s.length > 22 ? s.slice(0, 20) + "…" : s;
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: "success";
}) {
  return (
    <div className="am-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-[hsl(var(--ink-muted))]">{label}</div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: accent === "success" ? "hsl(var(--success) / 0.12)" : "hsl(216 20% 96%)",
            color: accent === "success" ? "hsl(var(--success))" : "hsl(var(--ink-muted))",
          }}
        >
          {icon}
        </div>
      </div>
      <div className="text-[22px] font-semibold mt-2">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Завершено"
      ? "bg-[hsl(var(--success)/0.10)] text-[hsl(var(--success))]"
      : status === "В процессе"
        ? "bg-[hsl(34_94%_92%)] text-[hsl(34_60%_30%)]"
        : "bg-[hsl(216_20%_94%)] text-[hsl(var(--ink-muted))]";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
