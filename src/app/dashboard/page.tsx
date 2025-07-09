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
import { he } from "date-fns/locale";
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
    return isValid(date) ? format(date, "dd/MM/yyyy", { locale: he }) : "תאריך לא תקין";
  };

  const getStatusBadge = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (isAfter(today, due)) {
      return <Badge variant="destructive">באיחור</Badge>;
    }
    
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (isAfter(due, today) && isBefore(due, weekFromNow)) {
      return <Badge variant="secondary">בקרוב</Badge>;
    }
    
    return <Badge variant="default">במסלול</Badge>;
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">הושלם</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">בביצוע</Badge>;
      case 'overdue':
        return <Badge variant="destructive">באיחור</Badge>;
      default:
        return <Badge variant="outline">ממתין</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">גבוה</Badge>;
      case 'medium':
        return <Badge variant="secondary">בינוני</Badge>;
      default:
        return <Badge variant="outline">נמוך</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">טוען לוח בקרה...</p>
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
          <h1 className="text-3xl font-bold tracking-tight rtl">לוח בקרה</h1>
          <p className="text-muted-foreground rtl">
            ברוכים הבאים! הנה מה שקורה עם הפרוטוקולים והמשימות שלכם.
          </p>
        </div>
        <div className="flex gap-2 rtl">
          <Link href="/dashboard/protocols/new">
            <Button className="gap-2 rtl">
              <Plus className="h-4 w-4" />
              פרוטוקול חדש
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פרוטוקולים</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueProtocols} באיחור, {stats.dueSoonProtocols} בקרוב
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ועדות</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommittees}</div>
            <p className="text-xs text-muted-foreground">
              ועדות פעילות
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">חברות</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              חברות רשומות
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} הושלמו, {stats.pendingTasks} ממתינות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Protocols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              פרוטוקולים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProtocols.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין פרוטוקולים</p>
              ) : (
                recentProtocols.map((protocol) => (
                  <div key={protocol.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        פרוטוקול #{protocol.number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {protocol.committee?.name || "ועדה לא ידועה"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(protocol.due_date)}
                      <Link href={`/dashboard/protocols/${protocol.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              משימות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין משימות</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        עדיפות: {getPriorityBadge(task.priority)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTaskStatusBadge(task.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Future Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              נושאים עתידיים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFutureTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין נושאים עתידיים</p>
              ) : (
                recentFutureTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {topic.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        עדיפות: {getPriorityBadge(topic.priority)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">עתידי</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
