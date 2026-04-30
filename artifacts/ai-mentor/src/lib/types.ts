export type TrainingType = "Тренажёр" | "Экзамен";
export type TrainingStatus =
  | "Черновик"
  | "Есть изменения"
  | "Опубликовано"
  | "Есть ошибки";
export type Visibility = "Приватное" | "Публичное";

export interface OnboardingItem {
  id: string;
  title: string;
  text: string;
}
export interface Onboarding {
  items: OnboardingItem[];
  buttonText: string;
}

export interface Theory {
  id: string;
  title: string;
  text: string;
  aBookCategory: string | null;
  aBookQueries: string[];
  prompt: string;
  result: string | null;
  approved: boolean;
  buttonText: string;
}

export interface Criterion {
  id: string;
  text: string;
  score: number;
}

export interface Hint {
  id: string;
  text: string;
  criterionId: string | null;
}

export interface Question {
  id: string;
  name: string;
  text: string;
  aBookCategory: string | null;
  aBookQueries: string[];
  criteria: Criterion[];
  hints: Hint[];
}

export type ClientCardField = { label: string; value: string };

export interface ClientCard {
  creditCardDetails: ClientCardField[];
  contractTerms: ClientCardField[];
  rates: ClientCardField[];
  cardInfo: ClientCardField[];
}

export interface CaseItem {
  id: string;
  name: string;
  description: string;
  clientCard: ClientCard;
  silenceSeconds: number;
  silenceAction: string;
  questions: Question[];
}

export interface Section {
  id: string;
  name: string;
  cases: CaseItem[];
}

export interface Practice {
  sections: Section[];
}

export interface Finish {
  title: string;
  text: string;
}

export interface Structure {
  onboarding: Onboarding;
  theories: Theory[];
  practice: Practice;
  finish: Finish;
}

export interface Training {
  id: string;
  name: string;
  type: TrainingType;
  status: TrainingStatus;
  category: string;
  topic: string;
  factory: string;
  direction: string;
  duration: string;
  description: string;
  cover: string | null;
  visibility: Visibility;
  author: string;
  readiness: number;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  structure: Structure;
}

export type EmployeeRole = "Администратор" | "Редактор" | "Просмотр";
export type EmployeeStatus = "Активен" | "Заблокирован";

export interface Employee {
  id: string;
  name: string;
  tabel: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  protected?: boolean;
}

export type AnalyticsStatus = "Назначено" | "В процессе" | "Завершено";

export interface AnalyticsRecord {
  id: string;
  employeeId: string;
  trainingId: string;
  status: AnalyticsStatus;
  score: number | null;
  attempts: number;
  timeMinutes: number;
  lastActivity: number;
}

export type SelectedNode =
  | { kind: "root" }
  | { kind: "onboarding" }
  | { kind: "theoryBlock" }
  | { kind: "theory"; id: string }
  | { kind: "practice" }
  | { kind: "section"; id: string }
  | { kind: "case"; sectionId: string; id: string }
  | { kind: "question"; sectionId: string; caseId: string; id: string }
  | { kind: "finish" };

export interface ValidationError {
  blockKind: SelectedNode["kind"];
  blockTitle: string;
  field: string;
  message: string;
  target: SelectedNode;
}

export interface ValidationReport {
  errors: ValidationError[];
  readiness: number;
  byBlock: Record<string, "ready" | "errors" | "empty">;
}
