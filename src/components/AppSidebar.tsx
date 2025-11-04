import { LayoutDashboard, UserCog, Users, Handshake, Package, Building2, DollarSign, MessageSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CRM", url: "/dashboard/crm", icon: UserCog },
  { title: "Associados", url: "/dashboard/associados", icon: Users },
  { title: "Parceiros", url: "/dashboard/parceiros", icon: Handshake },
  { title: "Fornecedores", url: "/dashboard/fornecedores", icon: Package },
  { title: "Mantenedores", url: "/dashboard/mantenedores", icon: Building2 },
  { title: "Financeiro", url: "/dashboard/financeiro", icon: DollarSign },
  { title: "Comunicação", url: "/dashboard/comunicacao", icon: MessageSquare },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
