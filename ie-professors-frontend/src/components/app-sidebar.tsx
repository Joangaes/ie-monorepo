"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  GalleryVerticalEnd,
  SquareTerminal,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { QuickActions } from "@/components/quick-actions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useTranslations } from "@/hooks/use-translations"

function useNavData(pathname: string, t: (key: string) => string) {
  return React.useMemo(() => {
    const baseNavMain = [
      {
        title: t("navigation.faculty_data"),
        url: "#",
        icon: SquareTerminal,
        items: [
          {
            title: t("navigation.professors"),
            url: "/professors",
          },
        ],
      },
      {
        title: t("navigation.programs_data"),
        url: "#",
        icon: Bot,
        items: [
          {
            title: t("navigation.programs"),
            url: "/programs",
          },
          {
            title: t("navigation.courses"),
            url: "/courses",
          },
        ],
      },
      {
        title: t("navigation.terms"),
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: t("navigation.terms"),
            url: "/terms",
          },
          {
            title: t("navigation.intakes"),
            url: "/intakes",
          },
          {
            title: t("navigation.sections"),
            url: "/sections",
          },
          {
            title: t("navigation.course_deliveries"),
            url: "/course-deliveries",
          },
          {
            title: t("navigation.current_intakes"),
            url: "/current-intakes",
          },
        ],
      },
    ]
    
    return baseNavMain.map((item) => ({
      ...item,
      isActive:
        pathname === item.url ||
        item.items?.some((sub) => pathname === sub.url || pathname.startsWith(sub.url + '/')),
      items: item.items?.map((subItem) => ({
        ...subItem,
        isActive: pathname === subItem.url || pathname.startsWith(subItem.url + '/')
      }))
    }))
  }, [pathname, t])
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
  },
  teams: [
    {
      name: "IE University",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  projects: [
    {
      name: "Missing Professors",
      url: "#",
      icon: Frame,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { t } = useTranslations()
  const navMain = useNavData(pathname, t)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <QuickActions />
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
