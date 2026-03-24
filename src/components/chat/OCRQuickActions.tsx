import type { OCRQuickAction } from "@/lib/ocr/types";

interface OCRQuickActionsProps {
  actions: OCRQuickAction[];
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}

export function OCRQuickActions({ actions, disabled, onSelect }: OCRQuickActionsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="surface-chip px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
