import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db.service';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { timeToMinutes } from '../utils/scheduleLogic';

dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  hoursThisWeek: number;
  hoursThisMonth: number;
  hoursThisQuarter: number;
}

export const useTeacherWorkload = () => {
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);

  const fetchWorkloads = useCallback(() => {
    const teachers = dbService.getTable('teachers');
    const courses = dbService.getTable('courses');
    const sessions = dbService.getTable('sessions').filter(s => s.status !== 'CANCELLED');

    const now = dayjs();
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');
    const startOfMonth = now.startOf('month');
    const endOfMonth = now.endOf('month');
    const startOfQuarter = now.startOf('quarter');
    const endOfQuarter = now.endOf('quarter');

    const result = teachers.map(teacher => {
      let minsWeek = 0;
      let minsMonth = 0;
      let minsQuarter = 0;

      const teacherCourses = courses.filter(c => c.teacherId === teacher.id && c.status !== 'CANCELLED');
      const courseIds = new Set(teacherCourses.map(c => c.id));

      sessions.forEach(session => {
        if (courseIds.has(session.courseId)) {
          const sessionDate = dayjs(session.date, 'YYYY-MM-DD');
          const durationMins = timeToMinutes(session.endTime) - timeToMinutes(session.startTime);

          if (sessionDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
            minsWeek += durationMins;
          }
          if (sessionDate.isBetween(startOfMonth, endOfMonth, 'day', '[]')) {
            minsMonth += durationMins;
          }
          if (sessionDate.isBetween(startOfQuarter, endOfQuarter, 'day', '[]')) {
            minsQuarter += durationMins;
          }
        }
      });

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        hoursThisWeek: Number((minsWeek / 60).toFixed(1)),
        hoursThisMonth: Number((minsMonth / 60).toFixed(1)),
        hoursThisQuarter: Number((minsQuarter / 60).toFixed(1)),
      };
    });

    setWorkloads(result);
  }, []);

  useEffect(() => {
    fetchWorkloads();
  }, [fetchWorkloads]);

  return { workloads, refresh: fetchWorkloads };
};
