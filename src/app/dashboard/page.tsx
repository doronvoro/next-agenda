"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Users, 
  Building2, 
  CheckSquare, 
  Calendar, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { format, isValid, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import type { Database } from "@/types/supabase";

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

type Committee = Database["public"]["Tables"]["committees"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Task = Database["public"]["Tables"]["agenda_item_tasks"]["Row"];
type FutureTopic = Database["public"]["Tables"]["future_topics"]["Row"];

interface DashboardStats {
  totalProtocols: number;
  totalCommittees: number;
  totalCompanies: number;
  totalTasks: number;
  overdueProtocols: number;
  dueSoonProtocols: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProtocols: 0,
    totalCommittees: 0,
    totalCompanies: 0,
    totalTasks: 0,
    overdueProtocols: 0,
    dueSoonProtocols: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentProtocols, setRecentProtocols] = useState<Protocol[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentFutureTopics, setRecentFutureTopics] = useState<FutureTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        // Fetch all data in parallel
        const [
          protocolsResult,
          committeesResult,
          companiesResult,
          tasksResult,
          futureTopicsResult
        ] = await Promise.all([
          supabase.from("protocols").select("*, committee:committees!committee_id(*)").order("created_at", { ascending: false }).limit(5),
          supabase.from("committees").select("id"),
          supabase.from("companies").select("id"),
          supabase.from("agenda_item_tasks").select("*").order("created_at", { ascending: false }).limit(5),
          supabase.from("future_topics").select("*").order("created_at", { ascending: false }).limit(5)
        ]);

        const protocols = protocolsResult.data || [];
        const committees = committeesResult.data || [];
        const companies = companiesResult.data || [];
        const tasks = tasksResult.data || [];
        const futureTopics = futureTopicsResult.data || [];

        // Calculate statistics
        const today = new Date();
        const overdueProtocols = protocols.filter(p => isAfter(today, new Date(p.due_date))).length;
        const dueSoonProtocols = protocols.filter(p => {
          const dueDate = new Date(p.due_date);
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return isAfter(dueDate, today) && isBefore(dueDate, weekFromNow);
        }).length;

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

        setStats({
          totalProtocols: protocols.length,
          totalCommittees: committees.length,
          totalCompanies: companies.length,
          totalTasks: tasks.length,
          overdueProtocols,
          dueSoonProtocols,
          completedTasks,
          pendingTasks,
        });

        setRecentProtocols(protocols);
        setRecentTasks(tasks);
        setRecentFutureTopics(futureTopics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
  };

  const getStatusBadge = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (isAfter(today, due)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (isAfter(due, today) && isBefore(due, weekFromNow)) {
      return <Badge variant="secondary">Due Soon</Badge>;
    }
    
    return <Badge variant="default">On Track</Badge>;
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between rtl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight rtl">Dashboard</h1>
          <p className="text-muted-foreground rtl">
            Welcome back! Here's what's happening with your protocols and tasks.
          </p>
        </div>
        <div className="flex gap-2 rtl">
          <Link href="/dashboard/protocols/new">
            <Button className="gap-2 rtl">
              <Plus className="h-4 w-4" />
              New Protocol
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Protocols</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueProtocols} overdue, {stats.dueSoonProtocols} due soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommittees}</div>
            <p className="text-xs text-muted-foreground">
              Active committees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Registered companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed, {stats.pendingTasks} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Protocols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Protocols
              </CardTitle>
              <Link href="/dashboard/protocols">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentProtocols.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No protocols yet</p>
                <p className="text-sm">Create your first protocol to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProtocols.map((protocol) => (
                  <div key={protocol.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/dashboard/protocols/${protocol.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          Protocol #{protocol.number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {protocol.committee?.name || "No committee"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(protocol.due_date)}</p>
                        {getStatusBadge(protocol.due_date)}
                      </div>
                      <Link href={`/dashboard/protocols/${protocol.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/protocols/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create New Protocol
              </Button>
            </Link>
            <Link href="/dashboard/future-topics" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" />
                Manage Future Topics
              </Button>
            </Link>
            <Link href="/dashboard/task-tracking" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CheckSquare className="h-4 w-4" />
                View All Tasks
              </Button>
            </Link>
            <Link href="/dashboard/committees" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Manage Committees
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Recent Tasks
              </CardTitle>
              <Link href="/dashboard/task-tracking">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks yet</p>
                <p className="text-sm">Tasks will appear here when created</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTaskStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Future Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Future Topics
              </CardTitle>
              <Link href="/dashboard/future-topics">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentFutureTopics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No future topics yet</p>
                <p className="text-sm">Add topics for future meetings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFutureTopics.map((topic) => (
                  <div key={topic.id} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">{topic.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getPriorityBadge(topic.priority)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(topic.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.overdueProtocols > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      {stats.overdueProtocols} protocol{stats.overdueProtocols > 1 ? 's' : ''} overdue
                    </p>
                    <p className="text-sm text-red-700">
                      Review and update overdue protocols
                    </p>
                  </div>
                </div>
              )}
              
              {stats.dueSoonProtocols > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      {stats.dueSoonProtocols} protocol{stats.dueSoonProtocols > 1 ? 's' : ''} due soon
                    </p>
                    <p className="text-sm text-yellow-700">
                      Prepare for upcoming protocol deadlines
                    </p>
                  </div>
                </div>
              )}

              {stats.pendingTasks > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {stats.pendingTasks} pending task{stats.pendingTasks > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-blue-700">
                      Review and complete pending tasks
                    </p>
                  </div>
                </div>
              )}

              {stats.overdueProtocols === 0 && stats.dueSoonProtocols === 0 && stats.pendingTasks === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-sm">No urgent alerts at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
