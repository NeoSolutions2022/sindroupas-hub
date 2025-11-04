import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/assets/logo.jpeg";

export function DashboardNavbar() {
  return (
    <header className="h-16 border-b bg-card flex items-center px-4 gap-4">
      <SidebarTrigger />
      <img src={logo} alt="SindRoupas" className="h-10 w-auto" />
      <h1 className="text-lg font-semibold">SindRoupas</h1>
      
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-9"
          />
        </div>
      </div>
      
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-accent text-accent-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
