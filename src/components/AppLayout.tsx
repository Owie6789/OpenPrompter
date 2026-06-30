import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/src/components/AppSidebar";

type AppLayoutProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
};

export function AppLayout({ activeTab, onTabChange, children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
