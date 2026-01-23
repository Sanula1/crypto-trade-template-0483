// Notification Types for Super Admin
export enum SuperAdminNotificationType {
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE = 'MAINTENANCE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  USER_ACTIVITY = 'USER_ACTIVITY',
  INSTITUTE_ALERT = 'INSTITUTE_ALERT',
  PAYMENT_ALERT = 'PAYMENT_ALERT',
  COMPLIANCE_NOTICE = 'COMPLIANCE_NOTICE',
  BROADCAST = 'BROADCAST',
  BULK_OPERATION = 'BULK_OPERATION',
  USAGE_ALERT = 'USAGE_ALERT'
}

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TargetAudience {
  ALL_USERS = 'ALL_USERS',
  ALL_INSTITUTES = 'ALL_INSTITUTES',
  SPECIFIC_INSTITUTES = 'SPECIFIC_INSTITUTES',
  SPECIFIC_USERS = 'SPECIFIC_USERS'
}

export enum SystemAlertCategory {
  MAINTENANCE = 'MAINTENANCE',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  DATA = 'DATA',
  COMPLIANCE = 'COMPLIANCE',
  SERVICE = 'SERVICE'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: SuperAdminNotificationType;
  targetAudience: TargetAudience;
  instituteIds?: number[];
  userIds?: number[];
  imageUrl?: string;
  actionUrl?: string;
  createdAt: string;
  sentAt?: string;
  scheduledTime?: string;
  deliveryStats: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  status: NotificationStatus;
}

export interface SystemAlert {
  id: string;
  category: SystemAlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  affectedSystems: string[];
  estimatedResolutionTime?: string;
  actionRequired: boolean;
  createdAt: string;
  resolvedAt?: string;
  notificationsSent: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: SuperAdminNotificationType;
  titleTemplate: string;
  messageTemplate: string;
  variables: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  successRate: number;
  averageDeliveryTime: number;
  byType: Record<string, number>;
  byInstitute: Array<{
    instituteName: string;
    notificationsSent: number;
    deliveryRate: number;
  }>;
  timeline: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}
