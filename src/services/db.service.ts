import type { Teacher, Student, Classroom, Course, CourseSession, Enrollment } from '../types';

interface Database {
  teachers: Teacher[];
  students: Student[];
  classrooms: Classroom[];
  courses: Course[];
  sessions: CourseSession[];
  enrollments: Enrollment[];
}

const DB_KEY = 'sasuco_db';

const defaultDB: Database = {
  teachers: [],
  students: [],
  classrooms: [],
  courses: [],
  sessions: [],
  enrollments: []
};

export const dbService = {
  getDB: (): Database => {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
      return defaultDB;
    }
    const parsed = JSON.parse(data);
    return { ...defaultDB, ...parsed };
  },
  saveDB: (db: Database) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },
  
  getTable: <K extends keyof Database>(table: K): Database[K] => {
    return dbService.getDB()[table];
  },
  
  saveTable: <K extends keyof Database>(table: K, data: Database[K]) => {
    const db = dbService.getDB();
    db[table] = data as any;
    dbService.saveDB(db);
  }
};
