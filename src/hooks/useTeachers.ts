import { useState, useEffect, useCallback } from 'react';
import type { Teacher } from '../types';
import { dbService } from '../services/db.service';
import { message } from 'antd';

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeachers = useCallback(() => {
    setLoading(true);
    try {
      const data = dbService.getTable('teachers');
      setTeachers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const addTeacher = (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTeacher: Teacher = {
      ...teacher,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...teachers, newTeacher];
    dbService.saveTable('teachers', updated);
    setTeachers(updated);
    message.success('Thêm giảng viên thành công');
  };

  const updateTeacher = (id: string, data: Partial<Teacher>) => {
    const updated = teachers.map(t => t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t);
    dbService.saveTable('teachers', updated);
    setTeachers(updated);
    message.success('Cập nhật giảng viên thành công');
  };

  const deleteTeacher = (id: string) => {
    const courses = dbService.getTable('courses');
    const activeCourses = courses.filter(c => 
      c.teacherId === id && 
      (c.status === 'ENROLLING' || c.status === 'IN_PROGRESS')
    );

    if (activeCourses.length > 0) {
      message.error(`Không thể xóa! Giảng viên đang được phân công dạy ${activeCourses.length} khóa học chưa kết thúc.`);
      return false;
    }

    const updated = teachers.filter(t => t.id !== id);
    dbService.saveTable('teachers', updated);
    setTeachers(updated);
    message.success('Xóa giảng viên thành công');
    return true;
  };

  return { teachers, loading, addTeacher, updateTeacher, deleteTeacher, refresh: fetchTeachers };
};
