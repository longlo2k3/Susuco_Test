export type ProfileStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface Teacher extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: ProfileStatus;
}

export interface Student extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: ProfileStatus;
}

export interface Classroom extends BaseEntity {
  name: string;
  capacity: number;
  location: string;
  status: ProfileStatus;
}

export type CourseStatus = 'DRAFT' | 'PENDING' | 'ENROLLING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Course extends BaseEntity {
  name: string;
  teacherId?: string;
  classroomId: string;
  minStudents: number;
  maxStudents: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: CourseStatus;
}

export type SessionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CourseSession extends BaseEntity {
  courseId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SessionStatus;
}

export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Enrollment extends BaseEntity {
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
}
