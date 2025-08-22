
import { apiClient } from './client';

export interface InstituteClassCreateData {
  instituteId: string;
  name: string;
  code: string;
  academicYear: string;
  level: number;
  grade: number;
  specialty: string;
  classType: string;
  capacity: number;
  classTeacherId?: string;
  description?: string;
  isActive?: boolean;
  startDate: string;
  endDate: string;
  enrollmentCode?: string;
  enrollmentEnabled?: boolean;
  requireTeacherVerification?: boolean;
  imageUrl?: string;
}

export interface InstituteClass {
  id: string;
  instituteId: string;
  name: string;
  code: string;
  academicYear: string;
  level: number;
  grade: number;
  specialty: string;
  classType: string;
  capacity: number;
  classTeacherId?: string;
  description?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  enrollmentCode?: string;
  enrollmentEnabled: boolean;
  requireTeacherVerification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstituteClassResponse {
  class: InstituteClass;
  message: string;
}

export const instituteClassesApi = {
  create: async (data: InstituteClassCreateData): Promise<InstituteClassResponse> => {
    const response = await apiClient.post('/institute-classes', data);
    return response.data;
  }
};
