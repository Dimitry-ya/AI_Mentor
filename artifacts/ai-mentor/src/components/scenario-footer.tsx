import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  primary?: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  saveLabel?: string;
  hint?: ReactNode;
}

export function ScenarioFooter({
  onBack,
  onCancel,
  onSave,
  primary,
  secondary,
  saveLabel = "Сохранить",
  hint,
}: Props) {
  return (
    <div className="sticky bottom-0 z-30 bg-[hsl(var(--surface))] border-t border-border">
      <div className="max-w-[920px] mx-auto px-6 h-14 flex items-center gap-2">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>
        )}
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hint && <span className="text-[12px] text-[hsl(var(--ink-muted))] mr-2">{hint}</span>}
          {secondary && (
            <Button variant="outline" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
          {onSave && (
            <Button variant="outline" onClick={onSave}>
              {saveLabel}
            </Button>
          )}
          {primary && (
            <Button onClick={primary.onClick} disabled={primary.disabled} className="gap-1">
              {primary.label}
              {primary.label === "Далее" && <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
