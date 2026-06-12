import { useState, useEffect, useCallback } from 'react';
import type { Course, CourseSession } from '../types';
import { dbService } from '../services/db.service';
import { syncCourseStatuses } from '../utils/courseLogic';
import { checkScheduleConflict } from '../utils/scheduleLogic';
import { message } from 'antd';

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    try {
      syncCourseStatuses();
      setCourses(dbService.getTable('courses'));
      setSessions(dbService.getTable('sessions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addCourse = (
    courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status'>, 
    sessionDataList: Array<{date: string, startTime: string, endTime: string}>
  ) => {
    if (courseData.teacherId) {
      const teacher = dbService.getTable('teachers').find(t => t.id === courseData.teacherId);
      if (!teacher || teacher.status !== 'ACTIVE') {
        message.error('Giảng viên không hợp lệ hoặc đang không hoạt động');
        return false;
      }
    }
    
    const classroom = dbService.getTable('classrooms').find(c => c.id === courseData.classroomId);
    if (!classroom || classroom.status !== 'ACTIVE') {
      message.error('Phòng học không hợp lệ hoặc đang không hoạt động');
      return false;
    }

    for (const session of sessionDataList) {
      if (courseData.teacherId && checkScheduleConflict(session.date, session.startTime, session.endTime, 'teacher', courseData.teacherId)) {
        message.error(`Giảng viên bị trùng lịch dạy vào ngày ${session.date} (${session.startTime}-${session.endTime})`);
        return false;
      }
      if (checkScheduleConflict(session.date, session.startTime, session.endTime, 'classroom', courseData.classroomId)) {
        message.error(`Phòng học đã được sử dụng vào ngày ${session.date} (${session.startTime}-${session.endTime})`);
        return false;
      }
    }

    const courseId = Date.now().toString();
    const newCourse: Course = {
      ...courseData,
      id: courseId,
      status: 'ENROLLING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newSessions: CourseSession[] = sessionDataList.map((s, i) => ({
      ...s,
      id: `${courseId}_s${i}`,
      courseId,
      status: 'PENDING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    dbService.saveTable('courses', [...courses, newCourse]);
    dbService.saveTable('sessions', [...sessions, ...newSessions]);
    fetchData();
    message.success('Tạo khóa học và lịch dạy thành công');
    return true;
  };

  const updateCourseStatus = (id: string, status: Course['status']) => {
      const updatedCourses = courses.map(c => c.id === id ? { ...c, status } : c);
      dbService.saveTable('courses', updatedCourses);
      fetchData();
      message.success('Cập nhật trạng thái thành công');
  }

  return { courses, sessions, loading, addCourse, updateCourseStatus, refresh: fetchData };
};
