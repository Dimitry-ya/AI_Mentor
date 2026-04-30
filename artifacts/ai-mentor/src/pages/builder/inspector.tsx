import { Sparkles, AlertTriangle, CheckCircle2, ListChecks, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedNode, Training, ValidationReport } from "@/lib/types";

interface Props {
  training: Training;
  selected: SelectedNode;
  report: ValidationReport;
  onJump: (n: SelectedNode) => void;
}

export function Inspector({ training, selected, report, onJump }: Props) {
  const localErrors = report.errors.filter((e) => sameTarget(e.target, selected));
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))]">
            Готовность
          </div>
          <div className="text-[13px] font-semibold">{report.readiness}%</div>
        </div>
        <div className="h-2 bg-[hsl(216_20%_94%)] rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width]"
            style={{ width: `${report.readiness}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))] mb-2">
          AI-подсказки
        </div>
        <div className="rounded-xl bg-[hsl(216_20%_98%)] border border-border p-3 text-[13px] leading-relaxed">
          {currentTip(selected, training)}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))] mb-2 flex items-center justify-between">
          <span>Проблемы в этом блоке</span>
          {localErrors.length === 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-error" />
          )}
        </div>
        {localErrors.length === 0 ? (
          <div className="text-[12.5px] text-[hsl(var(--ink-muted))]">
            Этот блок без ошибок.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {localErrors.map((e, i) => (
              <li key={i} className="text-[12.5px] text-[hsl(var(--ink))] flex gap-2">
                <span className="am-dot am-dot-error mt-1.5" />
                <span>{e.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))] mb-2">
          Сводка по обучению
        </div>
        <div className="space-y-1.5 text-[12.5px]">
          <Stat label="Тип" value={training.type} />
          <Stat label="Кейсов" value={String(training.structure.practice.sections.reduce((a, s) => a + s.cases.length, 0))} />
          <Stat
            label="Вопросов"
            value={String(
              training.structure.practice.sections.reduce(
                (a, s) => a + s.cases.reduce((b, c) => b + c.questions.length, 0),
                0,
              ),
            )}
          />
          <Stat label="Ошибок всего" value={String(report.errors.length)} />
        </div>

        {report.errors.length > 0 && (
          <div className="mt-4">
            <div className="text-[12px] uppercase tracking-wide text-[hsl(var(--ink-muted))] mb-2">
              Все проблемы
            </div>
            <div className="space-y-1">
              {report.errors.slice(0, 30).map((e, i) => (
                <button
                  key={i}
                  onClick={() => onJump(e.target)}
                  className="w-full text-left text-[12.5px] rounded-lg border border-border px-2.5 py-2 hover:border-primary/50 hover:bg-[hsl(216_20%_98%)] transition-colors flex gap-2"
                >
                  <ListChecks className="w-3.5 h-3.5 text-error mt-0.5 shrink-0" />
                  <span className="leading-snug">{e.message}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full mt-4 gap-1" disabled>
          <Wand2 className="w-3.5 h-3.5" />
          AI-помощник (скоро)
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[hsl(var(--ink-muted))]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function currentTip(selected: SelectedNode, _t: Training): string {
  switch (selected.kind) {
    case "root":
      return "Заполните дерево слева: онбординг, теорию, кейсы и завершение. Когда всё готово — нажмите «Опубликовать».";
    case "onboarding":
      return "Чёткий онбординг настраивает на тему. Озвучьте, чему сотрудник научится за время прохождения.";
    case "theoryBlock":
      return "Теория формируется на основе A-Book. Каждая карточка — одна тема, которую нужно утвердить, прежде чем публиковать.";
    case "theory":
      return "Сначала выберите рубрику A-Book и добавьте запросы — генерация даст черновик, который можно поправить и утвердить.";
    case "practice":
      return "Группируйте кейсы по разделам, чтобы у сотрудника был логичный путь — от простого к сложному.";
    case "section":
      return "Один раздел — одна тема. Старайтесь держать в нём 1–4 кейса.";
    case "case":
      return "Опишите ситуацию и заполните карточку клиента — это контекст, который AI учитывает при оценке.";
    case "question":
      return "Чем точнее критерии и баллы (сумма ~100), тем стабильнее работает AI-проверка.";
    case "finish":
      return "Завершение — короткое поздравление и напоминание, как применять знания.";
  }
}

function sameTarget(a: SelectedNode, b: SelectedNode): boolean {
  if (a.kind !== b.kind) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
