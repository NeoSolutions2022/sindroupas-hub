import { useMemo } from "react";
import { useActivities } from "@/contexts/ActivitiesContext";
import { Users } from "lucide-react";

interface Props {
  month: number; // 0-based
  year: number;
}

const ASSOCIADOS_TOTAL = 280;

export const ParticipacaoEventosCard = ({ month, year }: Props) => {
  const { activities } = useActivities();

  const participantsMonth = useMemo(() => {
    return activities
      .filter((a) => {
        if (a.type !== "EVENTO") return false;
        const d = new Date(a.date + "T00:00:00");
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, a) => sum + a.quantity, 0);
  }, [activities, month, year]);

  const pct = ASSOCIADOS_TOTAL > 0 ? ((participantsMonth / ASSOCIADOS_TOTAL) * 100).toFixed(1) : "—";

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-card transition-card hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
            Participação em eventos
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">
            {ASSOCIADOS_TOTAL > 0 ? `${pct}%` : "—"}
          </p>
          <div className="space-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <p>Participantes no mês: {participantsMonth}</p>
            <p>Base: {ASSOCIADOS_TOTAL} associados</p>
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-secondary/80 p-2 sm:p-2.5">
          <Users className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  );
};
