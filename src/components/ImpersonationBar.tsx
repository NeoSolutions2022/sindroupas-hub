import { useMockAuth, mockUsers } from "@/contexts/MockAuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function ImpersonationBar() {
  const { currentUser, impersonatedUserId, activeUser, setImpersonatedUserId } = useMockAuth();

  if (currentUser.role !== "ADMIN") return null;

  const directors = mockUsers.filter((u) => u.role === "DIRETOR");

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2">
      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0">Visualizar como:</span>
      <Select
        value={impersonatedUserId ?? "__admin__"}
        onValueChange={(v) => setImpersonatedUserId(v === "__admin__" ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto min-w-[180px] text-xs rounded-full border-border bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__admin__">Admin (eu mesmo)</SelectItem>
          {directors.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name} — {d.area}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {impersonatedUserId && (
        <>
          <Badge variant="outline" className="text-xs border-accent text-accent bg-accent/10">
            Impersonando: {activeUser.name} ({activeUser.area})
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setImpersonatedUserId(null)}
          >
            <X className="h-3 w-3 mr-1" /> Sair
          </Button>
        </>
      )}
    </div>
  );
}
