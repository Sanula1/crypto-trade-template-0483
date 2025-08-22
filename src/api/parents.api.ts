
import { apiClient } from './client';

export interface ParentCreateData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    nic?: string;
    birthCertificateNo?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    imageUrl?: string;
    isActive?: boolean;
  };
  occupation: string;
  workplace?: string;
  workPhone?: string;
  educationLevel?: string;
  isActive?: boolean;
}

export interface Parent {
  userId: string;
  occupation: string;
  workplace?: string;
  workPhone?: string;
  educationLevel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    userType: string;
    dateOfBirth: string;
    gender: string;
    imageUrl?: string;
    isActive: boolean;
    subscriptionPlan: string;
    createdAt: string;
  };
}

export const parentsApi = {
  create: async (data: ParentCreateData): Promise<Parent> => {
    const response = await apiClient.post('/parents', data);
    return response.data;
  }
};
