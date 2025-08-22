
// Main API client
export { apiClient } from './client';
export type { ApiResponse, ApiError } from './client';

// Homework API
export { homeworkApi } from './homework.api';
export type { 
  Homework, 
  HomeworkCreateData, 
  HomeworkUpdateData, 
  HomeworkQueryParams 
} from './homework.api';

// Exam API
export { examApi } from './exam.api';
export type { 
  Exam, 
  ExamCreateData, 
  ExamQueryParams 
} from './exam.api';

// Lecture API
export { lectureApi } from './lecture.api';
export type { 
  Lecture, 
  LectureCreateData, 
  LectureQueryParams 
} from './lecture.api';

// Institute API
export { instituteApi } from './institute.api';
export type { 
  Institute, 
  Class, 
  Subject, 
  Teacher, 
  InstituteQueryParams 
} from './institute.api';

// Organization API
export { organizationApi } from './organization.api';
export type { 
  Organization, 
  OrganizationCreateData, 
  OrganizationQueryParams 
} from './organization.api';

// Users API
export { usersApi } from './users.api';
export type { 
  User as ApiUser, 
  UserCreateData 
} from './users.api';

// Students API
export { studentsApi } from './students.api';
export type { 
  Student, 
  StudentCreateData 
} from './students.api';

// Parents API
export { parentsApi } from './parents.api';
export type { 
  Parent, 
  ParentCreateData 
} from './parents.api';

// Institute Classes API
export { instituteClassesApi } from './instituteClasses.api';
export type { 
  InstituteClass, 
  InstituteClassCreateData, 
  InstituteClassResponse 
} from './instituteClasses.api';

// Re-export auth API utilities
export { getBaseUrl, getApiHeaders } from '@/contexts/utils/auth.api';
