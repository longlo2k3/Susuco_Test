import { useState, useEffect, useCallback } from 'react';
import type { Enrollment } from '../types';
import { dbService } from '../services/db.service';
import { isTimeOverlap } from '../utils/scheduleLogic';
import { message } from 'antd';

export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEnrollments = useCallback(() => {
    setLoading(true);
    try {
      setEnrollments(dbService.getTable('enrollments'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const enrollStudent = (courseId: string, studentId: string) => {
    const course = dbService.getTable('courses').find(c => c.id === courseId);
    if (!course || course.status !== 'ENROLLING') {
      message.error('Khóa học không tồn tại hoặc đã ngừng tuyển sinh');
      return false;
    }

    const currentEnrollments = dbService.getTable('enrollments').filter(e => e.courseId === courseId && (e.status === 'APPROVED' || e.status === 'PENDING'));
    if (currentEnrollments.length >= course.maxStudents) {
      message.error('Khóa học đã vượt quá sức chứa');
      return false;
    }

    const student = dbService.getTable('students').find(s => s.id === studentId);
    if (!student || student.status !== 'ACTIVE') {
      message.error('Học viên không hợp lệ hoặc đang không hoạt động');
      return false;
    }

    const exists = currentEnrollments.find(e => e.studentId === studentId);
    if (exists) {
      message.error('Học viên đã đăng ký khóa học này');
      return false;
    }

    const newCourseSessions = dbService.getTable('sessions').filter(s => s.courseId === courseId);
    const studentEnrollments = dbService.getTable('enrollments').filter(e => 
      e.studentId === studentId && (e.status === 'PENDING' || e.status === 'APPROVED')
    );

    for (const currentEnrollment of studentEnrollments) {
      const existingSessions = dbService.getTable('sessions').filter(s => s.courseId === currentEnrollment.courseId && s.status !== 'CANCELLED');
      for (const newSession of newCourseSessions) {
        const conflict = existingSessions.find(ex => 
          ex.date === newSession.date && 
          isTimeOverlap(newSession.startTime, newSession.endTime, ex.startTime, ex.endTime)
        );
        if (conflict) {
          message.error(`Học viên đang bị trùng lịch với khóa học khác vào ngày ${newSession.date}`);
          return false;
        }
      }
    }

    const newEnrollment: Enrollment = {
      id: Date.now().toString(),
      courseId,
      studentId,
      status: 'PENDING',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...enrollments, newEnrollment];
    dbService.saveTable('enrollments', updated);
    setEnrollments(updated);
    message.success('Đăng ký học viên thành công');
    return true;
  };

  const updateEnrollmentStatus = (id: string, status: Enrollment['status']) => {
      const updated = enrollments.map(e => e.id === id ? { ...e, status } : e);
      dbService.saveTable('enrollments', updated);
      setEnrollments(updated);
      message.success('Cập nhật trạng thái đăng ký thành công');
  }

  return { enrollments, loading, enrollStudent, updateEnrollmentStatus, refresh: fetchEnrollments };
};
