import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { GraduationCap, ClipboardList, FileText, LayoutTemplate, Upload, X } from "lucide-react";
import { useAppStore, type TrainingType } from "../store";
import {
  CATEGORIES,
  DIRECTIONS_BY_FACTORY,
  DURATIONS,
  FACTORIES,
  TOPICS,
} from "../lib/constants";
import { toast } from "sonner";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_COVER_BYTES = 2 * 1024 * 1024;

export function Wizard({ isOpen, onClose }: WizardProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<TrainingType | null>(null);
  const [method, setMethod] = useState<"new" | "template" | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [factory, setFactory] = useState("");
  const [direction, setDirection] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [touchedName, setTouchedName] = useState(false);

  const { trainings, createTraining } = useAppStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isOpen) {
      // reset on close
      setStep(1);
      setType(null);
      setMethod(null);
      setTemplateId(null);
      setName("");
      setCategory("");
      setTopic("");
      setFactory("");
      setDirection("");
      setDuration("");
      setDescription("");
      setCover(null);
      setCoverError(null);
      setTouchedName(false);
    }
  }, [isOpen]);

  const templates = useMemo(
    () => trainings.filter((t) => t.type === type && t.status === "Опубликовано"),
    [trainings, type],
  );

  const directions = factory ? DIRECTIONS_BY_FACTORY[factory] ?? [] : [];

  const nameError = touchedName && !name.trim() ? "Название обязательно" : null;

  const canStep3 =
    name.trim().length > 0 &&
    category &&
    topic &&
    factory &&
    direction &&
    duration;

  const handleCoverFile = async (file: File | null) => {
    if (!file) return;
    setCoverError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setCoverError("Поддерживаются PNG, JPG, WebP");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError("Размер файла больше 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCover(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    setTouchedName(true);
    if (!canStep3 || !type) return;
    const tr = createTraining({
      name,
      type,
      category,
      topic,
      factory,
      direction,
      duration,
      description,
      cover,
      visibility: "Приватное",
      templateId: method === "template" ? templateId : null,
    });
    onClose();
    toast.success("Обучение создано");
    setLocation(`/builder/${tr.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-[18px]">
              {step === 1 && "Что создаём?"}
              {step === 2 && "Способ создания"}
              {step === 3 && "Настройка обучения"}
            </DialogTitle>
            <div className="text-[12px] text-[hsl(var(--ink-muted))]">Шаг {step} из 3</div>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-[hsl(220_13%_91%)]"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-6 min-h-[320px]">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("Тренажёр")}
                className={`p-5 rounded-2xl text-left transition-all border ${
                  type === "Тренажёр"
                    ? "border-primary ring-2 ring-primary/15 bg-primary/[0.03]"
                    : "border-border hover:border-[hsl(var(--ink-muted))]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="font-semibold text-[15px] mb-1">Тренажёр</div>
                <div className="text-[13px] text-[hsl(var(--ink-muted))] leading-snug">
                  Онбординг, теория с A-Book, практика с AI-проверкой и подсказками.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType("Экзамен")}
                className={`p-5 rounded-2xl text-left transition-all border ${
                  type === "Экзамен"
                    ? "border-primary ring-2 ring-primary/15 bg-primary/[0.03]"
                    : "border-border hover:border-[hsl(var(--ink-muted))]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="font-semibold text-[15px] mb-1">Экзамен</div>
                <div className="text-[13px] text-[hsl(var(--ink-muted))] leading-snug">
                  Проверка знаний без теоретического блока: онбординг, кейсы, итог.
                </div>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("new");
                    setTemplateId(null);
                  }}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    method === "new"
                      ? "border-primary ring-2 ring-primary/15 bg-primary/[0.03]"
                      : "border-border hover:border-[hsl(var(--ink-muted))]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-[15px] mb-1">С нуля</div>
                  <div className="text-[13px] text-[hsl(var(--ink-muted))] leading-snug">
                    Пустая структура — соберём шаги вручную.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("template")}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    method === "template"
                      ? "border-primary ring-2 ring-primary/15 bg-primary/[0.03]"
                      : "border-border hover:border-[hsl(var(--ink-muted))]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-[15px] mb-1">Из шаблона</div>
                  <div className="text-[13px] text-[hsl(var(--ink-muted))] leading-snug">
                    Скопировать структуру опубликованного обучения и доработать.
                  </div>
                </button>
              </div>

              {method === "template" && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[13px]">Выберите шаблон</Label>
                  {templates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-[13px] text-[hsl(var(--ink-muted))]">
                      Опубликованных {type === "Экзамен" ? "экзаменов" : "тренажёров"} пока нет.
                      Выберите «С нуля» или сначала опубликуйте обучение.
                    </div>
                  ) : (
                    <div className="max-h-[180px] overflow-y-auto rounded-xl border border-border divide-y">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setTemplateId(tpl.id)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            templateId === tpl.id
                              ? "bg-primary/[0.04]"
                              : "hover:bg-[hsl(var(--surface))]"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                               style={{ borderColor: templateId === tpl.id ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                            {templateId === tpl.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-medium truncate">{tpl.name}</div>
                            <div className="text-[12px] text-[hsl(var(--ink-muted))] truncate">
                              {tpl.factory} · {tpl.direction} · {tpl.duration}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[13px]">Название обучения *</Label>
                <Input
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouchedName(true)}
                  placeholder="Например: Кредитные карты для новых клиентов"
                  className={nameError ? "border-error focus-visible:ring-error/30" : ""}
                />
                <div className="flex items-center justify-between text-[11px] text-[hsl(var(--ink-muted))]">
                  <span className={nameError ? "text-error" : ""}>{nameError ?? " "}</span>
                  <span>{name.length}/120</span>
                </div>
              </div>

              <Field label="Категория *">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label="Тематика *">
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger><SelectValue placeholder="Выберите тематику" /></SelectTrigger>
                  <SelectContent>{TOPICS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label="Длительность *">
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue placeholder="Выберите длительность" /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label="Фабрика *">
                <Select
                  value={factory}
                  onValueChange={(v) => {
                    setFactory(v);
                    setDirection("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Выберите фабрику" /></SelectTrigger>
                  <SelectContent>{FACTORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label="Направление *" className="col-span-2">
                <Select value={direction} onValueChange={setDirection} disabled={!factory}>
                  <SelectTrigger>
                    <SelectValue placeholder={factory ? "Выберите направление" : "Сначала выберите фабрику"} />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Описание (опционально)" className="col-span-2">
                <Textarea
                  value={description}
                  maxLength={400}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Кратко опишите, чему научится сотрудник после прохождения."
                />
                <div className="text-[11px] text-[hsl(var(--ink-muted))] text-right">
                  {description.length}/400
                </div>
              </Field>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-[13px]">Обложка (16:9, до 2 МБ)</Label>
                <div className="flex gap-3 items-start">
                  <div className="w-44 aspect-video rounded-xl overflow-hidden bg-[hsl(216_20%_96%)] border border-border flex items-center justify-center text-[12px] text-[hsl(var(--ink-muted))]">
                    {cover ? (
                      <img src={cover} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      "Обложка не загружена"
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 h-9 text-[13px] hover:bg-[hsl(var(--surface))]">
                      <Upload className="w-4 h-4" />
                      Загрузить
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {cover && (
                      <button
                        type="button"
                        onClick={() => {
                          setCover(null);
                          setCoverError(null);
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-[hsl(var(--ink-muted))] hover:text-foreground ml-2"
                      >
                        <X className="w-3 h-3" /> Удалить
                      </button>
                    )}
                    {coverError && <div className="text-[12px] text-error">{coverError}</div>}
                    {!coverError && (
                      <div className="text-[12px] text-[hsl(var(--ink-muted))]">
                        PNG, JPG или WebP. Если оставить пустым, в карточке покажется заглушка.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-[hsl(var(--surface))] flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                Назад
              </Button>
            )}
            {step === 1 && (
              <Button disabled={!type} onClick={() => setStep(2)}>Далее</Button>
            )}
            {step === 2 && (
              <Button
                disabled={
                  !method || (method === "template" && templates.length > 0 && !templateId)
                }
                onClick={() => setStep(3)}
              >
                Далее
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleCreate} disabled={!canStep3}>
                Создать
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}
