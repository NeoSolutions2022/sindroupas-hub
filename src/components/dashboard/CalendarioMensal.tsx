import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CalendarEvent {
  date: string;
  type: "vencimento" | "atrasado" | "aniversario";
  label: string;
  detail: string;
}

interface CalendarioMensalProps {
  events: CalendarEvent[];
}

const EVENT_COLORS = {
  vencimento: "bg-destructive",
  atrasado: "bg-amber-500",
  aniversario: "bg-accent",
};

const EVENT_LABELS = {
  vencimento: "Vencimento",
  atrasado: "Atrasado",
  aniversario: "Aniversário",
};

export const CalendarioMensal = ({ events }: CalendarioMensalProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = getDay(monthStart);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = event.date;
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return eventsByDate.get(key) || [];
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <Card className="shadow-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-1.5">
              <CalendarDays className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base font-semibold">Calendário do mês</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center capitalize">
              {format(currentMonth, "MMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className="text-center text-[10px] font-medium text-muted-foreground py-1.5 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for padding */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-9" />
          ))}

          {/* Day cells */}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasEvents = dayEvents.length > 0;

            const dayCell = (
              <div
                className={`
                  h-9 flex flex-col items-center justify-center rounded-md relative transition-colors
                  ${isToday ? "bg-primary text-primary-foreground font-semibold" : ""}
                  ${hasEvents && !isToday ? "cursor-pointer hover:bg-secondary" : ""}
                `}
              >
                <span className={`text-xs ${!isToday ? "text-foreground" : ""}`}>
                  {format(day, "d")}
                </span>
                {/* Event dots */}
                {hasEvents && (
                  <div className="flex gap-0.5 absolute bottom-0.5">
                    {Array.from(new Set(dayEvents.map((e) => e.type)))
                      .slice(0, 3)
                      .map((type) => (
                        <span
                          key={type}
                          className={`h-1 w-1 rounded-full ${EVENT_COLORS[type]}`}
                        />
                      ))}
                  </div>
                )}
              </div>
            );

            if (!hasEvents) {
              return <div key={day.toISOString()}>{dayCell}</div>;
            }

            return (
              <Popover key={day.toISOString()}>
                <PopoverTrigger asChild>{dayCell}</PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3 bg-popover"
                  align="center"
                  side="top"
                  role="dialog"
                  aria-label={`Eventos do dia ${format(day, "d 'de' MMMM", { locale: ptBR })}`}
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      {format(day, "d 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvents.map((event, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span
                            className={`h-2 w-2 rounded-full mt-1 shrink-0 ${EVENT_COLORS[event.type]}`}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{event.label}</p>
                            <p className="text-muted-foreground truncate">{event.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          {Object.entries(EVENT_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${EVENT_COLORS[type as keyof typeof EVENT_COLORS]}`} />
              {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
