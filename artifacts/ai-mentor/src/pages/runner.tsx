import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Mic,
  CreditCard,
  Receipt,
  Percent,
  Settings,
  RefreshCcw,
  PartyPopper,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "../store";
import type { CaseItem, Question, Section, Training } from "@/lib/types";

type RunnerMode = "preview" | "learner" | "sandbox";

interface RunnerStep {
  kind: "onboarding" | "theory" | "case" | "finish";
  index: number;
  total: number;
  label: string;
  payload:
    | { kind: "onboarding" }
    | { kind: "theory"; theoryId: string }
    | { kind: "case"; sectionId: string; caseId: string }
    | { kind: "finish" };
}

export function RunnerPage({ mode }: { mode: RunnerMode }) {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const { getTraining } = useAppStore();
  const training = getTraining(id);
  const [stepIdx, setStepIdx] = useState(0);
  const [scoresByQuestion, setScoresByQuestion] = useState<Record<string, number>>({});
  const [hintsShownByQuestion, setHintsShownByQuestion] = useState<Record<string, boolean>>({});

  const steps = useMemo<RunnerStep[]>(() => {
    if (!training) return [];
    const arr: RunnerStep[] = [];
    arr.push({ kind: "onboarding", index: 0, total: 0, label: "Онбординг", payload: { kind: "onboarding" } });
    if (training.type === "Тренажёр") {
      training.structure.theories.forEach((th, i) =>
        arr.push({
          kind: "theory",
          index: 0,
          total: 0,
          label: `Теория ${i + 1}`,
          payload: { kind: "theory", theoryId: th.id },
        }),
      );
    }
    training.structure.practice.sections.forEach((s) => {
      s.cases.forEach((c) => {
        arr.push({
          kind: "case",
          index: 0,
          total: 0,
          label: `${s.name} · ${c.name}`,
          payload: { kind: "case", sectionId: s.id, caseId: c.id },
        });
      });
    });
    arr.push({ kind: "finish", index: 0, total: 0, label: "Завершение", payload: { kind: "finish" } });
    return arr.map((s, i, all) => ({ ...s, index: i, total: all.length }));
  }, [training]);

  if (!training) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-[18px] font-semibold mb-2">Обучение не найдено</div>
          <Button onClick={() => setLocation("/catalog")}>В каталог</Button>
        </div>
      </div>
    );
  }

  const current = steps[stepIdx]!;
  const goNext = () => setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));
  const restart = () => {
    setStepIdx(0);
    setScoresByQuestion({});
    setHintsShownByQuestion({});
  };

  const totalScore = Object.values(scoresByQuestion).reduce((a, b) => a + b, 0);
  const maxScore = countMaxScore(training);
  const finalPercent = maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 100);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="h-[56px] shrink-0 bg-[hsl(var(--surface))] border-b border-border flex items-center px-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() =>
            setLocation(mode === "learner" ? "/catalog" : `/builder/${id}`)
          }
        >
          <ChevronLeft className="w-4 h-4" />
          {mode === "learner" ? "В каталог" : "К редактору"}
        </Button>
        <div className="h-6 w-px bg-border mx-3" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium truncate">{training.name}</div>
          <div className="text-[11px] text-[hsl(var(--ink-muted))]">
            {modeLabel(mode)} · Шаг {stepIdx + 1} из {steps.length}
          </div>
        </div>
        {mode !== "learner" && (
          <Button size="sm" variant="secondary" onClick={restart} className="gap-1.5">
            <RefreshCcw className="w-4 h-4" /> Сбросить
          </Button>
        )}
      </div>

      {/* Prominent progress block */}
      <div className="bg-[hsl(var(--surface))] border-b border-border">
        <div className="max-w-[920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-[12px] text-[hsl(var(--ink-muted))] mb-2">
            <span>{current.label}</span>
            <span>
              {Math.round(((stepIdx + 1) / steps.length) * 100)}% пройдено
            </span>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < stepIdx
                    ? "bg-primary"
                    : i === stepIdx
                      ? "bg-primary"
                      : "bg-[hsl(216_20%_92%)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[920px] mx-auto px-6 py-10">
          {current.payload.kind === "onboarding" && (
            <OnboardingScene training={training} onNext={goNext} />
          )}
          {current.payload.kind === "theory" && (
            <TheoryScene
              training={training}
              theoryId={current.payload.theoryId}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {current.payload.kind === "case" && (
            <CaseScene
              training={training}
              sectionId={current.payload.sectionId}
              caseId={current.payload.caseId}
              onNext={goNext}
              onBack={goBack}
              onScoreQuestion={(qid, score) =>
                setScoresByQuestion((s) => ({ ...s, [qid]: score }))
              }
              onShowHint={(qid) =>
                setHintsShownByQuestion((s) => ({ ...s, [qid]: true }))
              }
              hintsShown={hintsShownByQuestion}
            />
          )}
          {current.payload.kind === "finish" && (
            <FinishScene
              training={training}
              percent={finalPercent}
              onRestart={restart}
              onExit={() => setLocation("/catalog")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function modeLabel(mode: RunnerMode): string {
  if (mode === "preview") return "Предпросмотр (без оценки)";
  if (mode === "sandbox") return "Сэндбокс (тестовый запуск)";
  return "Прохождение";
}

function countMaxScore(t: Training): number {
  let sum = 0;
  t.structure.practice.sections.forEach((s) =>
    s.cases.forEach((c) =>
      c.questions.forEach((q) =>
        q.criteria.forEach((cr) => {
          if (cr.text.trim()) sum += cr.score;
        }),
      ),
    ),
  );
  return sum;
}

/* ============================ ONBOARDING SCENE ============================ */

function OnboardingScene({ training, onNext }: { training: Training; onNext: () => void }) {
  const ob = training.structure.onboarding.items[0]!;
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7" />
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight max-w-2xl mx-auto leading-tight">
        {ob.title || "Заголовок онбординга"}
      </h1>
      <p className="text-[15px] text-[hsl(var(--ink-muted))] mt-3 max-w-xl mx-auto leading-relaxed">
        {ob.text || "Текст онбординга появится здесь."}
      </p>
      <div className="mt-8">
        <Button size="lg" onClick={onNext}>
          {training.structure.onboarding.buttonText || "Начать"}
        </Button>
      </div>
    </div>
  );
}

/* ============================ THEORY SCENE ============================ */

function TheoryScene({
  training,
  theoryId,
  onNext,
  onBack,
}: {
  training: Training;
  theoryId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const th = training.structure.theories.find((t) => t.id === theoryId);
  if (!th) return null;
  return (
    <div>
      <div className="am-card p-7">
        <div className="text-[12px] uppercase tracking-wide text-primary font-medium mb-2">
          Теория
        </div>
        <h2 className="text-[24px] font-semibold tracking-tight">{th.title || "Без названия"}</h2>
        {th.aBookCategory && (
          <div className="text-[12.5px] text-[hsl(var(--ink-muted))] mt-1">
            Источник: A-Book · {th.aBookCategory}
          </div>
        )}
        <div className="prose prose-sm max-w-none mt-5 text-[14.5px] leading-relaxed whitespace-pre-line">
          {th.result || th.text || "Содержание появится после генерации."}
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Назад
        </Button>
        <Button onClick={onNext}>
          {th.buttonText || "Ознакомился, далее"}
        </Button>
      </div>
    </div>
  );
}

/* ============================ CASE SCENE ============================ */

function CaseScene({
  training,
  sectionId,
  caseId,
  onNext,
  onBack,
  onScoreQuestion,
  onShowHint,
  hintsShown,
}: {
  training: Training;
  sectionId: string;
  caseId: string;
  onNext: () => void;
  onBack: () => void;
  onScoreQuestion: (qid: string, score: number) => void;
  onShowHint: (qid: string) => void;
  hintsShown: Record<string, boolean>;
}) {
  const sec = training.structure.practice.sections.find((s) => s.id === sectionId);
  const cs = sec?.cases.find((c) => c.id === caseId);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<null | EvalResult>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [silenceLeft, setSilenceLeft] = useState<number | null>(null);

  // reset on case change
  useEffect(() => {
    setQIdx(0);
    setAnswer("");
    setEvaluation(null);
  }, [caseId]);

  // silence timer per question
  useEffect(() => {
    setAnswer("");
    setEvaluation(null);
    if (!cs) return;
    setSilenceLeft(cs.silenceSeconds);
    const i = window.setInterval(() => {
      setSilenceLeft((v) => {
        if (v === null) return v;
        if (v <= 1) {
          window.clearInterval(i);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(i);
  }, [cs?.id, qIdx]);

  if (!sec || !cs) return null;
  const q = cs.questions[qIdx];
  if (!q) {
    // case has no questions — go next
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--ink-muted))] mb-4">В этом кейсе пока нет вопросов.</p>
        <Button onClick={onNext}>Дальше</Button>
      </div>
    );
  }

  const evaluate = () => {
    setEvaluating(true);
    window.setTimeout(() => {
      const result = evalAnswer(q, answer);
      setEvaluation(result);
      onScoreQuestion(q.id, result.totalScore);
      setEvaluating(false);
    }, 600);
  };

  const next = () => {
    if (qIdx + 1 < cs.questions.length) {
      setQIdx((i) => i + 1);
      return;
    }
    onNext();
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
      {/* Dialog area */}
      <div className="space-y-5">
        <div className="am-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))] font-medium">
              {sec.name}
            </div>
            <div className="text-[12px] text-[hsl(var(--ink-muted))]">
              Вопрос {qIdx + 1} из {cs.questions.length}
            </div>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight mt-1">{cs.name}</h2>
          <p className="text-[13.5px] text-[hsl(var(--ink-muted))] mt-2 leading-relaxed">
            {cs.description || "Описание ситуации не заполнено."}
          </p>
        </div>

        <div className="am-card p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(216_20%_94%)] flex items-center justify-center text-[12px] font-medium shrink-0">
              К
            </div>
            <div className="flex-1">
              <div className="text-[12px] text-[hsl(var(--ink-muted))]">Клиент</div>
              <div className="text-[15px] mt-1 leading-relaxed">{q.text || "Текст вопроса не заполнен."}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] text-[hsl(var(--ink-muted))]">Ваш ответ</label>
              <div className="text-[11.5px] text-[hsl(var(--ink-muted))] flex items-center gap-1">
                {silenceLeft !== null && silenceLeft > 0 && (
                  <>
                    <Pause className="w-3 h-3" />
                    Тишина: {silenceLeft} с до подсказки
                  </>
                )}
                {silenceLeft === 0 && (
                  <span className="text-[hsl(var(--warning))] flex items-center gap-1">
                    <Play className="w-3 h-3" /> Тишина превышена — реакция: {cs.silenceAction}
                  </span>
                )}
              </div>
            </div>
            <Textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Сформулируйте ответ как в реальном диалоге…"
              disabled={!!evaluation}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-[12px] text-[hsl(var(--ink-muted))] flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Голосовой ввод появится в следующих версиях
              </div>
              <div className="flex items-center gap-2">
                {q.hints.length > 0 && !evaluation && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => onShowHint(q.id)}
                    disabled={hintsShown[q.id]}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {hintsShown[q.id] ? "Подсказка показана" : "Показать подсказку"}
                  </Button>
                )}
                {!evaluation ? (
                  <Button onClick={evaluate} disabled={!answer.trim() || evaluating} className="gap-1">
                    {evaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Проверяем
                      </>
                    ) : (
                      "Проверить ответ"
                    )}
                  </Button>
                ) : (
                  <Button onClick={next} className="gap-1">
                    {qIdx + 1 < cs.questions.length ? "Следующий вопрос" : "Дальше"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hintsShown[q.id] && q.hints.length > 0 && (
            <div className="mt-4 rounded-xl border border-[hsl(34_94%_85%)] bg-[hsl(34_94%_96%)] p-3">
              <div className="text-[12px] font-medium text-[hsl(34_60%_30%)] mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Подсказка
              </div>
              <div className="text-[13px] text-[hsl(var(--ink))]">
                {q.hints[0]?.text || "У этого вопроса есть подсказка, но текст не задан."}
              </div>
            </div>
          )}

          {evaluation && (
            <EvaluationCard ev={evaluation} q={q} />
          )}
        </div>
      </div>

      {/* Right client card */}
      <ClientCard cs={cs} />
    </div>
  );
}

function ClientCard({ cs }: { cs: CaseItem }) {
  const groups: { title: string; icon: React.ReactNode; key: keyof CaseItem["clientCard"] }[] = [
    { title: "Кредитная карта", icon: <CreditCard className="w-3.5 h-3.5" />, key: "creditCardDetails" },
    { title: "Договор", icon: <Receipt className="w-3.5 h-3.5" />, key: "contractTerms" },
    { title: "Ставки", icon: <Percent className="w-3.5 h-3.5" />, key: "rates" },
    { title: "Сведения", icon: <Settings className="w-3.5 h-3.5" />, key: "cardInfo" },
  ];
  return (
    <div className="am-card sticky top-4">
      <div className="px-4 py-3 border-b border-border text-[13px] font-medium flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-primary" /> Карточка клиента
      </div>
      <div className="divide-y">
        {groups.map((g) => {
          const filled = cs.clientCard[g.key].filter((r) => r.value.trim());
          if (filled.length === 0) return null;
          return (
            <div key={g.key} className="p-3.5">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--ink-muted))] font-medium flex items-center gap-1 mb-2">
                {g.icon}
                {g.title}
              </div>
              <div className="space-y-1.5">
                {filled.map((r, i) => (
                  <div key={i} className="text-[12.5px] flex justify-between gap-3">
                    <span className="text-[hsl(var(--ink-muted))]">{r.label}</span>
                    <span className="font-medium text-right">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EvalResult {
  perCriterion: { id: string; text: string; score: number; max: number; matched: boolean }[];
  totalScore: number;
  maxScore: number;
  feedback: string;
}

function evalAnswer(q: Question, answer: string): EvalResult {
  const text = answer.toLowerCase();
  const valid = q.criteria.filter((c) => c.text.trim());
  const perCriterion = valid.map((c) => {
    const tokens = c.text
      .toLowerCase()
      .split(/[\s,.;:]+/)
      .filter((t) => t.length > 3);
    const matched = tokens.length > 0 && tokens.some((t) => text.includes(t));
    // basic scoring: matched gives full, otherwise partial based on length
    const partial = !matched && answer.trim().length > 30;
    const score = matched ? c.score : partial ? Math.round(c.score * 0.4) : 0;
    return { id: c.id, text: c.text, score, max: c.score, matched };
  });
  const totalScore = perCriterion.reduce((a, c) => a + c.score, 0);
  const maxScore = perCriterion.reduce((a, c) => a + c.max, 0);
  const pct = maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 100);
  const feedback =
    pct >= 80
      ? "Отлично, ответ закрывает основные критерии. Продолжайте в том же духе."
      : pct >= 50
        ? "Хорошо, но часть критериев пропущена. Постарайтесь быть конкретнее."
        : "Стоит вернуться к теории и переформулировать ответ — критерии остались без покрытия.";
  return { perCriterion, totalScore, maxScore, feedback };
}

function EvaluationCard({ ev, q }: { ev: EvalResult; q: Question }) {
  const pct = ev.maxScore === 0 ? 0 : Math.round((ev.totalScore / ev.maxScore) * 100);
  void q;
  return (
    <div className="mt-5 rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 bg-[hsl(var(--surface))] border-b border-border flex items-center justify-between">
        <div className="text-[13px] font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Результат проверки
        </div>
        <div className="text-[13px] font-semibold">
          {ev.totalScore} / {ev.maxScore} ({pct}%)
        </div>
      </div>
      <div className="p-4 space-y-2">
        {ev.perCriterion.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_100px] gap-3 items-center">
            <div className="text-[13px] flex items-center gap-2">
              <span className={`am-dot ${c.matched ? "am-dot-success" : c.score > 0 ? "am-dot-warning" : "am-dot-error"}`} />
              {c.text}
            </div>
            <div className="text-[12.5px] text-right text-[hsl(var(--ink-muted))]">
              {c.score} / {c.max}
            </div>
          </div>
        ))}
        <div className="pt-3 mt-2 border-t border-border text-[13px] text-[hsl(var(--ink))]">
          {ev.feedback}
        </div>
      </div>
    </div>
  );
}

/* ============================ FINISH SCENE ============================ */

function FinishScene({
  training,
  percent,
  onRestart,
  onExit,
}: {
  training: Training;
  percent: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const f = training.structure.finish;
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] flex items-center justify-center mb-5">
        <PartyPopper className="w-7 h-7" />
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight">
        {f.title || "Готово, обучение завершено"}
      </h1>
      <p className="text-[15px] text-[hsl(var(--ink-muted))] mt-3 max-w-xl mx-auto leading-relaxed">
        {f.text || "Спасибо за внимание."}
      </p>
      <div className="mt-7 inline-flex flex-col gap-3 items-center">
        <div className="text-[13px] uppercase tracking-wide text-[hsl(var(--ink-muted))]">
          Итоговый результат
        </div>
        <div className="text-[44px] font-semibold leading-none">{percent}%</div>
      </div>
      <div className="mt-8 flex justify-center gap-2">
        <Button variant="outline" onClick={onRestart} className="gap-1.5">
          <RefreshCcw className="w-4 h-4" /> Пройти заново
        </Button>
        <Button onClick={onExit}>В каталог</Button>
      </div>
    </div>
  );
}
