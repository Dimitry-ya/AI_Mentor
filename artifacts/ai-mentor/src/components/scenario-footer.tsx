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
  const actionButton = "h-8 min-h-8"
  return (
    <div className="sticky bottom-0 z-30 bg-[hsl(var(--surface))] border-t border-border">
      <div className="max-w-[920px] mx-auto px-6 h-14 flex items-center justify-end gap-2">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className={`gap-1 ${actionButton}`}>
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>
        )}
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} className={actionButton}>
            Отмена
          </Button>
        )}
        <div className="flex items-center gap-2">
          {hint && <span className="text-[12px] text-[hsl(var(--ink-muted))] mr-2">{hint}</span>}
          {secondary && (
            <Button variant="outline" onClick={secondary.onClick} className={actionButton}>
              {secondary.label}
            </Button>
          )}
          {onSave && (
            <Button variant="outline" onClick={onSave} className={actionButton}>
              {saveLabel}
            </Button>
          )}
          {primary && (
            <Button onClick={primary.onClick} disabled={primary.disabled} className={`gap-1 ${actionButton}`}>
              {primary.label}
              {primary.label === "Далее" && <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
