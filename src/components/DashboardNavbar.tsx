import { SidebarTrigger } from "@/components/ui/sidebar";
import logo from "@/assets/logo.jpeg";

export function DashboardNavbar() {
  return (
    <header className="h-16 border-b bg-card flex items-center px-4 gap-4">
      <SidebarTrigger />
      <img src={logo} alt="SindRoupas" className="h-10 w-auto" />
      <h1 className="text-lg font-semibold">SindRoupas</h1>
    </header>
  );
}
