import { dbService } from '../services/db.service';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);

export const syncCourseStatuses = () => {
  const db = dbService.getDB();
  let changed = false;
  const today = dayjs().startOf('day');

  db.courses.forEach(course => {
    if (course.status === 'ENROLLING') {
      const courseDate = dayjs(course.startDate, 'YYYY-MM-DD');
      if (today.isSameOrAfter(courseDate)) {
        const approvedCount = db.enrollments.filter(e => e.courseId === course.id && e.status === 'APPROVED').length;
        if (approvedCount < course.minStudents) {
          course.status = 'PENDING';
        } else {
          course.status = 'IN_PROGRESS';
        }
        changed = true;
      }
    } else if (course.status === 'IN_PROGRESS') {
      const endDate = dayjs(course.endDate, 'YYYY-MM-DD');
      if (today.isAfter(endDate)) {
        course.status = 'COMPLETED';
        changed = true;
      }
    }
  });

  // Cascade cancellations
  db.enrollments.forEach(enrollment => {
    const course = db.courses.find(c => c.id === enrollment.courseId);
    if (course && course.status === 'CANCELLED' && enrollment.status !== 'CANCELLED') {
      enrollment.status = 'CANCELLED';
      changed = true;
    }
  });

  db.sessions.forEach(session => {
    const course = db.courses.find(c => c.id === session.courseId);
    if (course && course.status === 'CANCELLED' && session.status !== 'CANCELLED') {
      session.status = 'CANCELLED';
      changed = true;
    } else if (course && course.status === 'COMPLETED' && session.status === 'PENDING') {
      session.status = 'COMPLETED';
      changed = true;
    } else if (course && course.status === 'IN_PROGRESS' && session.status === 'PENDING') {
       const sessionDate = dayjs(session.date, 'YYYY-MM-DD');
       if (today.isAfter(sessionDate)) {
           session.status = 'COMPLETED';
           changed = true;
       }
    }
  });

  if (changed) {
    dbService.saveDB(db);
  }
};
