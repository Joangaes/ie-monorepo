"use client";

import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap, 
  Building, 
  FileSpreadsheet,
  ArrowRight,
  BarChart3,
  Clock,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { t } = useTranslations();
  const router = useRouter();

  const quickStats = [
    {
      title: "Active Programs",
      value: "12",
      icon: GraduationCap,
      description: "Currently running programs",
      href: "/programs"
    },
    {
      title: "Total Professors",
      value: "248",
      icon: Users,
      description: "Faculty members",
      href: "/professors"
    },
    {
      title: "Current Intakes",
      value: "8",
      icon: Calendar,
      description: "Active academic intakes",
      href: "/current-intakes"
    },
    {
      title: "Course Deliveries",
      value: "156",
      icon: BookOpen,
      description: "Scheduled course deliveries",
      href: "/course-deliveries"
    }
  ];

  const quickActions = [
    {
      title: "Course Delivery Overview",
      description: "Comprehensive view of all course deliveries organized by program and campus",
      icon: FileSpreadsheet,
      href: "/delivery-overview",
      featured: true
    },
    {
      title: "Current Intakes",
      description: "View and manage active academic intakes",
      icon: Clock,
      href: "/current-intakes"
    },
    {
      title: "Professor Management",
      description: "Manage faculty information and assignments",
      icon: Users,
      href: "/professors"
    },
    {
      title: "Campus Sections",
      description: "Organize sections by campus location",
      icon: MapPin,
      href: "/sections"
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the IE University Professor Management System
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  action.featured ? 'border-primary shadow-sm' : ''
                }`}
              >
                <Link href={action.href}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-5 w-5 ${
                        action.featured ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <CardTitle className={action.featured ? 'text-primary' : ''}>
                        {action.title}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {action.featured ? 'Featured' : 'Go to'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>System Overview</span>
          </CardTitle>
          <CardDescription>
            Key information about your academic management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">Course Delivery Management</h4>
                <p className="text-sm text-muted-foreground">
                  Organize and assign professors to course deliveries across different campuses and programs
                </p>
              </div>
              <Button onClick={() => router.push('/delivery-overview')}>
                View Overview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <Building className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Segovia Campus</h4>
                <p className="text-sm text-muted-foreground">Main campus operations</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Building className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Madrid Campus</h4>
                <p className="text-sm text-muted-foreground">Metropolitan campus</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Delivery Overview</h4>
                <p className="text-sm text-muted-foreground">Comprehensive view</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
