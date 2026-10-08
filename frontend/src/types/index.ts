export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roleName: 'STUDENT' | 'MENTOR' | 'CLUSTER_HEAD' | 'ADMIN';
  rollNumber?: string;
  department?: string;
  phone?: string;
  profileImage?: string;
  active: boolean;
  createdAt: string;
}

export interface ProjectSummary {
  id: number;
  projectCode: string;
  title: string;
  domain: string;
  status: string;
  studentName?: string;
  mentorName?: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectSummary {
  description: string;
  technologyStack: string;
  academicYear: string;
  semester: string;
  student: User;
  mentor?: User;
  clusterHead?: User;
  members: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  student: User;
  role: string;
}

export interface Submission {
  id: number;
  projectId: number;
  projectTitle: string;
  projectCode: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  submissionType: 'INITIAL' | 'REVISED' | 'FINAL';
  submittedBy: User;
  submissionDate: string;
  status: string;
  remarks?: string;
  review?: Review;
  createdAt: string;
}

export interface Review {
  id: number;
  submissionId: number;
  reviewer: User;
  reviewerRole: string;
  comments: string;
  technicalScore: number;
  documentationScore: number;
  innovationScore: number;
  presentationScore: number;
  overallScore: number;
  recommendation: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedProjectId?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  validationErrors?: Record<string, string>;
}
