import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Lock, MoreHorizontal, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "../store";
import { ROLES } from "@/lib/constants";
import { toast } from "sonner";
import type { Employee, EmployeeRole, EmployeeStatus } from "@/lib/types";

export default function AccessPage() {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployees,
    bulkSetRole,
    bulkSetStatus,
  } = useAppStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q && !`${e.name} ${e.tabel}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, search, roleFilter, statusFilter]);

  const allOnPageSelected =
    filtered.filter((e) => !e.protected).length > 0 &&
    filtered.filter((e) => !e.protected).every((e) => selectedIds.has(e.id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filtered.forEach((e) => {
        if (!e.protected) next.add(e.id);
      });
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleBulkDelete = () => {
    setConfirmDelete(Array.from(selectedIds));
  };

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Активен").length;
    const blocked = total - active;
    const admins = employees.filter((e) => e.role === "Администратор").length;
    return { total, active, blocked, admins };
  }, [employees]);

  return (
    <div className="px-10 py-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Управление доступом</h1>
            <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-1">
              Сотрудники, у которых есть доступ к платформе AI-Ментор.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Добавить сотрудника
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Всего" value={stats.total} />
          <KpiCard label="Активны" value={stats.active} accent="success" />
          <KpiCard label="Заблокированы" value={stats.blocked} accent="error" />
          <KpiCard label="Администраторов" value={stats.admins} />
        </div>

        <div className="am-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-[420px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ink-muted))]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени или табельному"
                className="pl-9"
                size={40}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любой статус</SelectItem>
                <SelectItem value="Активен">Активен</SelectItem>
                <SelectItem value="Заблокирован">Заблокирован</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-[12px] text-[hsl(var(--ink-muted))] ml-auto">
              Найдено: {filtered.length}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="px-5 py-2 bg-primary/[0.05] border-b border-border flex items-center gap-3 text-[13px]">
              <span className="font-medium">Выбрано: {selectedIds.size}</span>
              <div className="flex items-center gap-2">
                <Select
                  onValueChange={(v) => {
                    bulkSetRole(Array.from(selectedIds), v as EmployeeRole);
                    toast.success("Роли обновлены");
                  }}
                >
                  <SelectTrigger className="h-8 w-[180px] bg-white"><SelectValue placeholder="Назначить роль" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => {
                    bulkSetStatus(Array.from(selectedIds), "Заблокирован");
                    toast("Сотрудники заблокированы");
                  }}
                >
                  <UserX className="w-3.5 h-3.5" /> Заблокировать
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => {
                    bulkSetStatus(Array.from(selectedIds), "Активен");
                    toast.success("Сотрудники активированы");
                  }}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Активировать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedIds(new Set())}
              >
                Снять выбор
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[hsl(var(--surface))] text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))]">
                <tr>
                  <th className="text-left px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-primary"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium">Сотрудник</th>
                  <th className="text-left px-4 py-2.5 font-medium">Табельный</th>
                  <th className="text-left px-4 py-2.5 font-medium">Роль</th>
                  <th className="text-left px-4 py-2.5 font-medium">Статус</th>
                  <th className="px-4 py-2.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[hsl(var(--ink-muted))]">
                      Сотрудников не найдено
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <EmployeeRow
                      key={e.id}
                      e={e}
                      selected={selectedIds.has(e.id)}
                      onToggle={() => toggleOne(e.id)}
                      onChangeRole={(role) => updateEmployee(e.id, { role })}
                      onChangeStatus={(status) => updateEmployee(e.id, { status })}
                      onDelete={() => setConfirmDelete([e.id])}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddEmployeeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingTabels={employees.map((e) => e.tabel)}
        onAdd={(emp) => {
          addEmployee(emp);
          toast.success("Сотрудник добавлен");
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete && confirmDelete.length > 1
                ? `Удалить ${confirmDelete.length} сотрудников?`
                : "Удалить сотрудника?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Доступ к платформе будет отозван. Действие нельзя отменить.
              Защищённые системные пользователи будут пропущены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (confirmDelete) {
                  deleteEmployees(confirmDelete);
                  setSelectedIds(new Set());
                  toast.success("Удалено");
                  setConfirmDelete(null);
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmployeeRow({
  e,
  selected,
  onToggle,
  onChangeRole,
  onChangeStatus,
  onDelete,
}: {
  e: Employee;
  selected: boolean;
  onToggle: () => void;
  onChangeRole: (role: EmployeeRole) => void;
  onChangeStatus: (status: EmployeeStatus) => void;
  onDelete: () => void;
}) {
  const initials = e.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <tr className="hover:bg-[hsl(var(--surface))]">
      <td className="px-4 py-2.5">
        {e.protected ? (
          <Lock className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
        ) : (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="w-4 h-4 accent-primary"
          />
        )}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
            {initials}
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {e.name}
              {e.protected && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-[hsl(var(--ink-muted))]">{e.tabel}</td>
      <td className="px-4 py-2.5">
        <Select value={e.role} onValueChange={(v) => onChangeRole(v as EmployeeRole)} disabled={e.protected}>
          <SelectTrigger className="h-8 w-[170px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-2.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium ${
            e.status === "Активен"
              ? "bg-[hsl(var(--success)/0.10)] text-[hsl(var(--success))]"
              : "bg-[hsl(var(--error)/0.08)] text-error"
          }`}
        >
          <span className={`am-dot ${e.status === "Активен" ? "am-dot-success" : "am-dot-error"}`} />
          {e.status}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Действия"
              className="w-8 h-8 rounded-lg border border-border bg-[hsl(var(--surface))] hover:bg-muted flex items-center justify-center transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={e.protected}
              onClick={() => onChangeStatus(e.status === "Активен" ? "Заблокирован" : "Активен")}
            >
              {e.status === "Активен" ? (
                <><UserX className="w-3.5 h-3.5 mr-2" /> Заблокировать</>
              ) : (
                <><UserCheck className="w-3.5 h-3.5 mr-2" /> Активировать</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={e.protected}
              className="text-error focus:text-error"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function AddEmployeeDialog({
  open,
  onClose,
  existingTabels,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existingTabels: string[];
  onAdd: (emp: Omit<Employee, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [tabel, setTabel] = useState("");
  const [role, setRole] = useState<EmployeeRole>("Просмотр");
  const [touched, setTouched] = useState(false);

  const reset = () => {
    setName("");
    setTabel("");
    setRole("Просмотр");
    setTouched(false);
  };

  const tabelError =
    touched && !/^\d{6,10}$/.test(tabel)
      ? "Табельный должен содержать 6–10 цифр"
      : touched && existingTabels.includes(tabel)
        ? "Сотрудник с таким табельным уже существует"
        : null;
  const nameError = touched && name.trim().length < 3 ? "Введите ФИО" : null;

  const submit = () => {
    setTouched(true);
    if (nameError || tabelError || !name.trim() || !tabel.trim()) return;
    onAdd({ name: name.trim(), tabel: tabel.trim(), role, status: "Активен" });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Новый сотрудник</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">ФИО *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={120}
              placeholder="Иван Иванов"
            />
            {nameError && <div className="text-[12px] text-error">{nameError}</div>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Табельный номер *</Label>
            <Input
              value={tabel}
              onChange={(e) => setTabel(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setTouched(true)}
              maxLength={10}
              placeholder="00010023"
            />
            {tabelError && <div className="text-[12px] text-error">{tabelError}</div>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Роль</Label>
            <Select value={role} onValueChange={(v) => setRole(v as EmployeeRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Отмена</Button>
          <Button onClick={submit}>Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "success" | "error";
}) {
  const dot =
    accent === "success" ? "am-dot-success" : accent === "error" ? "am-dot-error" : "am-dot-muted";
  return (
    <div className="am-card p-4 flex items-center gap-3">
      <span className={`am-dot ${dot}`} />
      <div>
        <div className="text-[12px] text-[hsl(var(--ink-muted))]">{label}</div>
        <div className="text-[18px] font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  );
}
