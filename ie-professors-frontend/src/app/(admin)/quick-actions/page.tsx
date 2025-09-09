"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  Building, 
  FileText,
  Settings,
  ArrowRight,
  Plus
} from "lucide-react"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  category: 'assignments' | 'management' | 'data'
  color: string
}

export default function QuickActionsPage() {
  const { t } = useTranslations()
  const router = useRouter()

  const quickActions: QuickAction[] = [
    // Assignment Actions
    {
      id: 'assign-professor',
      title: 'Assign Professor to Course',
      description: 'Quickly assign professors to specific courses and sections',
      icon: UserPlus,
      action: () => router.push('/course-deliveries/add'),
      category: 'assignments',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'manage-sections',
      title: 'Manage Course Sections',
      description: 'View and organize course sections by program and intake',
      icon: Calendar,
      action: () => router.push('/sections'),
      category: 'assignments',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      id: 'missing-professors',
      title: 'View Missing Professors',
      description: 'See courses that need professor assignments',
      icon: FileText,
      action: () => router.push('/current-intakes'),
      category: 'assignments',
      color: 'bg-orange-500 hover:bg-orange-600'
    },

    // Data Management Actions
    {
      id: 'add-professor',
      title: 'Add New Professor',
      description: 'Register a new professor in the system',
      icon: GraduationCap,
      action: () => router.push('/professors/add'),
      category: 'management',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'add-course',
      title: 'Add New Course',
      description: 'Create a new course in the catalog',
      icon: BookOpen,
      action: () => router.push('/courses/add'),
      category: 'management',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'add-program',
      title: 'Add New Program',
      description: 'Create a new academic program',
      icon: Building,
      action: () => router.push('/programs/add'),
      category: 'management',
      color: 'bg-teal-500 hover:bg-teal-600'
    },

    // Data Overview Actions
    {
      id: 'view-professors',
      title: 'All Professors',
      description: 'View and manage all professor records',
      icon: Users,
      action: () => router.push('/professors'),
      category: 'data',
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      id: 'view-courses',
      title: 'All Courses',
      description: 'Browse the complete course catalog',
      icon: BookOpen,
      action: () => router.push('/courses'),
      category: 'data',
      color: 'bg-slate-600 hover:bg-slate-700'
    },
    {
      id: 'view-sections',
      title: 'All Sections',
      description: 'Manage course sections and schedules',
      icon: Calendar,
      action: () => router.push('/sections'),
      category: 'data',
      color: 'bg-zinc-600 hover:bg-zinc-700'
    }
  ]

  const categories = {
    assignments: {
      title: 'Course Assignments',
      description: 'Manage professor-course assignments and scheduling',
      icon: UserPlus
    },
    management: {
      title: 'Add New Records',
      description: 'Create new professors, courses, and programs',
      icon: Plus
    },
    data: {
      title: 'Browse Data',
      description: 'View and manage existing records',
      icon: FileText
    }
  }

  const getActionsByCategory = (category: string) => {
    return quickActions.filter(action => action.category === category)
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quick Actions</h1>
            <p className="text-muted-foreground">Access important functions and system overview</p>
          </div>
        </div>

        {/* Action Categories */}
        <div className="space-y-8">
          {Object.entries(categories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="space-y-4">
              <div className="flex items-center space-x-3">
                <category.icon className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getActionsByCategory(categoryKey).map((action) => (
                  <Card 
                    key={action.id} 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary/30 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50"
                    onClick={action.action}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-4 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300 mt-3">
                        {action.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm leading-relaxed text-gray-600">
                        {action.description}
                      </CardDescription>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-xs text-primary font-medium group-hover:text-primary/80">
                          <span>Click to access</span>
                          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold mb-8 flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-6 w-6 text-gray-700" />
            </div>
            <span>System Overview</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-4xl font-bold text-blue-600 mb-2">257</CardTitle>
                <CardDescription className="text-base font-medium">Total Professors</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-4xl font-bold text-purple-600 mb-2">1,847</CardTitle>
                <CardDescription className="text-base font-medium">Total Courses</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-4xl font-bold text-green-600 mb-2">45</CardTitle>
                <CardDescription className="text-base font-medium">Active Programs</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-orange-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-4xl font-bold text-orange-600 mb-2">12</CardTitle>
                <CardDescription className="text-base font-medium">Missing Assignments</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>


      </div>
    </div>
  )
}
