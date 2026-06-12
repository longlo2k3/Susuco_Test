import { dbService } from '../services/db.service';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

export const checkScheduleConflict = (
  date: string, 
  startTime: string, 
  endTime: string, 
  checkType: 'teacher' | 'classroom', 
  id: string
): boolean => {
  const allSessions = dbService.getTable('sessions');
  const allCourses = dbService.getTable('courses');

  return allSessions.some(session => {
    if (session.date !== date || session.status === 'CANCELLED') return false;

    const course = allCourses.find(c => c.id === session.courseId);
    if (!course || course.status === 'CANCELLED') return false;

    const isTargetMatch = checkType === 'teacher' ? course.teacherId === id : course.classroomId === id;
    
    if (isTargetMatch) {
      return isTimeOverlap(startTime, endTime, session.startTime, session.endTime);
    }
    return false;
  });
};
