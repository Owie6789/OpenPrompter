import React from "react";
import {
  Compass,
  Funnel,
  User,
  ClockCounterClockwise,
  Info,
  GearSix,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import openprompterIcon from "@/assets/openpromptericon.png";

export type SidebarNavItem = {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ElementType<any>;
};

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: "optimizer", label: "Workspace", icon: Compass },
  { id: "templates", label: "Presets", icon: Funnel },
  { id: "personas", label: "Personas", icon: User },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "about", label: "About", icon: Info },
];

type AppSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img
            src={openprompterIcon}
            alt="OpenPrompter"
            className="h-6 w-6 shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight text-[#e6e9fa] group-data-[collapsible=icon]:hidden">
            OpenPrompter
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-[#e6e9fa]/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SIDEBAR_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => onTabChange(item.id)}
                      tooltip={item.label}
                      className="text-[#e6e9fa]/60 hover:text-[#e6e9fa] data-[active=true]:text-[#e6e9fa]"
                    >
                      <Icon
                        size={16}
                        weight={activeTab === item.id ? "fill" : "regular"}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <GearSix size={14} weight="regular" className="text-[#e6e9fa]/30" />
          <span className="text-[11px] text-[#e6e9fa]/30">
            v0.1.0
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
