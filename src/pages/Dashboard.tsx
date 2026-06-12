import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, List, Badge } from 'antd';
import { useCourses } from '../hooks/useCourses';
import { useTeachers } from '../hooks/useTeachers';
import { useEnrollments } from '../hooks/useEnrollments';
import dayjs from 'dayjs';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  const { courses, sessions } = useCourses();
  const { teachers } = useTeachers();
  const { enrollments } = useEnrollments();

  const stats = useMemo(() => {
    return {
      enrolling: courses.filter(c => c.status === 'ENROLLING').length,
      inProgress: courses.filter(c => c.status === 'IN_PROGRESS').length,
      completed: courses.filter(c => c.status === 'COMPLETED').length,
    }
  }, [courses]);

  const upcomingCourses = useMemo(() => {
    const today = dayjs().startOf('day');
    return courses.filter(c => {
      if (c.status !== 'ENROLLING') return false;
      const start = dayjs(c.startDate);
      return start.diff(today, 'day') <= 7 && start.diff(today, 'day') >= 0;
    }).map(c => {
      const approvedCount = enrollments.filter(e => e.courseId === c.id && e.status === 'APPROVED').length;
      return {
        ...c,
        approvedCount,
        ratio: `${approvedCount}/${c.maxStudents}`,
        atRisk: approvedCount < c.minStudents && dayjs(c.startDate).diff(today, 'day') <= 3
      }
    });
  }, [courses, enrollments]);

  const teacherStats = useMemo(() => {
    const thisMonth = dayjs().month();
    const thisYear = dayjs().year();
    const sessionCounts: Record<string, number> = {};
    
    sessions.forEach(s => {
      const sDate = dayjs(s.date);
      if (sDate.month() === thisMonth && sDate.year() === thisYear && s.status !== 'CANCELLED') {
        const course = courses.find(c => c.id === s.courseId);
        if (course && course.teacherId) {
          sessionCounts[course.teacherId] = (sessionCounts[course.teacherId] || 0) + 1;
        }
      }
    });

    return teachers.map(t => ({
      id: t.id,
      name: t.name,
      sessionCount: sessionCounts[t.id] || 0
    })).sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 5);
  }, [sessions, teachers, courses]);

  return (
    <div>
      <Title level={3}>Tổng quan hệ thống</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card><Statistic title="Khóa đang mở (Tuyển sinh)" value={stats.enrolling} styles={{ content: { color: '#cf1322' } }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Khóa đang diễn ra" value={stats.inProgress} styles={{ content: { color: '#108ee9' } }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Khóa đã kết thúc" value={stats.completed} styles={{ content: { color: '#3f8600' } }} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="Khóa sắp khai giảng (7 ngày tới)">
            <List
              dataSource={upcomingCourses}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`Khai giảng: ${item.startDate} | Đăng ký: ${item.ratio} | Tối thiểu: ${item.minStudents}`}
                  />
                  {item.atRisk && <Badge count="Nguy cơ hủy" style={{ backgroundColor: '#f5222d' }} />}
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Giảng viên dạy nhiều nhất tháng này">
             <Table 
                dataSource={teacherStats} 
                columns={[
                  {title: 'Tên giảng viên', dataIndex: 'name'},
                  {title: 'Số buổi dạy', dataIndex: 'sessionCount'}
                ]}
                rowKey="id"
                pagination={false}
             />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
