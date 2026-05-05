import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  Eye,
  Play,
  ShieldCheck,
  AlertTriangle,
  X,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppStore } from "../../store";
import {
  emptyCase,
  emptyQuestion,
  emptySection,
  emptyTheory,
  deepCloneStructure,
} from "@/lib/factory";
import type { SelectedNode, Training } from "@/lib/types";
import { validateTraining } from "@/lib/validation";
import { BuilderTree } from "./tree";
import { Inspector } from "./inspector";
import {
  CaseEditor,
  FinishEditor,
  OnboardingEditor,
  PracticeEditor,
  QuestionEditor,
  RootEditor,
  SectionEditor,
  TheoryBlockEditor,
  TheoryEditor,
} from "./editors";
import { ScenarioFooter } from "@/components/scenario-footer";

type StepKey = "onboarding" | "theory" | "practice" | "finish";

interface FlowStep {
  key: StepKey;
  label: string;
  hidden?: boolean;
}

export default function BuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const { getTraining, updateTraining, publishTraining } = useAppStore();
  const training = getTraining(id);
  const [selected, setSelected] = useState<SelectedNode>({ kind: "root" });
  const [checkOpen, setCheckOpen] = useState(false);
  const lastSavedRef = useRef<string>("");

  const report = useMemo(
    () => (training ? validateTraining(training) : null),
    [training],
  );

  // Ctrl+S handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast.success("Изменения сохранены");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Track last saved snapshot
  useEffect(() => {
    if (training && !lastSavedRef.current) {
      lastSavedRef.current = JSON.stringify(training.structure);
    }
  }, [training]);

  if (!training || !report) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-[18px] font-semibold mb-2">Обучение не найдено</div>
          <p className="text-[13.5px] text-[hsl(var(--ink-muted))] mb-4">
            Возможно, оно было удалено или вы открыли неверную ссылку.
          </p>
          <Button onClick={() => setLocation("/catalog")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  const steps: FlowStep[] = ([
    { key: "onboarding" as const, label: "Онбординг" },
    { key: "theory" as const, label: "Теория", hidden: training.type !== "Тренажёр" },
    { key: "practice" as const, label: "Практика" },
    { key: "finish" as const, label: "Завершение" },
  ] as FlowStep[]).filter((s) => !s.hidden);

  const currentStepKey: StepKey = (() => {
    const k = selected.kind;
    if (k === "onboarding") return "onboarding";
    if (k === "theoryBlock" || k === "theory") return "theory";
    if (k === "practice" || k === "section" || k === "case" || k === "question") return "practice";
    if (k === "finish") return "finish";
    return steps[0]!.key;
  })();

  const goToStep = (key: StepKey) => {
    if (key === "onboarding") setSelected({ kind: "onboarding" });
    if (key === "theory") setSelected({ kind: "theoryBlock" });
    if (key === "practice") setSelected({ kind: "practice" });
    if (key === "finish") setSelected({ kind: "finish" });
  };

  const stepStatus = (key: StepKey): "ok" | "errors" | "empty" => {
    if (key === "onboarding") return report.byBlock["onboarding"] === "errors" ? "errors" : "ok";
    if (key === "theory") {
      if (training.type !== "Тренажёр") return "ok";
      const v = report.byBlock["theoryBlock"];
      return v === "errors" ? "errors" : v === "empty" ? "empty" : "ok";
    }
    if (key === "practice") return report.byBlock["practice"] === "errors" ? "errors" : "ok";
    if (key === "finish") return report.byBlock["finish"] === "errors" ? "errors" : "ok";
    return "ok";
  };

  const patch = (mut: (t: Training) => void) => {
    updateTraining(id, (t) => {
      const next: Training = {
        ...t,
        structure: deepClone(t.structure),
      };
      mut(next);
      return next;
    });
  };

  const handlePublish = () => {
    const result = publishTraining(id);
    if (result.ok) {
      toast.success("Опубликовано");
    } else {
      setCheckOpen(true);
      toast.error(`Найдено ошибок: ${result.errors}`);
    }
  };

  const stepIndex = steps.findIndex((s) => s.key === currentStepKey);
  const goNextStep = () => {
    const next = steps[stepIndex + 1];
    if (next) goToStep(next.key);
    else handlePublish();
  };
  const goPrevStep = () => {
    const prev = steps[stepIndex - 1];
    if (prev) goToStep(prev.key);
  };

  /* Mutation actions for tree */
  const addTheory = () => {
    const t = emptyTheory();
    patch((tr) => tr.structure.theories.push(t));
    setSelected({ kind: "theory", id: t.id });
  };
  const addSection = () => {
    const idx = training.structure.practice.sections.length + 1;
    const s = emptySection(idx);
    patch((tr) => tr.structure.practice.sections.push(s));
    setSelected({ kind: "section", id: s.id });
  };
  const addCase = (sectionId: string) => {
    const sec = training.structure.practice.sections.find((s) => s.id === sectionId);
    const idx = (sec?.cases.length ?? 0) + 1;
    const c = emptyCase(idx);
    patch((tr) => {
      tr.structure.practice.sections.find((s) => s.id === sectionId)?.cases.push(c);
    });
    setSelected({ kind: "case", sectionId, id: c.id });
  };
  const addQuestion = (sectionId: string, caseId: string) => {
    const cs = training.structure.practice.sections
      .find((s) => s.id === sectionId)
      ?.cases.find((c) => c.id === caseId);
    const idx = (cs?.questions.length ?? 0) + 1;
    const q = emptyQuestion(idx);
    patch((tr) => {
      tr.structure.practice.sections
        .find((s) => s.id === sectionId)
        ?.cases.find((c) => c.id === caseId)
        ?.questions.push(q);
    });
    setSelected({ kind: "question", sectionId, caseId, id: q.id });
  };
  const deleteTheory = (theoryId: string) => {
    patch((tr) => {
      tr.structure.theories = tr.structure.theories.filter((t) => t.id !== theoryId);
    });
    setSelected({ kind: "theoryBlock" });
    toast("Теория удалена");
  };
  const deleteSection = (sectionId: string) => {
    patch((tr) => {
      tr.structure.practice.sections = tr.structure.practice.sections.filter(
        (s) => s.id !== sectionId,
      );
    });
    setSelected({ kind: "practice" });
    toast("Раздел удалён");
  };
  const deleteCase = (sectionId: string, caseId: string) => {
    patch((tr) => {
      const sec = tr.structure.practice.sections.find((s) => s.id === sectionId);
      if (sec) sec.cases = sec.cases.filter((c) => c.id !== caseId);
    });
    setSelected({ kind: "section", id: sectionId });
    toast("Кейс удалён");
  };
  const deleteQuestion = (sectionId: string, caseId: string, questionId: string) => {
    patch((tr) => {
      const cs = tr.structure.practice.sections
        .find((s) => s.id === sectionId)
        ?.cases.find((c) => c.id === caseId);
      if (cs) cs.questions = cs.questions.filter((q) => q.id !== questionId);
    });
    setSelected({ kind: "case", sectionId, id: caseId });
    toast("Вопрос удалён");
  };
  const duplicateCase = (sectionId: string, caseId: string) => {
    patch((tr) => {
      const sec = tr.structure.practice.sections.find((s) => s.id === sectionId);
      if (!sec) return;
      const original = sec.cases.find((c) => c.id === caseId);
      if (!original) return;
      const cloned = deepClone(original);
      cloned.id = original.id + "-copy-" + Math.random().toString(36).slice(2, 6);
      cloned.name = original.name + " (копия)";
      cloned.questions.forEach((q) => {
        q.id = q.id + "-c-" + Math.random().toString(36).slice(2, 6);
        q.criteria.forEach((cr) => (cr.id = cr.id + "-c-" + Math.random().toString(36).slice(2, 6)));
        q.hints.forEach((h) => (h.id = h.id + "-c-" + Math.random().toString(36).slice(2, 6)));
      });
      const idx = sec.cases.findIndex((c) => c.id === caseId);
      sec.cases.splice(idx + 1, 0, cloned);
    });
    toast("Кейс продублирован");
  };
  const renameNode = (target: SelectedNode, name: string) => {
    patch((tr) => {
      if (target.kind === "section") {
        const s = tr.structure.practice.sections.find((x) => x.id === target.id);
        if (s) s.name = name;
      } else if (target.kind === "case") {
        const c = tr.structure.practice.sections
          .find((x) => x.id === target.sectionId)
          ?.cases.find((x) => x.id === target.id);
        if (c) c.name = name;
      } else if (target.kind === "question") {
        const q = tr.structure.practice.sections
          .find((x) => x.id === target.sectionId)
          ?.cases.find((x) => x.id === target.caseId)
          ?.questions.find((x) => x.id === target.id);
        if (q) q.name = name;
      } else if (target.kind === "theory") {
        const th = tr.structure.theories.find((x) => x.id === target.id);
        if (th) th.title = name;
      }
    });
  };

  /* breadcrumb */
  const breadcrumb = buildBreadcrumb(training, selected);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* HEADER */}
      <div className="h-[60px] shrink-0 bg-[hsl(var(--surface))] border-b border-border flex items-center px-4 gap-4">
        <Button variant="outline" size="sm" onClick={() => setLocation("/catalog")} className="gap-1 text-[hsl(var(--ink-muted))]">
          <ChevronLeft className="w-4 h-4" /> Каталог
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium truncate">{training.name}</div>
          <div className="text-[11.5px] text-[hsl(var(--ink-muted))] truncate">
            {breadcrumb}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill status={training.status} />
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setLocation(`/preview/${id}`)}>
            <Eye className="w-4 h-4" /> Предпросмотр
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setCheckOpen(true)}>
            <ShieldCheck className="w-4 h-4" />
            Проверить
            {report.errors.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-error text-white text-[11px] px-1">
                {report.errors.length}
              </span>
            )}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handlePublish}>
            <Send className="w-4 h-4" /> Опубликовать
          </Button>
        </div>
      </div>

      {/* FLOW STEPPER */}
      <div className="h-[52px] shrink-0 bg-[hsl(var(--surface))] border-b border-border flex items-center px-4">
        <div className="max-w-[1200px] mx-auto flex items-center gap-1 w-full">
          {steps.map((s, i) => {
            const status = stepStatus(s.key);
            const active = currentStepKey === s.key;
            return (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => goToStep(s.key)}
                  className={`group flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-[hsl(var(--ink-muted))] hover:bg-[hsl(216_20%_96%)]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-[hsl(216_20%_94%)] text-[hsl(var(--ink-muted))]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                  {status === "errors" && (
                    <span className="am-dot am-dot-error" title="Ошибки в блоке" />
                  )}
                </button>
                {i < steps.length - 1 && (
                  <div className="w-6 h-px bg-border mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] overflow-hidden">
        {/* LEFT TREE */}
        <aside className="bg-[hsl(var(--surface))] border-r border-border overflow-y-auto">
          <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-[hsl(var(--ink-muted))] font-medium">
            Структура
          </div>
          <div className="px-2">
            <BuilderTree
              training={training}
              selected={selected}
              onSelect={setSelected}
              report={report}
              onAddTheory={addTheory}
              onAddSection={addSection}
              onAddCase={addCase}
              onAddQuestion={addQuestion}
              onDeleteTheory={deleteTheory}
              onDeleteSection={deleteSection}
              onDeleteCase={deleteCase}
              onDeleteQuestion={deleteQuestion}
              onDuplicateCase={duplicateCase}
              onRename={renameNode}
            />
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[920px] mx-auto px-6 pt-8 pb-10">
              <SelectedEditor
                training={training}
                selected={selected}
                patch={patch}
                onSelect={setSelected}
                onAddTheory={addTheory}
                onAddSection={addSection}
                onAddCase={addCase}
                onAddQuestion={addQuestion}
              />
            </div>
          </div>
          <ScenarioFooter
            onSave={() => toast.success("Изменения сохранены")}
            onBack={stepIndex > 0 ? goPrevStep : undefined}
            primary={
              report.errors.length > 0
                ? { label: "Исправить ошибки", onClick: () => setCheckOpen(true) }
                : stepIndex === steps.length - 1
                  ? { label: "Опубликовать", onClick: handlePublish }
                  : { label: "Далее", onClick: goNextStep }
            }
            saveLabel="Сохранить черновик"
          />
        </div>

        {/* RIGHT INSPECTOR */}
        <aside className="bg-[hsl(var(--surface))] border-l border-border overflow-hidden">
          <Inspector
            training={training}
            selected={selected}
            report={report}
            onJump={setSelected}
          />
        </aside>
      </div>

      {/* CHECK DRAWER */}
      <Sheet open={checkOpen} onOpenChange={setCheckOpen}>
        <SheetContent side="right" className="w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Проверка обучения
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="rounded-xl p-4 border"
                 style={{
                   background: report.errors.length === 0 ? "hsl(var(--success) / 0.08)" : "hsl(var(--error) / 0.06)",
                   borderColor: report.errors.length === 0 ? "hsl(var(--success) / 0.4)" : "hsl(var(--error) / 0.4)",
                 }}>
              <div className="font-medium text-[14px] mb-1">
                {report.errors.length === 0
                  ? "Готово к публикации"
                  : `Найдено ошибок: ${report.errors.length}`}
              </div>
              <div className="text-[12.5px] text-[hsl(var(--ink-muted))]">
                Готовность: {report.readiness}%
              </div>
            </div>
            {report.errors.length === 0 ? (
              <div className="text-[13px] text-[hsl(var(--ink-muted))]">
                Все обязательные поля заполнены. Можно публиковать обучение.
              </div>
            ) : (
              <div className="space-y-2">
                {report.errors.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelected(e.target);
                      setCheckOpen(false);
                    }}
                    className="w-full text-left rounded-xl border border-border px-3 py-2.5 hover:border-error transition-colors"
                  >
                    <div className="text-[12px] text-[hsl(var(--ink-muted))]">
                      {e.blockTitle}
                    </div>
                    <div className="text-[13px] mt-0.5">{e.message}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-border p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCheckOpen(false)}>Закрыть</Button>
            {report.errors.length === 0 && (
              <Button onClick={() => { handlePublish(); setCheckOpen(false); }} className="gap-1.5">
                <Send className="w-4 h-4" /> Опубликовать
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function StatusPill({ status }: { status: Training["status"] }) {
  const map: Record<Training["status"], string> = {
    "Опубликовано": "am-dot-success",
    "Есть изменения": "am-dot-warning",
    "Есть ошибки": "am-dot-error",
    "Черновик": "am-dot-muted",
  };
  return (
    <span className="am-pill">
      <span className={`am-dot ${map[status]}`} />
      {status}
    </span>
  );
}

function buildBreadcrumb(t: Training, sel: SelectedNode): string {
  const parts: string[] = [t.type];
  switch (sel.kind) {
    case "root":
      parts.push("Обзор");
      break;
    case "onboarding":
      parts.push("Онбординг");
      break;
    case "theoryBlock":
      parts.push("Теория");
      break;
    case "theory": {
      const th = t.structure.theories.find((x) => x.id === sel.id);
      parts.push("Теория", th?.title || "Без названия");
      break;
    }
    case "practice":
      parts.push("Практика");
      break;
    case "section": {
      const s = t.structure.practice.sections.find((x) => x.id === sel.id);
      parts.push("Практика", s?.name ?? "");
      break;
    }
    case "case": {
      const s = t.structure.practice.sections.find((x) => x.id === sel.sectionId);
      const c = s?.cases.find((x) => x.id === sel.id);
      parts.push("Практика", s?.name ?? "", c?.name ?? "");
      break;
    }
    case "question": {
      const s = t.structure.practice.sections.find((x) => x.id === sel.sectionId);
      const c = s?.cases.find((x) => x.id === sel.caseId);
      const q = c?.questions.find((x) => x.id === sel.id);
      parts.push("Практика", s?.name ?? "", c?.name ?? "", q?.name ?? "");
      break;
    }
    case "finish":
      parts.push("Завершение");
      break;
  }
  return parts.filter(Boolean).join(" / ");
}

function SelectedEditor({
  training,
  selected,
  patch,
  onSelect,
  onAddTheory,
  onAddSection,
  onAddCase,
  onAddQuestion,
}: {
  training: Training;
  selected: SelectedNode;
  patch: (mut: (t: Training) => void) => void;
  onSelect: (n: SelectedNode) => void;
  onAddTheory: () => void;
  onAddSection: () => void;
  onAddCase: (sectionId: string) => void;
  onAddQuestion: (sectionId: string, caseId: string) => void;
}) {
  switch (selected.kind) {
    case "root":
      return <RootEditor training={training} />;
    case "onboarding":
      return <OnboardingEditor training={training} patch={patch} />;
    case "theoryBlock":
      return (
        <TheoryBlockEditor
          training={training}
          onAdd={onAddTheory}
          onSelectTheory={(id) => onSelect({ kind: "theory", id })}
        />
      );
    case "theory":
      return <TheoryEditor training={training} theoryId={selected.id} patch={patch} />;
    case "practice":
      return (
        <PracticeEditor
          training={training}
          onAddSection={onAddSection}
          onSelectSection={(id) => onSelect({ kind: "section", id })}
        />
      );
    case "section":
      return (
        <SectionEditor
          training={training}
          sectionId={selected.id}
          patch={patch}
          onAddCase={() => onAddCase(selected.id)}
          onSelectCase={(caseId) => onSelect({ kind: "case", sectionId: selected.id, id: caseId })}
        />
      );
    case "case":
      return (
        <CaseEditor
          training={training}
          sectionId={selected.sectionId}
          caseId={selected.id}
          patch={patch}
          onAddQuestion={() => onAddQuestion(selected.sectionId, selected.id)}
          onSelectQuestion={(qid) =>
            onSelect({ kind: "question", sectionId: selected.sectionId, caseId: selected.id, id: qid })
          }
        />
      );
    case "question":
      return (
        <QuestionEditor
          training={training}
          sectionId={selected.sectionId}
          caseId={selected.caseId}
          questionId={selected.id}
          patch={patch}
        />
      );
    case "finish":
      return <FinishEditor training={training} patch={patch} />;
  }
}
