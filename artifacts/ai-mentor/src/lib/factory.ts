import type {
  CaseItem,
  ClientCard,
  Criterion,
  Finish,
  Hint,
  Onboarding,
  Practice,
  Question,
  Section,
  Structure,
  Theory,
  TrainingType,
} from "./types";

export const uid = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function emptyClientCard(): ClientCard {
  return {
    creditCardDetails: [
      { label: "Ближайший платёж", value: "" },
      { label: "Пропуск платежа", value: "" },
      { label: "Общая задолженность на сегодня", value: "" },
      { label: "Покупки в первые 30 дней", value: "" },
      { label: "Покупки с 31 дня и снятие наличных", value: "" },
      { label: "Погашение КК в другом банке", value: "" },
      { label: "Доступный лимит", value: "" },
      { label: "Просроченная задолженность", value: "" },
      { label: "Штрафы и неустойки", value: "" },
    ],
    contractTerms: [
      { label: "Общая сумма кредита", value: "" },
      { label: "Подписание ДС о беспроцентном периоде", value: "" },
      { label: "Дата выдачи", value: "" },
    ],
    rates: [
      { label: "Покупки в первые 30 дней", value: "" },
      { label: "Покупки с 31 дня", value: "" },
      { label: "Снятие наличных", value: "" },
      { label: "Погашение КК в другом банке", value: "" },
    ],
    cardInfo: [
      { label: "Баланс", value: "" },
      { label: "Стоимость обслуживания", value: "" },
      { label: "Лимит на снятие наличных без комиссии", value: "" },
      { label: "Комиссия за снятие в банкоматах Альфа-Банка", value: "" },
      { label: "Комиссия за снятие в сторонних банкоматах", value: "" },
    ],
  };
}

export function emptyOnboarding(): Onboarding {
  return {
    items: [{ id: uid("oi-"), title: "", text: "" }],
    buttonText: "Начать",
  };
}

export function emptyTheory(): Theory {
  return {
    id: uid("th-"),
    title: "",
    text: "",
    aBookCategory: null,
    aBookQueries: [""],
    prompt: "",
    result: null,
    approved: false,
    buttonText: "Ознакомился, далее",
  };
}

export function emptyCriterion(): Criterion {
  return { id: uid("cr-"), text: "", score: 0 };
}

export function emptyHint(): Hint {
  return { id: uid("hn-"), text: "", criterionId: null };
}

export function emptyQuestion(index = 1): Question {
  return {
    id: uid("qs-"),
    name: `Вопрос ${index}`,
    text: "",
    aBookCategory: null,
    aBookQueries: [],
    criteria: [emptyCriterion(), emptyCriterion(), emptyCriterion()],
    hints: [],
  };
}

export function emptyCase(index = 1): CaseItem {
  return {
    id: uid("cs-"),
    name: `Кейс ${index}`,
    description: "",
    clientCard: emptyClientCard(),
    silenceSeconds: 30,
    silenceAction: "Дать подсказку",
    questions: [emptyQuestion(1)],
  };
}

export function emptySection(index = 1): Section {
  return {
    id: uid("sc-"),
    name: `Раздел ${index}`,
    cases: [emptyCase(1)],
  };
}

export function emptyPractice(): Practice {
  return { sections: [emptySection(1)] };
}

export function emptyFinish(): Finish {
  return { title: "", text: "" };
}

export function emptyStructure(_type: TrainingType): Structure {
  return {
    onboarding: emptyOnboarding(),
    theories: [],
    practice: emptyPractice(),
    finish: emptyFinish(),
  };
}

export function deepCloneStructure(s: Structure): Structure {
  const clone = JSON.parse(JSON.stringify(s)) as Structure;
  // regenerate ids
  clone.onboarding.items = clone.onboarding.items.map((it) => ({ ...it, id: uid("oi-") }));
  clone.theories = clone.theories.map((t) => ({ ...t, id: uid("th-") }));
  clone.practice.sections = clone.practice.sections.map((s) => ({
    ...s,
    id: uid("sc-"),
    cases: s.cases.map((c) => ({
      ...c,
      id: uid("cs-"),
      questions: c.questions.map((q) => ({
        ...q,
        id: uid("qs-"),
        criteria: q.criteria.map((cr) => ({ ...cr, id: uid("cr-") })),
        hints: q.hints.map((h) => ({ ...h, id: uid("hn-") })),
      })),
    })),
  }));
  return clone;
}
