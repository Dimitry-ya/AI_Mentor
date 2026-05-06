import { ChevronRight, Plus, GraduationCap, BookOpen, FileText, FolderTree, Boxes, HelpCircle, Flag, Sparkles, MoreHorizontal, Trash2, Copy, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SelectedNode, Training, ValidationReport } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  training: Training;
  selected: SelectedNode;
  onSelect: (n: SelectedNode) => void;
  report: ValidationReport;
  onAddTheory: () => void;
  onAddSection: () => void;
  onAddCase: (sectionId: string) => void;
  onAddQuestion: (sectionId: string, caseId: string) => void;
  onDeleteTheory: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onDeleteCase: (sectionId: string, caseId: string) => void;
  onDeleteQuestion: (sectionId: string, caseId: string, questionId: string) => void;
  onDuplicateCase: (sectionId: string, caseId: string) => void;
  onRename: (target: SelectedNode, name: string) => void;
}

export function BuilderTree(p: Props) {
  return (
    <div className="text-[13px] py-2">
      <Row
        icon={<Sparkles className="w-3.5 h-3.5" />}
        label="Онбординг"
        active={p.selected.kind === "onboarding"}
        hasError={p.report.byBlock["onboarding"] === "errors"}
        onClick={() => p.onSelect({ kind: "onboarding" })}
      />

      {p.training.type === "Тренажёр" && (
        <Group
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Теория"
          count={p.training.structure.theories.length}
          active={p.selected.kind === "theoryBlock"}
          hasError={p.report.byBlock["theoryBlock"] === "errors"}
          onClick={() => p.onSelect({ kind: "theoryBlock" })}
          action={
            <button
              onClick={(e) => {
                e.stopPropagation();
                p.onAddTheory();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
              title="Добавить теорию"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          }
        >
          {p.training.structure.theories.map((th, i) => (
            <Row
              key={th.id}
              indent={1}
              icon={<FileText className="w-3.5 h-3.5" />}
              label={th.title || `Теория ${i + 1}`}
              active={p.selected.kind === "theory" && p.selected.id === th.id}
              hasError={p.report.byBlock[`theory:${th.id}`] === "errors"}
              onClick={() => p.onSelect({ kind: "theory", id: th.id })}
              menu={
                <Menu
                  onRename={() => promptRename(th.title, (v) => p.onRename({ kind: "theory", id: th.id }, v))}
                  onDelete={() => p.onDeleteTheory(th.id)}
                />
              }
            />
          ))}
        </Group>
      )}

      <Group
        icon={<FolderTree className="w-3.5 h-3.5" />}
        label="Практика"
        count={p.training.structure.practice.sections.length}
        active={p.selected.kind === "practice"}
        hasError={p.report.byBlock["practice"] === "errors"}
        onClick={() => p.onSelect({ kind: "practice" })}
        action={
          <button
            onClick={(e) => {
              e.stopPropagation();
              p.onAddSection();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
            title="Добавить раздел"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        }
      >
        {p.training.structure.practice.sections.map((sec) => (
          <Group
            key={sec.id}
            indent={1}
            icon={<Boxes className="w-3.5 h-3.5" />}
            label={sec.name}
            count={sec.cases.length}
            active={p.selected.kind === "section" && p.selected.id === sec.id}
            hasError={p.report.byBlock[`section:${sec.id}`] === "errors"}
            onClick={() => p.onSelect({ kind: "section", id: sec.id })}
            action={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  p.onAddCase(sec.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
                title="Добавить кейс"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            }
            menu={
              <Menu
                onRename={() => promptRename(sec.name, (v) => p.onRename({ kind: "section", id: sec.id }, v))}
                onDelete={() => p.onDeleteSection(sec.id)}
              />
            }
          >
            {sec.cases.map((cs) => (
              <Group
                key={cs.id}
                indent={2}
                icon={<GraduationCap className="w-3.5 h-3.5" />}
                label={cs.name}
                count={cs.questions.length}
                active={p.selected.kind === "case" && p.selected.id === cs.id}
                hasError={p.report.byBlock[`case:${cs.id}`] === "errors"}
                onClick={() => p.onSelect({ kind: "case", sectionId: sec.id, id: cs.id })}
                action={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      p.onAddQuestion(sec.id, cs.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
                    title="Добавить вопрос"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                }
                menu={
                  <Menu
                    onRename={() => promptRename(cs.name, (v) => p.onRename({ kind: "case", sectionId: sec.id, id: cs.id }, v))}
                    onDuplicate={() => p.onDuplicateCase(sec.id, cs.id)}
                    onDelete={() => p.onDeleteCase(sec.id, cs.id)}
                  />
                }
              >
                {cs.questions.map((qs) => (
                  <Row
                    key={qs.id}
                    indent={3}
                    icon={<HelpCircle className="w-3.5 h-3.5" />}
                    label={qs.name}
                    active={p.selected.kind === "question" && p.selected.id === qs.id}
                    hasError={p.report.byBlock[`question:${qs.id}`] === "errors"}
                    onClick={() =>
                      p.onSelect({ kind: "question", sectionId: sec.id, caseId: cs.id, id: qs.id })
                    }
                    menu={
                      <Menu
                        onRename={() => promptRename(qs.name, (v) => p.onRename({ kind: "question", sectionId: sec.id, caseId: cs.id, id: qs.id }, v))}
                        onDelete={() => p.onDeleteQuestion(sec.id, cs.id, qs.id)}
                      />
                    }
                  />
                ))}
              </Group>
            ))}
          </Group>
        ))}
      </Group>

      <Row
        icon={<Flag className="w-3.5 h-3.5" />}
        label="Завершение"
        active={p.selected.kind === "finish"}
        hasError={p.report.byBlock["finish"] === "errors"}
        onClick={() => p.onSelect({ kind: "finish" })}
      />
    </div>
  );
}

function promptRename(current: string, apply: (v: string) => void) {
  const v = window.prompt("Новое название", current);
  if (v && v.trim() && v.trim() !== current) apply(v.trim());
}

function Row({
  icon,
  label,
  count,
  active,
  hasError,
  indent = 0,
  onClick,
  menu,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  hasError?: boolean;
  indent?: number;
  onClick: () => void;
  menu?: ReactNode;
}) {
  return (
    <div
      className={`group flex items-center gap-2 h-8 px-2 rounded-lg cursor-pointer ${
        active ? "bg-primary/[0.07] text-foreground" : "hover:bg-primary/[0.05]"
      }`}
      style={{ paddingLeft: 8 + indent * 16 }}
      onClick={onClick}
    >
      <span className={`text-[hsl(var(--ink-muted))] ${active ? "text-primary" : ""}`}>{icon}</span>
      <span className={`flex-1 truncate ${active ? "font-medium" : ""}`}>{label}</span>
      {hasError && indent === 0 && <span className="am-dot am-dot-error" title="В блоке есть ошибки" />}
      {hasError && indent > 0 && <span className="am-dot am-dot-warning" title="В блоке есть ошибки" />}
      {typeof count === "number" && (
        <span className="text-[11px] text-[hsl(var(--ink-muted))]">{count}</span>
      )}
      {menu}
    </div>
  );
}

function Group({
  icon,
  label,
  count,
  active,
  hasError,
  indent = 0,
  onClick,
  action,
  menu,
  children,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  hasError?: boolean;
  indent?: number;
  onClick: () => void;
  action?: ReactNode;
  menu?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className={`group flex items-center gap-1 h-8 rounded-lg cursor-pointer ${
          active ? "bg-primary/[0.07] text-foreground" : "hover:bg-primary/[0.05]"
        }`}
        style={{ paddingLeft: 4 + indent * 16, paddingRight: 6 }}
        onClick={onClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="p-0.5 rounded hover:bg-black/5"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <span className={`text-[hsl(var(--ink-muted))] ${active ? "text-primary" : ""}`}>{icon}</span>
        <span className={`flex-1 truncate ${active ? "font-medium" : ""}`}>{label}</span>
        {hasError && indent === 0 && <span className="am-dot am-dot-error" title="В блоке есть ошибки" />}
        {hasError && indent > 0 && <span className="am-dot am-dot-warning" title="В блоке есть ошибки" />}
        {typeof count === "number" && (
          <span className="text-[11px] text-[hsl(var(--ink-muted))]">{count}</span>
        )}
        {action}
        {menu}
      </div>
      {open && children}
    </div>
  );
}

function Menu({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onRename: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="w-3.5 h-3.5 mr-2" /> Переименовать
        </DropdownMenuItem>
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5 mr-2" /> Дублировать
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDelete} className="text-error focus:text-error">
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
