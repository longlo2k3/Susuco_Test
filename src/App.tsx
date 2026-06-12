import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Teachers } from './pages/Teachers';
import { Students } from './pages/Students';
import { Classrooms } from './pages/Classrooms';
import { Courses } from './pages/Courses';
import { Enrollments } from './pages/Enrollments';
import { Dashboard } from './pages/Dashboard';
import { syncCourseStatuses } from './utils/courseLogic';

const App: React.FC = () => {

  useEffect(() => {
    // Run status evaluation once on app mount
    syncCourseStatuses();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="courses" element={<Courses />} />
        <Route path="enrollments" element={<Enrollments />} />
      </Route>
    </Routes>
  );
};

export default App;
