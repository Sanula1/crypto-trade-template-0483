import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Send,
  Plus,
  MoreHorizontal,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Loader2,
  RefreshCw,
  Calendar,
  Image,
  Link,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Notification types based on the API guide
type NotificationScope = 'GLOBAL' | 'INSTITUTE' | 'CLASS' | 'SUBJECT';
type NotificationStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

// Target user types enum based on backend API
enum NotificationTargetUserType {
  ALL = 'ALL',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  PARENTS = 'PARENTS',
  ATTENDANCE_MARKERS = 'ATTENDANCE_MARKERS',
  INSTITUTE_ADMINS = 'INSTITUTE_ADMINS',
  // Advanced filters for global notifications
  USERS_WITHOUT_INSTITUTE = 'USERS_WITHOUT_INSTITUTE',
  USERS_WITHOUT_PARENT = 'USERS_WITHOUT_PARENT',
  USERS_WITHOUT_STUDENT = 'USERS_WITHOUT_STUDENT',
  VERIFIED_USERS_ONLY = 'VERIFIED_USERS_ONLY',
  UNVERIFIED_USERS_ONLY = 'UNVERIFIED_USERS_ONLY'
}

type TargetUserType = NotificationTargetUserType;

// Target user type display configuration
const TARGET_USER_TYPE_CONFIG: Record<NotificationTargetUserType, { label: string; description: string; category: 'basic' | 'advanced' }> = {
  [NotificationTargetUserType.ALL]: { label: 'All Users', description: 'Send to everyone', category: 'basic' },
  [NotificationTargetUserType.STUDENTS]: { label: 'Students', description: 'All student accounts', category: 'basic' },
  [NotificationTargetUserType.TEACHERS]: { label: 'Teachers', description: 'All teacher accounts', category: 'basic' },
  [NotificationTargetUserType.PARENTS]: { label: 'Parents', description: 'All parent accounts', category: 'basic' },
  [NotificationTargetUserType.ATTENDANCE_MARKERS]: { label: 'Attendance Markers', description: 'Users who mark attendance', category: 'basic' },
  [NotificationTargetUserType.INSTITUTE_ADMINS]: { label: 'Institute Admins', description: 'Institute administrators', category: 'basic' },
  [NotificationTargetUserType.USERS_WITHOUT_INSTITUTE]: { label: 'Users Without Institute', description: 'Not enrolled in any institute', category: 'advanced' },
  [NotificationTargetUserType.USERS_WITHOUT_PARENT]: { label: 'Users Without Parent', description: 'Cannot be assigned as parent', category: 'advanced' },
  [NotificationTargetUserType.USERS_WITHOUT_STUDENT]: { label: 'Users Without Student', description: 'Cannot play student role', category: 'advanced' },
  [NotificationTargetUserType.VERIFIED_USERS_ONLY]: { label: 'Verified Users Only', description: 'Email verified users', category: 'advanced' },
  [NotificationTargetUserType.UNVERIFIED_USERS_ONLY]: { label: 'Unverified Users Only', description: 'Not email verified', category: 'advanced' },
};

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  scope: NotificationScope;
  status: NotificationStatus;
  priority: NotificationPriority;
  targetUserTypes: TargetUserType[];
  instituteId?: string;
  classId?: string;
  subjectId?: string;
  institute?: {
    id: string;
    name: string;
  };
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  readCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
}

const NotificationDashboard = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Form state
  const [newNotification, setNewNotification] = useState({
    title: "",
    body: "",
    scope: "GLOBAL" as NotificationScope,
    targetUserTypes: [NotificationTargetUserType.ALL] as TargetUserType[],
    priority: "NORMAL" as NotificationPriority,
    instituteId: "",
    classId: "",
    subjectId: "",
    imageUrl: "",
    actionUrl: "",
    sendImmediately: true,
    scheduledAt: "",
  });

  // Institutes and classes for selection
  const [institutes, setInstitutes] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAdminNotifications({ limit: 50 });
      if (response?.data) {
        setNotifications(response.data);
      } else if (Array.isArray(response)) {
        setNotifications(response);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await api.getInstitutes(1, 100);
      if (response?.data) {
        setInstitutes(response.data.map((i: any) => ({ id: String(i.id), name: i.instituteName || i.name })));
      }
    } catch (error) {
      console.error("Failed to fetch institutes:", error);
    }
  };

  const fetchClasses = async (instituteId: string) => {
    try {
      const response = await api.getClassesByInstitute(instituteId);
      if (response?.data) {
        setClasses(response.data.map((c: any) => ({ id: String(c.id), name: c.className || c.name })));
      } else if (Array.isArray(response)) {
        setClasses(response.map((c: any) => ({ id: String(c.id), name: c.className || c.name })));
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      const response = await api.getSubjectsByClass(classId);
      if (response?.data) {
        setSubjects(response.data.map((s: any) => ({ id: String(s.id), name: s.subjectName || s.name })));
      } else if (Array.isArray(response)) {
        setSubjects(response.map((s: any) => ({ id: String(s.id), name: s.subjectName || s.name })));
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchInstitutes();
  }, []);

  useEffect(() => {
    if (newNotification.instituteId) {
      fetchClasses(newNotification.instituteId);
    } else {
      setClasses([]);
    }
  }, [newNotification.instituteId]);

  useEffect(() => {
    if (newNotification.classId) {
      fetchSubjects(newNotification.classId);
    } else {
      setSubjects([]);
    }
  }, [newNotification.classId]);

  const totalNotifications = notifications.length;
  const sentNotifications = notifications.filter((n) => n.status === "SENT").length;
  const scheduledNotifications = notifications.filter((n) => n.status === "SCHEDULED").length;
  const failedDeliveries = notifications.reduce((sum, n) => sum + (n.failedCount || 0), 0);

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case "SENT":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sent</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Scheduled</Badge>;
      case "DRAFT":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Draft</Badge>;
      case "SENDING":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Sending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getScopeBadge = (scope: NotificationScope) => {
    const scopeConfig = {
      GLOBAL: { label: "Global", className: "bg-purple-100 text-purple-800", icon: Users },
      INSTITUTE: { label: "Institute", className: "bg-blue-100 text-blue-800", icon: Building2 },
      CLASS: { label: "Class", className: "bg-green-100 text-green-800", icon: GraduationCap },
      SUBJECT: { label: "Subject", className: "bg-orange-100 text-orange-800", icon: BookOpen },
    };
    const config = scopeConfig[scope] || scopeConfig.GLOBAL;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} hover:opacity-80 flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleTargetTypeChange = (type: TargetUserType, checked: boolean) => {
    if (type === NotificationTargetUserType.ALL) {
      // If ALL is selected, clear other selections
      if (checked) {
        setNewNotification({
          ...newNotification,
          targetUserTypes: [NotificationTargetUserType.ALL],
        });
      } else {
        setNewNotification({
          ...newNotification,
          targetUserTypes: [],
        });
      }
    } else {
      // If a specific type is selected, remove ALL
      if (checked) {
        setNewNotification({
          ...newNotification,
          targetUserTypes: [...newNotification.targetUserTypes.filter(t => t !== NotificationTargetUserType.ALL), type],
        });
      } else {
        setNewNotification({
          ...newNotification,
          targetUserTypes: newNotification.targetUserTypes.filter((t) => t !== type),
        });
      }
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.body) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    if (newNotification.targetUserTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one target audience",
        variant: "destructive",
      });
      return;
    }

    // Validate scope-specific requirements
    if (newNotification.scope !== "GLOBAL" && !newNotification.instituteId) {
      toast({
        title: "Validation Error",
        description: "Institute is required for non-global notifications",
        variant: "destructive",
      });
      return;
    }

    if ((newNotification.scope === "CLASS" || newNotification.scope === "SUBJECT") && !newNotification.classId) {
      toast({
        title: "Validation Error",
        description: "Class is required for class/subject notifications",
        variant: "destructive",
      });
      return;
    }

    if (newNotification.scope === "SUBJECT" && !newNotification.subjectId) {
      toast({
        title: "Validation Error",
        description: "Subject is required for subject notifications",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: newNotification.title,
        body: newNotification.body,
        scope: newNotification.scope,
        targetUserTypes: newNotification.targetUserTypes,
        priority: newNotification.priority,
        sendImmediately: newNotification.sendImmediately,
      };

      if (newNotification.imageUrl) payload.imageUrl = newNotification.imageUrl;
      if (newNotification.actionUrl) payload.actionUrl = newNotification.actionUrl;
      if (newNotification.scope !== "GLOBAL") payload.instituteId = newNotification.instituteId;
      if (newNotification.scope === "CLASS" || newNotification.scope === "SUBJECT") payload.classId = newNotification.classId;
      if (newNotification.scope === "SUBJECT") payload.subjectId = newNotification.subjectId;
      if (!newNotification.sendImmediately && newNotification.scheduledAt) {
        payload.scheduledAt = new Date(newNotification.scheduledAt).toISOString();
      }

      await api.createPushNotification(payload);
      
      setIsCreateDialogOpen(false);
      setNewNotification({
        title: "",
        body: "",
        scope: "GLOBAL",
        targetUserTypes: [NotificationTargetUserType.ALL],
        priority: "NORMAL",
        instituteId: "",
        classId: "",
        subjectId: "",
        imageUrl: "",
        actionUrl: "",
        sendImmediately: true,
        scheduledAt: "",
      });
      
      toast({
        title: "Notification Created",
        description: newNotification.sendImmediately 
          ? "Your notification has been sent." 
          : "Your notification has been scheduled.",
      });
      
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create notification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNotification = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.sendPushNotification(id);
      toast({
        title: "Notification Sent",
        description: "The notification has been sent to all target users.",
      });
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelNotification = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.cancelPushNotification(id);
      toast({
        title: "Notification Cancelled",
        description: "The scheduled notification has been cancelled.",
      });
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel notification",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.deletePushNotification(id);
      toast({
        title: "Notification Deleted",
        description: "The notification has been deleted.",
      });
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentNotifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledNotifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedDeliveries}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>Create and manage push notifications for users</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchNotifications} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Push Notification</DialogTitle>
                  <DialogDescription>
                    Create a new push notification to send to users.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      placeholder="Notification title"
                      maxLength={255}
                    />
                    <span className="text-xs text-muted-foreground text-right">{newNotification.title.length}/255</span>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="body">Message *</Label>
                    <Textarea
                      id="body"
                      value={newNotification.body}
                      onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                      placeholder="Notification message"
                      rows={4}
                      maxLength={5000}
                    />
                    <span className="text-xs text-muted-foreground text-right">{newNotification.body.length}/5000</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Scope *</Label>
                      <Select
                        value={newNotification.scope}
                        onValueChange={(value) => setNewNotification({ 
                          ...newNotification, 
                          scope: value as NotificationScope,
                          instituteId: "",
                          classId: "",
                          subjectId: "",
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GLOBAL">Global (All Users)</SelectItem>
                          <SelectItem value="INSTITUTE">Institute-wide</SelectItem>
                          <SelectItem value="CLASS">Specific Class</SelectItem>
                          <SelectItem value="SUBJECT">Specific Subject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <Select
                        value={newNotification.priority}
                        onValueChange={(value) => setNewNotification({ ...newNotification, priority: value as NotificationPriority })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Institute Selection */}
                  {newNotification.scope !== "GLOBAL" && (
                    <div className="grid gap-2">
                      <Label>Institute *</Label>
                      <Select
                        value={newNotification.instituteId}
                        onValueChange={(value) => setNewNotification({ 
                          ...newNotification, 
                          instituteId: value,
                          classId: "",
                          subjectId: "",
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select institute" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutes.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Class Selection */}
                  {(newNotification.scope === "CLASS" || newNotification.scope === "SUBJECT") && newNotification.instituteId && (
                    <div className="grid gap-2">
                      <Label>Class *</Label>
                      <Select
                        value={newNotification.classId}
                        onValueChange={(value) => setNewNotification({ 
                          ...newNotification, 
                          classId: value,
                          subjectId: "",
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject Selection */}
                  {newNotification.scope === "SUBJECT" && newNotification.classId && (
                    <div className="grid gap-2">
                      <Label>Subject *</Label>
                      <Select
                        value={newNotification.subjectId}
                        onValueChange={(value) => setNewNotification({ ...newNotification, subjectId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Target Audience */}
                  <div className="grid gap-2">
                    <Label>Target Audience *</Label>
                    <div className="space-y-4 p-4 border rounded-md">
                      {/* Basic User Types */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Basic Roles</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.values(NotificationTargetUserType)
                            .filter(type => TARGET_USER_TYPE_CONFIG[type].category === 'basic')
                            .map((type) => (
                              <div key={type} className="flex items-start space-x-2">
                                <Checkbox
                                  id={type}
                                  checked={newNotification.targetUserTypes.includes(type)}
                                  onCheckedChange={(checked) => handleTargetTypeChange(type, !!checked)}
                                />
                                <div className="grid gap-0.5 leading-none">
                                  <label htmlFor={type} className="text-sm font-medium cursor-pointer">
                                    {TARGET_USER_TYPE_CONFIG[type].label}
                                  </label>
                                  <span className="text-xs text-muted-foreground">
                                    {TARGET_USER_TYPE_CONFIG[type].description}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Advanced Filters - Only show for GLOBAL scope */}
                      {newNotification.scope === "GLOBAL" && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Advanced Filters (Global Only)</p>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.values(NotificationTargetUserType)
                              .filter(type => TARGET_USER_TYPE_CONFIG[type].category === 'advanced')
                              .map((type) => (
                                <div key={type} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={type}
                                    checked={newNotification.targetUserTypes.includes(type)}
                                    onCheckedChange={(checked) => handleTargetTypeChange(type, !!checked)}
                                  />
                                  <div className="grid gap-0.5 leading-none">
                                    <label htmlFor={type} className="text-sm font-medium cursor-pointer">
                                      {TARGET_USER_TYPE_CONFIG[type].label}
                                    </label>
                                    <span className="text-xs text-muted-foreground">
                                      {TARGET_USER_TYPE_CONFIG[type].description}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {newNotification.targetUserTypes.includes(NotificationTargetUserType.ALL) && (
                      <p className="text-xs text-muted-foreground">
                        "All Users" is selected - notification will be sent to everyone.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="imageUrl" className="flex items-center gap-1">
                        <Image className="h-4 w-4" />
                        Image URL (Optional)
                      </Label>
                      <Input
                        id="imageUrl"
                        value={newNotification.imageUrl}
                        onChange={(e) => setNewNotification({ ...newNotification, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="actionUrl" className="flex items-center gap-1">
                        <Link className="h-4 w-4" />
                        Action URL (Optional)
                      </Label>
                      <Input
                        id="actionUrl"
                        value={newNotification.actionUrl}
                        onChange={(e) => setNewNotification({ ...newNotification, actionUrl: e.target.value })}
                        placeholder="/announcements/123 or https://..."
                      />
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendImmediately"
                        checked={newNotification.sendImmediately}
                        onCheckedChange={(checked) => setNewNotification({ ...newNotification, sendImmediately: !!checked })}
                      />
                      <label htmlFor="sendImmediately" className="text-sm font-medium">
                        Send Immediately
                      </label>
                    </div>
                  </div>

                  {!newNotification.sendImmediately && (
                    <div className="grid gap-2">
                      <Label htmlFor="scheduledAt" className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Schedule For
                      </Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={newNotification.scheduledAt}
                        onChange={(e) => setNewNotification({ ...newNotification, scheduledAt: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotification} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {newNotification.sendImmediately ? "Send Now" : "Schedule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found. Create your first notification to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {notification.body}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getScopeBadge(notification.scope)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {notification.targetUserTypes?.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(notification.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-green-600">{notification.sentCount || 0}</span>
                        {" / "}
                        <span className="text-muted-foreground">{notification.totalRecipients || 0}</span>
                        {notification.failedCount > 0 && (
                          <span className="text-red-500 ml-1">({notification.failedCount} failed)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {notification.createdAt 
                          ? new Date(notification.createdAt).toLocaleDateString()
                          : notification.sentAt 
                            ? new Date(notification.sentAt).toLocaleDateString()
                            : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoadingId === notification.id}>
                            {actionLoadingId === notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(notification.status === "DRAFT" || notification.status === "FAILED") && (
                            <DropdownMenuItem onClick={() => handleSendNotification(notification.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                          )}
                          {notification.status === "SCHEDULED" && (
                            <DropdownMenuItem onClick={() => handleCancelNotification(notification.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDashboard;