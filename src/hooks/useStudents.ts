import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { dbService } from '../services/db.service';
import { message } from 'antd';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    try {
      const data = dbService.getTable('students');
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...students, newStudent];
    dbService.saveTable('students', updated);
    setStudents(updated);
    message.success('Thêm học viên thành công');
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    const updated = students.map(s => s.id === id ? { ...s, ...data, updatedAt: Date.now() } : s);
    dbService.saveTable('students', updated);
    setStudents(updated);
    message.success('Cập nhật học viên thành công');
  };

  const deleteStudent = (id: string) => {
    const enrollments = dbService.getTable('enrollments').filter(e => e.studentId === id && e.status === 'APPROVED');
    const courses = dbService.getTable('courses');
    
    const activeCourses = courses.filter(c => 
      (c.status === 'ENROLLING' || c.status === 'IN_PROGRESS') &&
      enrollments.some(e => e.courseId === c.id)
    );

    if (activeCourses.length > 0) {
      message.error(`Không thể xóa! Học viên đang tham gia ${activeCourses.length} khóa học chưa kết thúc.`);
      return false;
    }

    const updated = students.filter(s => s.id !== id);
    dbService.saveTable('students', updated);
    setStudents(updated);
    message.success('Xóa học viên thành công');
    return true;
  };

  return { students, loading, addStudent, updateStudent, deleteStudent, refresh: fetchStudents };
};
