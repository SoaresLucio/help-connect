import { ContractContext, STAGES, STAGE_META, deriveStage, stageProgress } from "@/logic/contractStatus";
import { Check } from "lucide-react";

interface Props {
  context: ContractContext;
  className?: string;
}

/**
 * Visualização linear das 6 etapas do contrato. Lê apenas o estado derivado.
 */
export function ContractStatusBar({ context, className }: Props) {
  const current = deriveStage(context);
  const currentIndex = STAGE_META[current].index;
  const progress = stageProgress(current);

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
        <span className="font-semibold text-foreground">Etapa {currentIndex}/6 · {STAGE_META[current].label}</span>
        <span>{progress}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ol className="grid grid-cols-6 gap-1 mt-3">
        {STAGES.map((s) => {
          const meta = STAGE_META[s];
          const done = meta.index < currentIndex;
          const active = meta.index === currentIndex;
          return (
            <li key={s} className="flex flex-col items-center gap-1 text-center">
              <div className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold transition-colors
                ${done ? "bg-success text-success-foreground"
                  : active ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-secondary text-muted-foreground"}`}>
                {done ? <Check className="h-3 w-3" /> : meta.index}
              </div>
              <span className={`text-[9px] leading-tight ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-[10px] text-muted-foreground mt-2">{STAGE_META[current].description}</p>
    </div>
  );
}
