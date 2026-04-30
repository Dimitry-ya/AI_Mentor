import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AnalyticsRecord,
  Employee,
  EmployeeRole,
  EmployeeStatus,
  Training,
  TrainingStatus,
  TrainingType,
} from "./lib/types";
import { emptyStructure, uid, deepCloneStructure } from "./lib/factory";
import { validateTraining } from "./lib/validation";
import { makeSeedAnalytics, makeSeedEmployees, makeSeedTrainings } from "./lib/seed";

const STORAGE_KEY = "ai-mentor:v1";

interface PersistShape {
  trainings: Training[];
  employees: Employee[];
  analytics: AnalyticsRecord[];
}

interface NewTrainingInput {
  name: string;
  type: TrainingType;
  category: string;
  topic: string;
  factory: string;
  direction: string;
  duration: string;
  description: string;
  cover: string | null;
  visibility: "Приватное" | "Публичное";
  templateId?: string | null;
}

interface AppContextValue {
  trainings: Training[];
  employees: Employee[];
  analytics: AnalyticsRecord[];
  getTraining: (id: string) => Training | undefined;
  createTraining: (input: NewTrainingInput) => Training;
  updateTraining: (id: string, mutate: (t: Training) => Training) => void;
  deleteTraining: (id: string) => void;
  duplicateTraining: (id: string) => Training | undefined;
  publishTraining: (id: string) => { ok: boolean; errors: number };
  unpublishTraining: (id: string) => void;
  setStatus: (id: string, status: TrainingStatus) => void;
  // Employees
  addEmployee: (emp: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployees: (ids: string[]) => void;
  bulkSetRole: (ids: string[], role: EmployeeRole) => void;
  bulkSetStatus: (ids: string[], status: EmployeeStatus) => void;
  // Analytics
  resetAttempt: (id: string) => void;
  // Reset all data
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadInitial(): PersistShape {
  if (typeof window === "undefined") {
    return { trainings: [], employees: [], analytics: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistShape;
  } catch {
    // fall through to seed
  }
  const trainings = makeSeedTrainings();
  const employees = makeSeedEmployees();
  const analytics = makeSeedAnalytics(trainings, employees);
  return { trainings, employees, analytics };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistShape>(loadInitial);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore quota errors silently
      }
    }, 200);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const getTraining = useCallback(
    (id: string) => state.trainings.find((t) => t.id === id),
    [state.trainings],
  );

  const createTraining = useCallback(
    (input: NewTrainingInput): Training => {
      const id = uid("tr-");
      const baseStructure = (() => {
        if (input.templateId) {
          const tpl = state.trainings.find((t) => t.id === input.templateId);
          if (tpl) return deepCloneStructure(tpl.structure);
        }
        return emptyStructure(input.type);
      })();
      const tr: Training = {
        id,
        name: input.name.trim(),
        type: input.type,
        status: "Черновик",
        category: input.category,
        topic: input.topic,
        factory: input.factory,
        direction: input.direction,
        duration: input.duration,
        description: input.description,
        cover: input.cover,
        visibility: input.visibility,
        author: "Анна Петрова",
        readiness: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: null,
        structure: baseStructure,
      };
      const report = validateTraining(tr);
      tr.readiness = report.readiness;
      setState((s) => ({ ...s, trainings: [tr, ...s.trainings] }));
      return tr;
    },
    [state.trainings],
  );

  const updateTraining = useCallback(
    (id: string, mutate: (t: Training) => Training) => {
      setState((s) => ({
        ...s,
        trainings: s.trainings.map((t) => {
          if (t.id !== id) return t;
          const next = mutate(t);
          const report = validateTraining(next);
          let nextStatus: TrainingStatus = next.status;
          if (t.status === "Опубликовано" && JSON.stringify(t.structure) !== JSON.stringify(next.structure)) {
            nextStatus = "Есть изменения";
          }
          return {
            ...next,
            status: nextStatus,
            readiness: report.readiness,
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [],
  );

  const deleteTraining = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      trainings: s.trainings.filter((t) => t.id !== id),
      analytics: s.analytics.filter((a) => a.trainingId !== id),
    }));
  }, []);

  const duplicateTraining = useCallback(
    (id: string): Training | undefined => {
      const src = state.trainings.find((t) => t.id === id);
      if (!src) return undefined;
      const copy: Training = {
        ...src,
        id: uid("tr-"),
        name: `${src.name} (копия)`,
        status: "Черновик",
        publishedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        structure: deepCloneStructure(src.structure),
      };
      const report = validateTraining(copy);
      copy.readiness = report.readiness;
      setState((s) => ({ ...s, trainings: [copy, ...s.trainings] }));
      return copy;
    },
    [state.trainings],
  );

  const publishTraining = useCallback(
    (id: string) => {
      const tr = state.trainings.find((t) => t.id === id);
      if (!tr) return { ok: false, errors: 0 };
      const report = validateTraining(tr);
      if (report.errors.length > 0) {
        setState((s) => ({
          ...s,
          trainings: s.trainings.map((t) =>
            t.id === id ? { ...t, status: "Есть ошибки" as TrainingStatus } : t,
          ),
        }));
        return { ok: false, errors: report.errors.length };
      }
      setState((s) => ({
        ...s,
        trainings: s.trainings.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "Опубликовано" as TrainingStatus,
                publishedAt: Date.now(),
                readiness: 100,
              }
            : t,
        ),
      }));
      return { ok: true, errors: 0 };
    },
    [state.trainings],
  );

  const unpublishTraining = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      trainings: s.trainings.map((t) =>
        t.id === id ? { ...t, status: "Черновик" as TrainingStatus, publishedAt: null } : t,
      ),
    }));
  }, []);

  const setStatus = useCallback((id: string, status: TrainingStatus) => {
    setState((s) => ({
      ...s,
      trainings: s.trainings.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, []);

  // Employees
  const addEmployee = useCallback((emp: Omit<Employee, "id">) => {
    setState((s) => ({
      ...s,
      employees: [{ ...emp, id: uid("emp-") }, ...s.employees],
    }));
  }, []);

  const updateEmployee = useCallback((id: string, patch: Partial<Employee>) => {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteEmployees = useCallback((ids: string[]) => {
    setState((s) => ({
      ...s,
      employees: s.employees.filter((e) => e.protected || !ids.includes(e.id)),
      analytics: s.analytics.filter((a) => !ids.includes(a.employeeId)),
    }));
  }, []);

  const bulkSetRole = useCallback((ids: string[], role: EmployeeRole) => {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) =>
        ids.includes(e.id) && !e.protected ? { ...e, role } : e,
      ),
    }));
  }, []);

  const bulkSetStatus = useCallback((ids: string[], status: EmployeeStatus) => {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) =>
        ids.includes(e.id) && !e.protected ? { ...e, status } : e,
      ),
    }));
  }, []);

  const resetAttempt = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      analytics: s.analytics.map((a) =>
        a.id === id
          ? { ...a, status: "Назначено", score: null, attempts: 0, timeMinutes: 0, lastActivity: Date.now() }
          : a,
      ),
    }));
  }, []);

  const resetAll = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    const trainings = makeSeedTrainings();
    const employees = makeSeedEmployees();
    const analytics = makeSeedAnalytics(trainings, employees);
    setState({ trainings, employees, analytics });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      trainings: state.trainings,
      employees: state.employees,
      analytics: state.analytics,
      getTraining,
      createTraining,
      updateTraining,
      deleteTraining,
      duplicateTraining,
      publishTraining,
      unpublishTraining,
      setStatus,
      addEmployee,
      updateEmployee,
      deleteEmployees,
      bulkSetRole,
      bulkSetStatus,
      resetAttempt,
      resetAll,
    }),
    [
      state,
      getTraining,
      createTraining,
      updateTraining,
      deleteTraining,
      duplicateTraining,
      publishTraining,
      unpublishTraining,
      setStatus,
      addEmployee,
      updateEmployee,
      deleteEmployees,
      bulkSetRole,
      bulkSetStatus,
      resetAttempt,
      resetAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be inside AppProvider");
  return ctx;
}

export type { Training, TrainingType, TrainingStatus } from "./lib/types";
