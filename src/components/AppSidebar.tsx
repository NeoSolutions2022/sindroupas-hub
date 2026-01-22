import { LayoutDashboard, Users, Handshake, DollarSign, MessageSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.jpeg";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Empresas", url: "/dashboard/empresas", icon: Users },
  { title: "Relacionamentos", url: "/dashboard/relacionamentos", icon: Handshake },
  { title: "Financeiro", url: "/dashboard/financeiro", icon: DollarSign },
  { title: "Comunicação", url: "/dashboard/comunicacao", icon: MessageSquare },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SindRoupas"
            className="h-9 w-9 rounded-lg object-cover shadow-card"
          />
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                SindRoupas
              </span>
              <span className="text-xs text-muted-foreground">
                Sindicato Patronal
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                        transition-card
                        ${active
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium shadow-card"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      <NavLink to={item.url}>
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                        )}
                        <item.icon
                          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            active ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        {open && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
