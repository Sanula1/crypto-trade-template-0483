const BASE_URL = "https://lmsapi.suraksha.lk";

export const getAuthToken = () => localStorage.getItem("access_token");

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Include server error message when available
    let details = "";
    try {
      const text = await response.text();
      details = text;
      try {
        const parsed = JSON.parse(text);
        const msg = parsed?.message || parsed?.details?.message || parsed?.error;
        if (typeof msg === "string" && msg.trim()) {
          throw new Error(msg);
        }
      } catch {
        // not JSON
      }
    } catch {
      // ignore
    }

    throw new Error(
      details?.trim()
        ? `API Error: ${response.status} - ${details}`
        : `API Error: ${response.status}`
    );
  }

  // Some endpoints may return 204
  if (response.status === 204) return null;

  return response.json();
};

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest("/v2/auth/login", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }),

  // Users
  getUsers: (page = 1, limit = 10, isActive = true) =>
    apiRequest(`/users?page=${page}&limit=${limit}&isActive=${isActive}`),

  createUser: (data: any) =>
    apiRequest("/users/comprehensive", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Institutes
  getInstitutes: (page = 1, limit = 10, isActive = true) =>
    apiRequest(`/institutes?page=${page}&limit=${limit}&search=&instituteType=&isActive=${isActive}`),

  createInstitute: (data: any) =>
    apiRequest("/institutes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Subjects
  getSubjects: (page = 1, limit = 10) =>
    apiRequest(`/subjects/all?page=${page}&limit=${limit}`),

  createSubject: (data: any) =>
    apiRequest("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // System Payments
  getPayments: (page = 1, limit = 10) =>
    apiRequest(`/payment?page=${page}&limit=${limit}`),

  verifyPayment: (paymentId: string, data: {
    status: string;
    subscriptionPlan: string;
    paymentValidityDays: number;
    notes: string;
  }) =>
    apiRequest(`/payment/${paymentId}/verify`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // SMS Payments
  getSMSPayments: (page = 1, limit = 10) =>
    apiRequest(`/sms/admin/verifications/pending?page=${page}&limit=${limit}`),

  verifySMSPayment: (submissionId: string, data: {
    action: string;
    creditsToGrant: number;
    adminNotes: string;
  }) =>
    apiRequest(`/sms/admin/verifications/${submissionId}/verify`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // SMS Approvals
  getSMSApprovals: (page = 1, limit = 10) =>
    apiRequest(`/sms/admin/pending-approvals?page=${page}&limit=${limit}`),

  approveSMSCampaign: (messageId: string, data: { adminNotes: string }) =>
    apiRequest(`/sms/admin/campaigns/${messageId}/approve`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  rejectSMSCampaign: (messageId: string, data: { rejectionReason: string; adminNotes: string }) =>
    apiRequest(`/sms/admin/campaigns/${messageId}/reject`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // File Upload
  getSignedUrl: (folder: string, fileName: string, contentType: string, fileSize: number) =>
    apiRequest(`/upload/get-signed-url?folder=${encodeURIComponent(folder)}&fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}&fileSize=${fileSize}`, {
      method: "GET",
    }),

  verifyAndPublish: (relativePath: string) =>
    apiRequest("/upload/verify-and-publish", {
      method: "POST",
      body: JSON.stringify({ relativePath }),
    }),

  // Institute Users
  assignUserToInstitute: (instituteId: string, data: {
    userId: string;
    instituteUserType: string;
    userIdByInstitute: string;
    instituteCardId?: string;
    instituteImage?: string;
  }) =>
    apiRequest(`/institute-users/institute/${instituteId}/assign-user-by-id`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // User RFID
  registerRfid: (userId: string, userRfid: string) =>
    apiRequest("/users/register-rfid", {
      method: "POST",
      body: JSON.stringify({ userId, userRfid }),
    }),

  // User Activate/Deactivate
  deactivateUser: (userId: string) =>
    apiRequest(`/users/${userId}/deactivate`, {
      method: "PATCH",
    }),

  activateUser: (userId: string) =>
    apiRequest(`/users/${userId}/activate`, {
      method: "PATCH",
    }),

  // SMS Sender Masks
  createSenderMask: (data: {
    instituteId: string;
    maskId: string;
    displayName: string;
    phoneNumber: string;
    isActive: boolean;
  }) =>
    apiRequest("/sms/sender-masks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSenderMasks: (instituteId: string) =>
    apiRequest(`/sms/sender-masks?instituteId=${instituteId}`),

  // Advertisements
  getAdvertisements: (page = 1, limit = 10) =>
    apiRequest(`/api/advertisements?page=${page}&limit=${limit}`),

  createAdvertisement: (data: any) =>
    apiRequest("/api/advertisements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Organizations
  getOrganizations: (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    return apiRequest(`/organizations?${queryParams.toString()}`);
  },

  getOrganizationById: (id: string) =>
    apiRequest(`/organizations/${id}`),

  createOrganization: (data: {
    name: string;
    type: string;
    isPublic?: boolean;
    enrollmentKey?: string;
    needEnrollmentVerification?: boolean;
    enabledEnrollments?: boolean;
    imageUrl?: string;
    instituteId?: string;
  }) =>
    apiRequest("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateOrganization: (id: string, data: {
    name?: string;
    isPublic?: boolean;
    enrollmentKey?: string;
    needEnrollmentVerification?: boolean;
    enabledEnrollments?: boolean;
    imageUrl?: string;
    instituteId?: string;
  }) =>
    apiRequest(`/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteOrganization: (id: string) =>
    apiRequest(`/organizations/${id}`, {
      method: "DELETE",
    }),

  // Organization Members
  getOrganizationMembers: (id: string, page = 1, limit = 50) =>
    apiRequest(`/organizations/${id}/members?page=${page}&limit=${limit}`),

  getUnverifiedMembers: (id: string) =>
    apiRequest(`/organizations/${id}/members/unverified`),

  verifyMember: (id: string, userId: string) =>
    apiRequest(`/organizations/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ userId }),
    }),

  // Organization Management
  assignRole: (id: string, data: { userId: string; role: string }) =>
    apiRequest(`/organizations/${id}/management/assign-role`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  changeRole: (id: string, data: { userId: string; newRole: string }) =>
    apiRequest(`/organizations/${id}/management/change-role`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  removeUserFromOrganization: (id: string, userId: string) =>
    apiRequest(`/organizations/${id}/management/remove-user`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  transferPresidency: (id: string, newPresidentUserId: string) =>
    apiRequest(`/organizations/${id}/management/transfer-presidency`, {
      method: "PUT",
      body: JSON.stringify({ newPresidentUserId }),
    }),

  // Enrollment
  enrollInOrganization: (data: { organizationId: string; enrollmentKey?: string }) =>
    apiRequest("/organizations/enroll", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  leaveOrganization: (id: string) =>
    apiRequest(`/organizations/${id}/leave`, {
      method: "DELETE",
    }),

  getUserEnrolledOrganizations: (page = 1, limit = 10) =>
    apiRequest(`/organizations/user/enrolled?page=${page}&limit=${limit}`),

  getUserNotEnrolledOrganizations: (page = 1, limit = 10) =>
    apiRequest(`/organizations/user/not-enrolled?page=${page}&limit=${limit}`),

  // Institute Operations for Organizations
  assignInstituteToOrganization: (id: string, instituteId: string) =>
    apiRequest(`/organizations/${id}/assign-institute`, {
      method: "PUT",
      body: JSON.stringify({ instituteId }),
    }),

  removeInstituteFromOrganization: (id: string) =>
    apiRequest(`/organizations/${id}/remove-institute`, {
      method: "DELETE",
    }),

  getOrganizationsByInstitute: (instituteId: string, page = 1, limit = 10) =>
    apiRequest(`/organizations/institute/${instituteId}?page=${page}&limit=${limit}`),

  getAvailableInstitutesForOrg: () =>
    apiRequest("/organizations/institutes/available"),

  // Institute Update
  updateInstitute: (id: string, data: any) =>
    apiRequest(`/institutes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Subject Update
  updateSubject: (id: string, data: any) =>
    apiRequest(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Structured Lectures
  getStructuredLectures: (page = 1, limit = 10) =>
    apiRequest(`/api/structured-lectures?page=${page}&limit=${limit}`),

  createStructuredLecture: (data: any) =>
    apiRequest("/api/structured-lectures", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // =============== CARD MANAGEMENT ===============

  // Admin Cards CRUD
  getAdminCards: (params: {
    page?: number;
    limit?: number;
    cardType?: string;
    isActive?: boolean;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.cardType) queryParams.append("cardType", params.cardType);
    if (params.isActive !== undefined) queryParams.append("isActive", String(params.isActive));
    if (params.search) queryParams.append("search", params.search);
    return apiRequest(`/admin/cards?${queryParams.toString()}`);
  },

  createCard: (data: {
    cardName: string;
    cardType: string;
    cardImageUrl?: string;
    cardVideoUrl?: string;
    description?: string;
    price: number;
    quantityAvailable: number;
    validityDays: number;
  }) =>
    apiRequest("/admin/cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCard: (id: number, data: {
    cardName?: string;
    price?: number;
    quantityAvailable?: number;
    cardImageUrl?: string;
    cardVideoUrl?: string;
    description?: string;
    validityDays?: number;
    isActive?: boolean;
  }) =>
    apiRequest(`/admin/cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCard: (id: number) =>
    apiRequest(`/admin/cards/${id}`, {
      method: "DELETE",
    }),

  // Admin Card Orders
  getAdminCardOrders: (params: {
    page?: number;
    limit?: number;
    orderStatus?: string;
    cardStatus?: string;
    cardType?: string;
    userId?: number;
    cardId?: number;
    startDate?: string;
    endDate?: string;
    hasRfid?: boolean;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.orderStatus) queryParams.append("orderStatus", params.orderStatus);
    if (params.cardStatus) queryParams.append("cardStatus", params.cardStatus);
    if (params.cardType) queryParams.append("cardType", params.cardType);
    if (params.userId) queryParams.append("userId", String(params.userId));
    if (params.cardId) queryParams.append("cardId", String(params.cardId));
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.hasRfid !== undefined) queryParams.append("hasRfid", String(params.hasRfid));
    if (params.search) queryParams.append("search", params.search);
    return apiRequest(`/admin/card-orders?${queryParams.toString()}`);
  },

  updateOrderStatus: (orderId: number, data: {
    orderStatus: string;
    trackingNumber?: string;
    rejectedReason?: string;
    notes?: string;
  }) =>
    apiRequest(`/admin/card-orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  assignOrderRfid: (orderId: number, rfidNumber: string) =>
    apiRequest(`/admin/card-orders/${orderId}/rfid`, {
      method: "PATCH",
      body: JSON.stringify({ rfidNumber }),
    }),

  updateCardStatus: (orderId: number, data: {
    status: string;
    notes?: string;
  }) =>
    apiRequest(`/admin/card-orders/${orderId}/card-status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getOrderStatistics: () =>
    apiRequest("/admin/card-orders/statistics"),

  // Admin Card Payments
  getAdminCardPayments: (params: {
    page?: number;
    limit?: number;
    paymentStatus?: string;
    paymentType?: string;
    orderId?: number;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
    if (params.paymentType) queryParams.append("paymentType", params.paymentType);
    if (params.orderId) queryParams.append("orderId", String(params.orderId));
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    return apiRequest(`/admin/card-payments?${queryParams.toString()}`);
  },

  verifyCardPayment: (paymentId: number, data: {
    paymentStatus: string;
    rejectionReason?: string;
    notes?: string;
  }) =>
    apiRequest(`/admin/card-payments/${paymentId}/verify`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // =============== PUSH NOTIFICATIONS ===============

  // ===== Admin APIs - Create & Manage =====
  
  // Create Push Notification
  createPushNotification: (data: {
    title: string;
    body: string;
    imageUrl?: string;
    icon?: string;
    actionUrl?: string;
    dataPayload?: Record<string, string>;
    scope: 'GLOBAL' | 'INSTITUTE' | 'CLASS' | 'SUBJECT';
    targetUserTypes: (
      | 'ALL' 
      | 'STUDENTS' 
      | 'TEACHERS' 
      | 'PARENTS' 
      | 'ATTENDANCE_MARKERS' 
      | 'INSTITUTE_ADMINS'
      | 'USERS_WITHOUT_INSTITUTE'
      | 'USERS_WITHOUT_PARENT'
      | 'USERS_WITHOUT_STUDENT'
      | 'VERIFIED_USERS_ONLY'
      | 'UNVERIFIED_USERS_ONLY'
    )[];
    instituteId?: string;
    classId?: string;
    subjectId?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    collapseKey?: string;
    timeToLive?: number;
    scheduledAt?: string;
    sendImmediately?: boolean;
  }) =>
    apiRequest("/push-notifications/admin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get All Notifications (Admin View)
  getAdminNotifications: (params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    scope?: 'GLOBAL' | 'INSTITUTE' | 'CLASS' | 'SUBJECT';
    status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
    instituteId?: string;
    classId?: string;
    subjectId?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    senderId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.scope) queryParams.append("scope", params.scope);
    if (params.status) queryParams.append("status", params.status);
    if (params.instituteId) queryParams.append("instituteId", params.instituteId);
    if (params.classId) queryParams.append("classId", params.classId);
    if (params.subjectId) queryParams.append("subjectId", params.subjectId);
    if (params.priority) queryParams.append("priority", params.priority);
    if (params.senderId) queryParams.append("senderId", params.senderId);
    if (params.search) queryParams.append("search", params.search);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    return apiRequest(`/push-notifications/admin?${queryParams.toString()}`);
  },

  // Get Single Notification (Admin)
  getAdminNotificationById: (id: string) =>
    apiRequest(`/push-notifications/admin/${id}`),

  // Send Notification
  sendPushNotification: (id: string) =>
    apiRequest(`/push-notifications/admin/${id}/send`, {
      method: "POST",
    }),

  // Resend Failed Notification
  resendPushNotification: (id: string) =>
    apiRequest(`/push-notifications/admin/${id}/resend`, {
      method: "POST",
    }),

  // Cancel Notification
  cancelPushNotification: (id: string) =>
    apiRequest(`/push-notifications/admin/${id}/cancel`, {
      method: "PUT",
    }),

  // Delete Notification
  deletePushNotification: (id: string) =>
    apiRequest(`/push-notifications/admin/${id}`, {
      method: "DELETE",
    }),

  // ===== User APIs - View & Read =====

  // Get Institute Notifications
  getInstituteNotifications: (instituteId: string, params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.unreadOnly) queryParams.append("unreadOnly", String(params.unreadOnly));
    if (params.priority) queryParams.append("priority", params.priority);
    return apiRequest(`/push-notifications/institute/${instituteId}?${queryParams.toString()}`);
  },

  // Get System/Global Notifications
  getSystemNotifications: (params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.unreadOnly) queryParams.append("unreadOnly", String(params.unreadOnly));
    if (params.priority) queryParams.append("priority", params.priority);
    return apiRequest(`/push-notifications/system?${queryParams.toString()}`);
  },

  // Get Unread Count - Institute
  getInstituteUnreadCount: (instituteId: string) =>
    apiRequest(`/push-notifications/institute/${instituteId}/unread-count`),

  // Get Unread Count - System
  getSystemUnreadCount: () =>
    apiRequest(`/push-notifications/system/unread-count`),

  // Mark Notification as Read
  markNotificationAsRead: (id: string) =>
    apiRequest(`/push-notifications/${id}/read`, {
      method: "POST",
    }),

  // Mark Multiple Notifications as Read
  markMultipleNotificationsAsRead: (notificationIds: string[]) =>
    apiRequest(`/push-notifications/mark-read`, {
      method: "POST",
      body: JSON.stringify({ notificationIds }),
    }),

  // Mark All Institute Notifications as Read
  markAllInstituteNotificationsAsRead: (instituteId: string) =>
    apiRequest(`/push-notifications/institute/${instituteId}/mark-all-read`, {
      method: "POST",
    }),

  // ===== FCM Token Management =====

  // Register FCM Token
  registerFcmToken: (data: {
    token: string;
    deviceType: 'WEB' | 'ANDROID' | 'IOS';
    deviceInfo?: string;
  }) =>
    apiRequest("/users/fcm-tokens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get User's FCM Tokens
  getUserFcmTokens: (userId: string) =>
    apiRequest(`/users/fcm-tokens/user/${userId}`),

  // Delete FCM Token
  deleteFcmToken: (tokenId: string) =>
    apiRequest(`/users/fcm-tokens/${tokenId}`, {
      method: "DELETE",
    }),

  // ===== Classes & Subjects for Notification Targeting =====
  
  // Get Classes by Institute
  getClassesByInstitute: (instituteId: string) =>
    apiRequest(`/classes?instituteId=${instituteId}`),

  // Get Subjects by Class
  getSubjectsByClass: (classId: string) =>
    apiRequest(`/subjects?classId=${classId}`),
};
