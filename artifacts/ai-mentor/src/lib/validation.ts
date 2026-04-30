import type {
  SelectedNode,
  Training,
  ValidationError,
  ValidationReport,
} from "./types";

const blockKey = (n: SelectedNode): string => {
  switch (n.kind) {
    case "root":
      return "root";
    case "onboarding":
      return "onboarding";
    case "theoryBlock":
      return "theoryBlock";
    case "theory":
      return `theory:${n.id}`;
    case "practice":
      return "practice";
    case "section":
      return `section:${n.id}`;
    case "case":
      return `case:${n.id}`;
    case "question":
      return `question:${n.id}`;
    case "finish":
      return "finish";
  }
};

export function validateTraining(t: Training): ValidationReport {
  const errors: ValidationError[] = [];
  const byBlock: Record<string, "ready" | "errors" | "empty"> = {};

  // Onboarding
  const ob = t.structure.onboarding;
  const obErrors: ValidationError[] = [];
  if (!ob.items.length || !ob.items[0]?.title.trim()) {
    obErrors.push({
      blockKind: "onboarding",
      blockTitle: "Онбординг",
      field: "title",
      message: "Не заполнен заголовок онбординга",
      target: { kind: "onboarding" },
    });
  }
  if (!ob.items.length || !ob.items[0]?.text.trim()) {
    obErrors.push({
      blockKind: "onboarding",
      blockTitle: "Онбординг",
      field: "text",
      message: "Не заполнен текст онбординга",
      target: { kind: "onboarding" },
    });
  }
  if (ob.buttonText && ob.buttonText.length > 60) {
    obErrors.push({
      blockKind: "onboarding",
      blockTitle: "Онбординг",
      field: "buttonText",
      message: "Текст кнопки длиннее 60 символов",
      target: { kind: "onboarding" },
    });
  }
  errors.push(...obErrors);
  byBlock[blockKey({ kind: "onboarding" })] =
    obErrors.length > 0 ? "errors" : "ready";

  // Theories (only for тренажёр)
  if (t.type === "Тренажёр") {
    const theoryBlockErrors: ValidationError[] = [];
    if (t.structure.theories.length === 0) {
      theoryBlockErrors.push({
        blockKind: "theoryBlock",
        blockTitle: "Теоретический блок",
        field: "theories",
        message: "Добавьте хотя бы одну теорию",
        target: { kind: "theoryBlock" },
      });
    }
    t.structure.theories.forEach((th, idx) => {
      const tErrors: ValidationError[] = [];
      if (!th.title.trim()) {
        tErrors.push({
          blockKind: "theory",
          blockTitle: `Теория ${idx + 1}`,
          field: "title",
          message: `Не заполнен заголовок Теории ${idx + 1}`,
          target: { kind: "theory", id: th.id },
        });
      }
      if (!th.aBookCategory) {
        tErrors.push({
          blockKind: "theory",
          blockTitle: `Теория ${idx + 1}`,
          field: "aBookCategory",
          message: `Не выбрана рубрика A-Book для Теории ${idx + 1}`,
          target: { kind: "theory", id: th.id },
        });
      }
      if (!th.aBookQueries.some((q) => q.trim())) {
        tErrors.push({
          blockKind: "theory",
          blockTitle: `Теория ${idx + 1}`,
          field: "aBookQueries",
          message: `Добавьте хотя бы один запрос к A-Book для Теории ${idx + 1}`,
          target: { kind: "theory", id: th.id },
        });
      }
      errors.push(...tErrors);
      byBlock[blockKey({ kind: "theory", id: th.id })] =
        tErrors.length > 0 ? "errors" : "ready";
    });
    errors.push(...theoryBlockErrors);
    byBlock[blockKey({ kind: "theoryBlock" })] =
      theoryBlockErrors.length === 0 &&
      t.structure.theories.every(
        (th) => byBlock[blockKey({ kind: "theory", id: th.id })] === "ready",
      )
        ? "ready"
        : t.structure.theories.length === 0
          ? "empty"
          : "errors";
  }

  // Practice
  const practiceErrors: ValidationError[] = [];
  if (t.structure.practice.sections.length === 0) {
    practiceErrors.push({
      blockKind: "practice",
      blockTitle: "Практический блок",
      field: "sections",
      message: "Добавьте хотя бы один раздел",
      target: { kind: "practice" },
    });
  }
  let practiceHasErrors = practiceErrors.length > 0;
  t.structure.practice.sections.forEach((sec) => {
    const secErrors: ValidationError[] = [];
    if (sec.cases.length === 0) {
      secErrors.push({
        blockKind: "section",
        blockTitle: sec.name,
        field: "cases",
        message: `В разделе «${sec.name}» нет кейсов`,
        target: { kind: "section", id: sec.id },
      });
    }
    let secHasErrors = secErrors.length > 0;
    sec.cases.forEach((cs) => {
      const csErrors: ValidationError[] = [];
      if (!cs.description.trim()) {
        csErrors.push({
          blockKind: "case",
          blockTitle: cs.name,
          field: "description",
          message: `${cs.name} без описания`,
          target: { kind: "case", sectionId: sec.id, id: cs.id },
        });
      }
      if (cs.questions.length === 0) {
        csErrors.push({
          blockKind: "case",
          blockTitle: cs.name,
          field: "questions",
          message: `${cs.name} без вопросов`,
          target: { kind: "case", sectionId: sec.id, id: cs.id },
        });
      }
      let caseHasErrors = csErrors.length > 0;
      cs.questions.forEach((qs, qIdx) => {
        const qsErrors: ValidationError[] = [];
        if (!qs.text.trim()) {
          qsErrors.push({
            blockKind: "question",
            blockTitle: qs.name,
            field: "text",
            message: `${qs.name} без текста`,
            target: {
              kind: "question",
              sectionId: sec.id,
              caseId: cs.id,
              id: qs.id,
            },
          });
        }
        const validCriteria = qs.criteria.filter((cr) => cr.text.trim());
        if (validCriteria.length === 0) {
          qsErrors.push({
            blockKind: "question",
            blockTitle: qs.name,
            field: "criteria",
            message: `${qs.name}: добавьте хотя бы один критерий`,
            target: {
              kind: "question",
              sectionId: sec.id,
              caseId: cs.id,
              id: qs.id,
            },
          });
        }
        qs.criteria.forEach((cr, crIdx) => {
          if (cr.text.trim() && (cr.score < 0 || cr.score > 100)) {
            qsErrors.push({
              blockKind: "question",
              blockTitle: qs.name,
              field: `criteria[${crIdx}].score`,
              message: `${qs.name}: балл критерия ${crIdx + 1} вне диапазона 0–100`,
              target: {
                kind: "question",
                sectionId: sec.id,
                caseId: cs.id,
                id: qs.id,
              },
            });
          }
        });
        errors.push(...qsErrors);
        byBlock[blockKey({ kind: "question", sectionId: sec.id, caseId: cs.id, id: qs.id })] =
          qsErrors.length > 0 ? "errors" : "ready";
        if (qsErrors.length) caseHasErrors = true;
        void qIdx;
      });
      errors.push(...csErrors);
      byBlock[blockKey({ kind: "case", sectionId: sec.id, id: cs.id })] = caseHasErrors
        ? "errors"
        : "ready";
      if (caseHasErrors) secHasErrors = true;
    });
    errors.push(...secErrors);
    byBlock[blockKey({ kind: "section", id: sec.id })] = secHasErrors ? "errors" : "ready";
    if (secHasErrors) practiceHasErrors = true;
  });
  errors.push(...practiceErrors);
  byBlock[blockKey({ kind: "practice" })] = practiceHasErrors ? "errors" : "ready";

  // Finish
  const finishErrors: ValidationError[] = [];
  if (!t.structure.finish.title.trim()) {
    finishErrors.push({
      blockKind: "finish",
      blockTitle: "Завершение",
      field: "title",
      message: "Не заполнен заголовок завершения",
      target: { kind: "finish" },
    });
  }
  if (!t.structure.finish.text.trim()) {
    finishErrors.push({
      blockKind: "finish",
      blockTitle: "Завершение",
      field: "text",
      message: "Не заполнен текст завершения",
      target: { kind: "finish" },
    });
  }
  errors.push(...finishErrors);
  byBlock[blockKey({ kind: "finish" })] = finishErrors.length ? "errors" : "ready";

  // Readiness: count fields total / filled
  const totals = countCompletion(t);
  const readiness = totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);

  return { errors, readiness, byBlock };
}

function countCompletion(t: Training) {
  let total = 0;
  let done = 0;

  // Onboarding
  total += 2;
  if (t.structure.onboarding.items[0]?.title.trim()) done++;
  if (t.structure.onboarding.items[0]?.text.trim()) done++;

  // Theories
  if (t.type === "Тренажёр") {
    total += 1; // at least one theory
    if (t.structure.theories.length > 0) done++;
    t.structure.theories.forEach((th) => {
      total += 3;
      if (th.title.trim()) done++;
      if (th.aBookCategory) done++;
      if (th.aBookQueries.some((q) => q.trim())) done++;
    });
  }

  // Practice
  total += 1;
  if (t.structure.practice.sections.length > 0) done++;
  t.structure.practice.sections.forEach((sec) => {
    total += 1;
    if (sec.cases.length > 0) done++;
    sec.cases.forEach((cs) => {
      total += 2;
      if (cs.description.trim()) done++;
      if (cs.questions.length > 0) done++;
      cs.questions.forEach((qs) => {
        total += 2;
        if (qs.text.trim()) done++;
        if (qs.criteria.some((cr) => cr.text.trim())) done++;
      });
    });
  });

  // Finish
  total += 2;
  if (t.structure.finish.title.trim()) done++;
  if (t.structure.finish.text.trim()) done++;

  return { total, done };
}
