import { useMemo } from "react";
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Wand2,
  Check,
  RotateCcw,
  Lock,
  Tag,
  ListChecks,
  Lightbulb,
  Phone,
  CreditCard,
  Receipt,
  Percent,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ABOOK_CATEGORIES, SILENCE_ACTIONS } from "@/lib/constants";
import {
  emptyCriterion,
  emptyHint,
  emptyQuestion,
  uid,
} from "@/lib/factory";
import type {
  CaseItem,
  Finish,
  Onboarding,
  Question,
  Section,
  Theory,
  Training,
} from "@/lib/types";

/* ============================ ONBOARDING ============================ */

export function OnboardingEditor({
  training,
  patch,
}: {
  training: Training;
  patch: (mut: (t: Training) => void) => void;
}) {
  const ob = training.structure.onboarding;
  const item = ob.items[0]!;
  return (
    <Section title="Онбординг" icon={<Sparkles className="w-4 h-4" />} subtitle="Первое, что увидит сотрудник: цель и формат обучения.">
      <Field label="Заголовок *" hint="Короткая фраза приветствия, до 80 символов.">
        <Input
          value={item.title}
          maxLength={80}
          onChange={(e) =>
            patch((t) => {
              t.structure.onboarding.items[0]!.title = e.target.value;
            })
          }
          placeholder="Например: Готовы прокачать навык продажи кредитной карты?"
        />
      </Field>
      <Field label="Текст *" hint="Расскажите, что внутри и сколько займёт времени.">
        <Textarea
          rows={5}
          value={item.text}
          maxLength={600}
          onChange={(e) =>
            patch((t) => {
              t.structure.onboarding.items[0]!.text = e.target.value;
            })
          }
          placeholder="За 30 минут разберём ключевые сценарии и потренируемся отвечать клиенту."
        />
      </Field>
      <Field label="Текст кнопки" hint="До 60 символов. По умолчанию — «Начать»." >
        <Input
          value={ob.buttonText}
          maxLength={60}
          onChange={(e) =>
            patch((t) => {
              t.structure.onboarding.buttonText = e.target.value;
            })
          }
        />
      </Field>
    </Section>
  );
}

/* ============================ THEORY BLOCK ============================ */

export function TheoryBlockEditor({
  training,
  onAdd,
  onSelectTheory,
}: {
  training: Training;
  onAdd: () => void;
  onSelectTheory: (id: string) => void;
}) {
  return (
    <Section title="Теоретический блок" icon={<BookOpen className="w-4 h-4" />} subtitle="Подготовительные карточки с теорией. Берутся из A-Book и редактируются вручную.">
      {training.structure.theories.length === 0 ? (
        <Empty
          title="Теорий пока нет"
          text="Добавьте первую карточку — мы возьмём контент из A-Book и сформируем результат для проверки."
          action={<Button onClick={onAdd} className="gap-1"><Plus className="w-4 h-4" /> Добавить теорию</Button>}
        />
      ) : (
        <div className="space-y-2">
          {training.structure.theories.map((th, i) => (
            <button
              key={th.id}
              onClick={() => onSelectTheory(th.id)}
              className="w-full text-left rounded-xl border border-border px-4 py-3 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-[14px]">
                  {th.title || `Теория ${i + 1}`}
                </div>
                {th.approved ? (
                  <span className="am-pill text-[hsl(var(--success))] border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.08)]">
                    <Check className="w-3 h-3" /> Утверждена
                  </span>
                ) : (
                  <span className="am-pill">Черновик</span>
                )}
              </div>
              {th.aBookCategory && (
                <div className="text-[12px] text-[hsl(var(--ink-muted))] mt-1">
                  A-Book: {th.aBookCategory}
                </div>
              )}
            </button>
          ))}
          <Button variant="outline" onClick={onAdd} className="gap-1 w-full mt-2">
            <Plus className="w-4 h-4" /> Добавить теорию
          </Button>
        </div>
      )}
    </Section>
  );
}

/* ============================ THEORY ITEM ============================ */

export function TheoryEditor({
  training,
  theoryId,
  patch,
}: {
  training: Training;
  theoryId: string;
  patch: (mut: (t: Training) => void) => void;
}) {
  const idx = training.structure.theories.findIndex((t) => t.id === theoryId);
  const th = training.structure.theories[idx];
  if (!th) return null;
  const isApproved = th.approved;

  const update = (mut: (th: Theory) => void) =>
    patch((t) => {
      const target = t.structure.theories.find((x) => x.id === theoryId);
      if (target) mut(target);
    });

  const generate = () => {
    const queries = th.aBookQueries.filter((q) => q.trim()).slice(0, 3);
    const seed = queries.length ? queries.join("; ") : th.title || "теме обучения";
    update((x) => {
      x.result =
        `Краткое содержание по «${seed}»:\n\n` +
        `1. Ключевые правила и регламенты, которые применяются к ${seed}.\n` +
        `2. Что важно проговорить клиенту с первой реплики.\n` +
        `3. Типовые подводные камни и как их избежать.`;
    });
  };

  return (
    <Section
      title={`Теория ${idx + 1}`}
      icon={<BookOpen className="w-4 h-4" />}
      subtitle={isApproved ? "Карточка утверждена. Снимите флажок, чтобы внести изменения." : "Заполните черновик, выберите рубрику A-Book и сгенерируйте результат."}
    >
      <Field label="Заголовок *">
        <Input
          value={th.title}
          maxLength={120}
          disabled={isApproved}
          onChange={(e) => update((x) => (x.title = e.target.value))}
          placeholder="Например: Условия по кредитной карте"
        />
      </Field>
      <Field label="Текст черновика" hint="Опционально. Можно оставить только запросы к A-Book.">
        <Textarea
          rows={4}
          value={th.text}
          maxLength={1000}
          disabled={isApproved}
          onChange={(e) => update((x) => (x.text = e.target.value))}
          placeholder="Заметки автора, ключевые тезисы…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Рубрика A-Book *">
          <Select
            value={th.aBookCategory ?? ""}
            disabled={isApproved}
            onValueChange={(v) => update((x) => (x.aBookCategory = v))}
          >
            <SelectTrigger className="bg-[hsl(var(--surface))]"><SelectValue placeholder="Выберите рубрику" /></SelectTrigger>
            <SelectContent>{ABOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Промпт для AI" hint="Подсказка для генерации, опционально.">
          <Input
            value={th.prompt}
            disabled={isApproved}
            onChange={(e) => update((x) => (x.prompt = e.target.value))}
            placeholder="Например: краткие правила для оператора"
          />
        </Field>
      </div>

      <Field label="Запросы к A-Book *" hint="По одному запросу на строку. Минимум один.">
        <div className="space-y-2">
          {th.aBookQueries.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={q}
                disabled={isApproved}
                placeholder={`Запрос ${i + 1}`}
                onChange={(e) =>
                  update((x) => {
                    x.aBookQueries[i] = e.target.value;
                  })
                }
              />
              {th.aBookQueries.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isApproved}
                  onClick={() =>
                    update((x) => {
                      x.aBookQueries.splice(i, 1);
                    })
                  }
                >
                  <Trash2 className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={isApproved}
            onClick={() => update((x) => x.aBookQueries.push(""))}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Добавить запрос
          </Button>
        </div>
      </Field>

      <div className="rounded-xl border border-border bg-[hsl(var(--surface))] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Wand2 className="w-4 h-4 text-primary" />
            Результат генерации
          </div>
          <div className="flex items-center gap-2">
            {th.result && !isApproved && (
              <Button variant="outline" size="sm" onClick={generate} className="gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Перегенерировать
              </Button>
            )}
            {!th.result && !isApproved && (
              <Button size="sm" onClick={generate} className="gap-1">
                <Wand2 className="w-3.5 h-3.5" /> Сгенерировать
              </Button>
            )}
          </div>
        </div>
        {th.result ? (
          <Textarea
            rows={6}
            value={th.result}
            disabled={isApproved}
            onChange={(e) => update((x) => (x.result = e.target.value))}
          />
        ) : (
          <div className="text-[13px] text-[hsl(var(--ink-muted))]">
            Заполните рубрику и хотя бы один запрос к A-Book, затем сгенерируйте результат.
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isApproved}
              disabled={!th.result}
              onChange={(e) => update((x) => (x.approved = e.target.checked))}
              className="w-4 h-4 accent-[hsl(var(--success))]"
            />
            <span className={isApproved ? "text-[hsl(var(--success))] font-medium" : ""}>
              {isApproved ? "Результат утверждён — карточка заблокирована" : "Утвердить результат"}
            </span>
            {isApproved && <Lock className="w-3.5 h-3.5 text-[hsl(var(--success))]" />}
          </label>
          {!th.result && (
            <span className="text-[12px] text-[hsl(var(--ink-muted))]">
              Сначала сгенерируйте результат
            </span>
          )}
        </div>
      </div>

      <Field label="Текст кнопки" hint="До 60 символов.">
        <Input
          value={th.buttonText}
          maxLength={60}
          onChange={(e) => update((x) => (x.buttonText = e.target.value))}
        />
      </Field>
    </Section>
  );
}

/* ============================ PRACTICE ============================ */

export function PracticeEditor({
  training,
  onAddSection,
  onSelectSection,
}: {
  training: Training;
  onAddSection: () => void;
  onSelectSection: (id: string) => void;
}) {
  return (
    <Section
      title="Практический блок"
      icon={<ListChecks className="w-4 h-4" />}
      subtitle="Разделы группируют кейсы по темам. В каждом кейсе — карточка клиента и вопросы с критериями оценки."
    >
      {training.structure.practice.sections.length === 0 ? (
        <Empty
          title="Разделов пока нет"
          text="Добавьте первый раздел — внутри него вы сможете создавать кейсы."
          action={<Button onClick={onAddSection} className="gap-1"><Plus className="w-4 h-4" /> Добавить раздел</Button>}
        />
      ) : (
        <div className="space-y-2">
          {training.structure.practice.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSection(s.id)}
              className="w-full text-left rounded-xl border border-border px-4 py-3 hover:border-primary transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-[14px]">{s.name}</div>
                <div className="text-[12px] text-[hsl(var(--ink-muted))] mt-0.5">
                  Кейсов: {s.cases.length}, вопросов: {s.cases.reduce((a, c) => a + c.questions.length, 0)}
                </div>
              </div>
            </button>
          ))}
          <Button variant="outline" onClick={onAddSection} className="gap-1 w-full mt-2">
            <Plus className="w-4 h-4" /> Добавить раздел
          </Button>
        </div>
      )}
    </Section>
  );
}

export function SectionEditor({
  training,
  sectionId,
  patch,
  onAddCase,
  onSelectCase,
}: {
  training: Training;
  sectionId: string;
  patch: (mut: (t: Training) => void) => void;
  onAddCase: () => void;
  onSelectCase: (caseId: string) => void;
}) {
  const sec = training.structure.practice.sections.find((s) => s.id === sectionId);
  if (!sec) return null;
  const update = (mut: (s: Section) => void) =>
    patch((t) => {
      const target = t.structure.practice.sections.find((x) => x.id === sectionId);
      if (target) mut(target);
    });
  return (
    <Section title={sec.name} icon={<Tag className="w-4 h-4" />} subtitle="Группа кейсов на одну тему.">
      <Field label="Название раздела *">
        <Input
          value={sec.name}
          maxLength={80}
          onChange={(e) => update((s) => (s.name = e.target.value))}
        />
      </Field>
      <div className="space-y-2">
        <div className="text-[13px] font-medium">Кейсы ({sec.cases.length})</div>
        {sec.cases.length === 0 ? (
          <Empty
            title="В разделе нет кейсов"
            text="Добавьте первый кейс — это сценарий разговора с клиентом."
            action={<Button onClick={onAddCase} className="gap-1"><Plus className="w-4 h-4" /> Добавить кейс</Button>}
          />
        ) : (
          <div className="space-y-2">
            {sec.cases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="w-full text-left rounded-xl border border-border px-4 py-3 hover:border-primary transition-colors"
              >
                <div className="font-medium text-[14px]">{c.name}</div>
                <div className="text-[12px] text-[hsl(var(--ink-muted))] mt-0.5 line-clamp-1">
                  {c.description || "Описание кейса не заполнено"}
                </div>
              </button>
            ))}
            <Button variant="outline" onClick={onAddCase} className="gap-1 w-full mt-1">
              <Plus className="w-4 h-4" /> Добавить кейс
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ============================ CASE ============================ */

export function CaseEditor({
  training,
  sectionId,
  caseId,
  patch,
  onAddQuestion,
  onSelectQuestion,
}: {
  training: Training;
  sectionId: string;
  caseId: string;
  patch: (mut: (t: Training) => void) => void;
  onAddQuestion: () => void;
  onSelectQuestion: (questionId: string) => void;
}) {
  const sec = training.structure.practice.sections.find((s) => s.id === sectionId);
  const cs = sec?.cases.find((c) => c.id === caseId);
  if (!cs) return null;
  const update = (mut: (c: CaseItem) => void) =>
    patch((t) => {
      const target = t.structure.practice.sections
        .find((s) => s.id === sectionId)
        ?.cases.find((c) => c.id === caseId);
      if (target) mut(target);
    });

  const cardSections: { key: keyof CaseItem["clientCard"]; title: string; icon: React.ReactNode }[] = [
    { key: "creditCardDetails", title: "Детали по кредитной карте", icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: "contractTerms", title: "Условия договора", icon: <Receipt className="w-3.5 h-3.5" /> },
    { key: "rates", title: "Ставки", icon: <Percent className="w-3.5 h-3.5" /> },
    { key: "cardInfo", title: "Сведения о карте", icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <Section title={cs.name} icon={<Phone className="w-4 h-4" />} subtitle="Описание ситуации, карточка клиента и сценарий разговора.">
      <Field label="Название кейса *">
        <Input
          value={cs.name}
          maxLength={120}
          onChange={(e) => update((c) => (c.name = e.target.value))}
        />
      </Field>
      <Field label="Описание ситуации *" hint="Контекст, который покажем сотруднику перед разговором.">
        <Textarea
          rows={4}
          value={cs.description}
          maxLength={800}
          onChange={(e) => update((c) => (c.description = e.target.value))}
          placeholder="Клиент звонит и просит увеличить лимит. Карточный продукт оформлен 6 месяцев назад…"
        />
      </Field>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-[hsl(var(--surface))] border-b border-border text-[13px] font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Карточка клиента
        </div>
        <div className="divide-y">
          {cardSections.map((cardSection) => (
            <div key={cardSection.key} className="p-4">
              <div className="text-[12px] font-medium text-[hsl(var(--ink-muted))] flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                {cardSection.icon}
                {cardSection.title}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {cs.clientCard[cardSection.key].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr] gap-2 items-center">
                    <div className="text-[12.5px] text-[hsl(var(--ink-muted))]">{row.label}</div>
                    <Input
                      value={row.value}
                      onChange={(e) =>
                        update((c) => {
                          c.clientCard[cardSection.key][idx]!.value = e.target.value;
                        })
                      }
                      placeholder="—"
                      size={32}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Тишина клиента, сек">
          <Input
            type="number"
            min={5}
            max={120}
            value={cs.silenceSeconds}
            onChange={(e) => update((c) => (c.silenceSeconds = Math.max(5, Math.min(120, Number(e.target.value) || 0))))}
          />
        </Field>
        <Field label="Действие при тишине">
          <Select value={cs.silenceAction} onValueChange={(v) => update((c) => (c.silenceAction = v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SILENCE_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-2">
        <div className="text-[13px] font-medium">Вопросы ({cs.questions.length})</div>
        {cs.questions.length === 0 ? (
          <Empty
            title="Вопросов в кейсе пока нет"
            text="Добавьте вопрос, по которому AI будет проверять ответы сотрудника."
            action={<Button onClick={onAddQuestion} className="gap-1"><Plus className="w-4 h-4" /> Добавить вопрос</Button>}
          />
        ) : (
          <div className="space-y-2">
            {cs.questions.map((q) => (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className="w-full text-left rounded-xl border border-border px-4 py-3 hover:border-primary transition-colors"
              >
                <div className="font-medium text-[14px]">{q.name}</div>
                <div className="text-[12px] text-[hsl(var(--ink-muted))] mt-0.5 line-clamp-1">
                  {q.text || "Текст вопроса не заполнен"}
                </div>
              </button>
            ))}
            <Button variant="outline" onClick={onAddQuestion} className="gap-1 w-full mt-1">
              <Plus className="w-4 h-4" /> Добавить вопрос
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ============================ QUESTION ============================ */

export function QuestionEditor({
  training,
  sectionId,
  caseId,
  questionId,
  patch,
}: {
  training: Training;
  sectionId: string;
  caseId: string;
  questionId: string;
  patch: (mut: (t: Training) => void) => void;
}) {
  const qs = training.structure.practice.sections
    .find((s) => s.id === sectionId)
    ?.cases.find((c) => c.id === caseId)
    ?.questions.find((q) => q.id === questionId);
  if (!qs) return null;
  const update = (mut: (q: Question) => void) =>
    patch((t) => {
      const target = t.structure.practice.sections
        .find((s) => s.id === sectionId)
        ?.cases.find((c) => c.id === caseId)
        ?.questions.find((q) => q.id === questionId);
      if (target) mut(target);
    });

  const totalScore = useMemo(
    () => qs.criteria.reduce((sum, c) => sum + (c.text.trim() ? Number(c.score) || 0 : 0), 0),
    [qs.criteria],
  );

  return (
    <Section title={qs.name} icon={<ListChecks className="w-4 h-4" />} subtitle="Вопрос, по которому AI проверит ответ. Критерии задают распределение баллов.">
      <Field label="Название вопроса">
        <Input value={qs.name} maxLength={80} onChange={(e) => update((q) => (q.name = e.target.value))} />
      </Field>
      <Field label="Текст вопроса *" hint="То, что услышит сотрудник от клиента.">
        <Textarea
          rows={3}
          maxLength={500}
          value={qs.text}
          onChange={(e) => update((q) => (q.text = e.target.value))}
          placeholder="Какие данные нужно проверить, прежде чем согласовать повышение лимита?"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Рубрика A-Book">
          <Select
            value={qs.aBookCategory ?? ""}
            onValueChange={(v) => update((q) => (q.aBookCategory = v))}
          >
            <SelectTrigger className="bg-[hsl(var(--surface))]"><SelectValue placeholder="Выберите рубрику" /></SelectTrigger>
            <SelectContent>{ABOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Запросы к A-Book" hint="Через запятую.">
          <Input
            value={qs.aBookQueries.join(", ")}
            onChange={(e) =>
              update((q) => (q.aBookQueries = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)))
            }
            placeholder="запрос 1, запрос 2"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-[hsl(var(--surface))] border-b border-border text-[13px] font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" /> Критерии оценки *
          </span>
          <span className={`text-[12px] ${totalScore === 100 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]"}`}>
            Сумма баллов: {totalScore} / 100
          </span>
        </div>
        <div className="p-4 space-y-2">
          {qs.criteria.map((c, i) => (
            <div key={c.id} className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
              <Input
                value={c.text}
                placeholder={`Критерий ${i + 1}`}
                onChange={(e) =>
                  update((q) => {
                    q.criteria[i]!.text = e.target.value;
                  })
                }
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={c.score}
                onChange={(e) =>
                  update((q) => {
                    q.criteria[i]!.score = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  update((q) => {
                    q.criteria.splice(i, 1);
                  })
                }
                disabled={qs.criteria.length <= 1}
              >
                <Trash2 className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => update((q) => q.criteria.push(emptyCriterion()))}
          >
            <Plus className="w-4 h-4" /> Добавить критерий
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-[hsl(var(--surface))] border-b border-border text-[13px] font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Подсказки
        </div>
        <div className="p-4 space-y-2">
          {qs.hints.length === 0 ? (
            <div className="text-[13px] text-[hsl(var(--ink-muted))]">
              Подсказки появятся, если сотрудник не справляется. Можно привязать к конкретному критерию.
            </div>
          ) : (
            qs.hints.map((h, i) => (
              <div key={h.id} className="grid grid-cols-[1fr_220px_36px] gap-2 items-start">
                <Textarea
                  value={h.text}
                  rows={2}
                  placeholder="Текст подсказки"
                  onChange={(e) =>
                    update((q) => {
                      q.hints[i]!.text = e.target.value;
                    })
                  }
                />
                <Select
                  value={h.criterionId ?? "none"}
                  onValueChange={(v) =>
                    update((q) => {
                      q.hints[i]!.criterionId = v === "none" ? null : v;
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не привязана</SelectItem>
                    {qs.criteria.map((c, idx) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.text || `Критерий ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    update((q) => {
                      q.hints.splice(i, 1);
                    })
                  }
                >
                  <Trash2 className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                </Button>
              </div>
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => update((q) => q.hints.push(emptyHint()))}
          >
            <Plus className="w-4 h-4" /> Добавить подсказку
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ============================ FINISH ============================ */

export function FinishEditor({
  training,
  patch,
}: {
  training: Training;
  patch: (mut: (t: Training) => void) => void;
}) {
  const f = training.structure.finish;
  const update = (mut: (f: Finish) => void) =>
    patch((t) => mut(t.structure.finish));
  return (
    <Section title="Завершение" icon={<Check className="w-4 h-4" />} subtitle="Что увидит сотрудник в конце обучения.">
      <Field label="Заголовок *">
        <Input
          value={f.title}
          maxLength={120}
          onChange={(e) => update((x) => (x.title = e.target.value))}
          placeholder="Готово, обучение завершено"
        />
      </Field>
      <Field label="Текст *">
        <Textarea
          rows={5}
          value={f.text}
          maxLength={600}
          onChange={(e) => update((x) => (x.text = e.target.value))}
          placeholder="Спасибо за внимание. Используйте полученные знания в реальных диалогах с клиентами."
        />
      </Field>
    </Section>
  );
}

/* ============================ ROOT (SUMMARY) ============================ */

export function RootEditor({ training }: { training: Training }) {
  const t = training;
  const stat = (label: string, value: string | number) => (
    <div className="rounded-xl border border-border p-4 bg-[hsl(var(--surface))]">
      <div className="text-[12px] text-[hsl(var(--ink-muted))]">{label}</div>
      <div className="text-[18px] font-semibold mt-1">{value}</div>
    </div>
  );
  return (
    <Section title={t.name || "Без названия"} icon={<Sparkles className="w-4 h-4" />} subtitle="Общий обзор обучения. Меняйте структуру в дереве слева.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Тип", t.type)}
        {stat("Готовность", `${t.readiness}%`)}
        {stat("Кейсов", t.structure.practice.sections.reduce((a, s) => a + s.cases.length, 0))}
        {stat("Вопросов", t.structure.practice.sections.reduce((a, s) => a + s.cases.reduce((b, c) => b + c.questions.length, 0), 0))}
      </div>
      <div className="rounded-xl border border-border p-4 bg-[hsl(var(--surface))] text-[13.5px] leading-relaxed text-[hsl(var(--ink))]">
        {t.description || "Описание обучения не заполнено."}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MiniRow label="Категория" value={t.category} />
        <MiniRow label="Тематика" value={t.topic} />
        <MiniRow label="Фабрика" value={t.factory} />
        <MiniRow label="Направление" value={t.direction} />
        <MiniRow label="Длительность" value={t.duration} />
        <MiniRow label="Видимость" value={t.visibility} />
      </div>
    </Section>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px] py-1.5 border-b border-border last:border-0">
      <span className="text-[hsl(var(--ink-muted))]">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

/* ============================ HELPERS ============================ */

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-[13.5px] text-[hsl(var(--ink-muted))]">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <div className="text-[12px] text-[hsl(var(--ink-muted))]">{hint}</div>}
    </div>
  );
}

function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <div className="text-[14px] font-medium">{title}</div>
      <div className="text-[12.5px] text-[hsl(var(--ink-muted))] mt-1 max-w-sm mx-auto">{text}</div>
      {action && <div className="mt-3 inline-block">{action}</div>}
    </div>
  );
}

export { uid as _uidUnused, emptyQuestion as _emptyQUnused };
