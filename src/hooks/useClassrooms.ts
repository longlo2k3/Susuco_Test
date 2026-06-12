import { useState, useEffect, useCallback } from 'react';
import type { Classroom } from '../types';
import { dbService } from '../services/db.service';
import { message } from 'antd';

export const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = useCallback(() => {
    setLoading(true);
    try {
      const data = dbService.getTable('classrooms');
      setClassrooms(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const addClassroom = (classroom: Omit<Classroom, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClassroom: Classroom = {
      ...classroom,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...classrooms, newClassroom];
    dbService.saveTable('classrooms', updated);
    setClassrooms(updated);
    message.success('Thêm phòng học thành công');
  };

  const updateClassroom = (id: string, data: Partial<Classroom>) => {
    const updated = classrooms.map(c => c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c);
    dbService.saveTable('classrooms', updated);
    setClassrooms(updated);
    message.success('Cập nhật phòng học thành công');
  };

  const deleteClassroom = (id: string) => {
    const courses = dbService.getTable('courses');
    const activeCourses = courses.filter(c => 
      c.classroomId === id && 
      (c.status === 'ENROLLING' || c.status === 'IN_PROGRESS')
    );

    if (activeCourses.length > 0) {
      message.error(`Không thể xóa! Phòng học đang được sử dụng cho ${activeCourses.length} khóa học.`);
      return false;
    }

    const updated = classrooms.filter(c => c.id !== id);
    dbService.saveTable('classrooms', updated);
    setClassrooms(updated);
    message.success('Xóa phòng học thành công');
    return true;
  };

  return { classrooms, loading, addClassroom, updateClassroom, deleteClassroom, refresh: fetchClassrooms };
};
