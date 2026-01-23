import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, BarChart3, AlertTriangle } from "lucide-react";
import NotificationDashboard from "@/components/notifications/NotificationDashboard";
import NotificationAnalytics from "@/components/notifications/NotificationAnalytics";
import SystemAlerts from "@/components/notifications/SystemAlerts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Push Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage broadcast notifications and system alerts
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              System Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <NotificationDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <NotificationAnalytics />
          </TabsContent>

          <TabsContent value="alerts">
            <SystemAlerts />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
