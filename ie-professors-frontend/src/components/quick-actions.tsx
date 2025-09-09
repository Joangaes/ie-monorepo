"use client"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar"
import { Zap, FileSpreadsheet } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { usePathname } from "next/navigation"

export function QuickActions() {
  const { t } = useTranslations()
  const pathname = usePathname()
  const isDashboardActive = pathname === '/dashboard' || pathname === '/'
  const isDeliveryOverviewActive = pathname === '/delivery-overview'

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isDashboardActive}>
            <a href="/dashboard">
              <Zap className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isDeliveryOverviewActive}>
            <a href="/delivery-overview">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Delivery Overview</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
