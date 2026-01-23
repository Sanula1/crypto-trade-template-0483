export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum ProfileCompletionStatus {
  INCOMPLETE = 'INCOMPLETE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  COMPLETE = 'COMPLETE'
}

export interface MinimalUserData {
  firstName?: string;
  lastName?: string;
  nameWithInitials?: string;
  email?: string;
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string;
  nic?: string;
  birthCertificateNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  district?: string;
  occupation?: string;
  bloodGroup?: string;
  allergies?: string;
}

export interface CreateFamilyUnitRequest {
  student: MinimalUserData & {
    studentId?: string;
  };
  father?: MinimalUserData;
  mother?: MinimalUserData;
  guardian?: MinimalUserData & {
    relationshipToStudent?: string;
  };
  sendWelcomeNotifications?: boolean;
  instituteCode?: string;
}

export interface CreateFamilyUnitResponse {
  success: boolean;
  student: {
    id: string;
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    studentId: string;
    profileCompletionStatus: ProfileCompletionStatus;
    profileCompletionPercentage: number;
    needsFirstLogin: boolean;
  };
  father?: {
    id: string;
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    profileCompletionStatus: ProfileCompletionStatus;
    isExisting: boolean;
  };
  mother?: {
    id: string;
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    profileCompletionStatus: ProfileCompletionStatus;
    isExisting: boolean;
  };
  guardian?: {
    id: string;
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    profileCompletionStatus: ProfileCompletionStatus;
    isExisting: boolean;
  };
  notificationsSent: {
    student: boolean;
    father?: boolean;
    mother?: boolean;
    guardian?: boolean;
  };
}

export interface IncompleteProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profileCompletionStatus: ProfileCompletionStatus;
  profileCompletionPercentage: number;
  createdAt: string;
}

export interface BulkCreateResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    index: number;
    success: boolean;
    data?: CreateFamilyUnitResponse;
    error?: string;
  }>;
}
