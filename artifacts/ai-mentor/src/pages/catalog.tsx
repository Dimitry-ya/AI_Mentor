import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  Copy,
  Edit2,
  Trash2,
  MoreHorizontal,
  Search,
  Eye,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useAppStore } from "../store";
import type { Training, TrainingStatus } from "../lib/types";
import { Wizard } from "@/components/wizard";
import { toast } from "sonner";

const STATUS_GROUPS: TrainingStatus[] = [
  "Опубликовано",
  "Есть изменения",
  "Есть ошибки",
  "Черновик",
];

const STATUS_DOT: Record<TrainingStatus, string> = {
  "Опубликовано": "am-dot-success",
  "Есть изменения": "am-dot-warning",
  "Есть ошибки": "am-dot-error",
  "Черновик": "am-dot-muted",
};

export default function Catalog() {
  const { trainings, deleteTraining, duplicateTraining, unpublishTraining } = useAppStore();
  const [, setLocation] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Training | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainings.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.topic.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [trainings, search, typeFilter, statusFilter]);

  const groups = useMemo(() => {
    const map = new Map<TrainingStatus, Training[]>();
    for (const status of STATUS_GROUPS) map.set(status, []);
    for (const t of filtered) map.get(t.status)?.push(t);
    return STATUS_GROUPS.map((s) => ({ status: s, items: map.get(s) ?? [] }));
  }, [filtered]);

  return (
    <div className="px-10 py-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Каталог обучения</h1>
            <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-1">
              Тренажёры и экзамены, доступные на платформе AI-Ментор.
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Создать обучение
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-[420px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ink-muted))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или тематике"
              className="pl-9"
              size={40}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой тип</SelectItem>
              <SelectItem value="Тренажёр">Тренажёр</SelectItem>
              <SelectItem value="Экзамен">Экзамен</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-10 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой статус</SelectItem>
              {STATUS_GROUPS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-[13px] text-[hsl(var(--ink-muted))] ml-auto">
            Найдено: {filtered.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setWizardOpen(true)} />
        ) : (
          <div className="space-y-8">
            {groups.map((g) =>
              g.items.length === 0 ? null : (
                <section key={g.status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`am-dot ${STATUS_DOT[g.status]}`} />
                    <h2 className="text-[15px] font-semibold">{g.status}</h2>
                    <span className="text-[12px] text-[hsl(var(--ink-muted))]">
                      {g.items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {g.items.map((t) => (
                      <TrainingCard
                        key={t.id}
                        t={t}
                        onOpen={() => setLocation(`/builder/${t.id}`)}
                        onPreview={() => setLocation(`/preview/${t.id}`)}
                        onPlay={() => setLocation(`/learner/${t.id}`)}
                        onDuplicate={() => {
                          const copy = duplicateTraining(t.id);
                          if (copy) toast.success("Обучение продублировано");
                        }}
                        onDelete={() => setConfirmDelete(t)}
                        onUnpublish={() => {
                          unpublishTraining(t.id);
                          toast("Обучение снято с публикации");
                        }}
                      />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>

      {wizardOpen && <Wizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить «{confirmDelete?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Действие нельзя отменить. Все шаги, кейсы и результаты по этому обучению будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (confirmDelete) {
                  deleteTraining(confirmDelete.id);
                  toast.success("Обучение удалено");
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

function TrainingCard({
  t,
  onOpen,
  onPreview,
  onPlay,
  onDuplicate,
  onDelete,
  onUnpublish,
}: {
  t: Training;
  onOpen: () => void;
  onPreview: () => void;
  onPlay: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUnpublish: () => void;
}) {
  return (
    <div className="am-card flex flex-col overflow-hidden group hover:shadow-[var(--shadow-2)] transition-shadow">
      <div className="relative">
        {t.cover ? (
          <div className="aspect-video w-full overflow-hidden">
            <img src={t.cover} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="am-cover-ph rounded-none" style={{ borderRadius: 0 }}>
            Обложка не загружена
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="am-pill bg-white/95 backdrop-blur">
            {t.type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Действия"
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/30 shadow-sm hover:bg-white flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onOpen}>
                <Edit2 className="w-4 h-4 mr-2" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" /> Предпросмотр
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPlay}>
                <Play className="w-4 h-4 mr-2" /> Запустить
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" /> Дублировать
              </DropdownMenuItem>
              {t.status === "Опубликовано" && (
                <DropdownMenuItem onClick={onUnpublish}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Снять с публикации
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error focus:text-error"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <button
            onClick={onOpen}
            className="font-semibold text-[15px] leading-snug text-left line-clamp-2 hover:text-primary transition-colors"
          >
            {t.name}
          </button>
          <div className="text-[12px] text-[hsl(var(--ink-muted))] mt-1 truncate">
            {t.factory} · {t.direction} · {t.duration}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2 text-[hsl(var(--ink-muted))]">
            <span className={`am-dot ${STATUS_DOT[t.status]}`} />
            <span>{t.status}</span>
            <span>·</span>
            <span>Готовность {t.readiness}%</span>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={onOpen}
          >
            Открыть
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="am-card text-center py-16 px-6">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Plus className="w-6 h-6" />
      </div>
      <h3 className="text-[16px] font-semibold">Здесь пока пусто</h3>
      <p className="text-[13px] text-[hsl(var(--ink-muted))] mt-1.5 max-w-md mx-auto">
        Создайте первый тренажёр или экзамен — соберите шаги, добавьте теорию и кейсы и запустите для коллег.
      </p>
      <Button onClick={onCreate} className="mt-5 gap-2">
        <Plus className="w-4 h-4" /> Создать обучение
      </Button>
    </div>
  );
}
