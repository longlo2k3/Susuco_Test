import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, Select, Tag } from 'antd';
import { PlusOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useCourses } from '../hooks/useCourses';
import { useTeachers } from '../hooks/useTeachers';
import { useClassrooms } from '../hooks/useClassrooms';
import { dbService } from '../services/db.service';
import { exportToCSV } from '../utils/exportCSV';
import type { Course, CourseStatus } from '../types';
import { matchVietnameseSearch } from '../utils/stringUtils';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const Courses: React.FC = () => {
  const { courses, addCourse, updateCourseStatus } = useCourses();
  const { teachers } = useTeachers();
  const { classrooms } = useClassrooms();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredCourses = React.useMemo(() => {
    return courses.filter(c => matchVietnameseSearch(c.name, searchText));
  }, [courses, searchText]);

  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const payload = {
        name: values.name,
        teacherId: values.teacherId,
        classroomId: values.classroomId,
        minStudents: values.minStudents,
        maxStudents: values.maxStudents,
        startDate: values.dates[0].format('YYYY-MM-DD'),
        endDate: values.dates[1].format('YYYY-MM-DD'),
      };
      
      // Auto generate sessions
      const sessions = [];
      const sessionCount = values.sessionCount || 10;
      let curDate = values.dates[0];
      for(let i = 0; i < sessionCount; i++) {
        if(curDate.isAfter(values.dates[1])) break;
        sessions.push({
          date: curDate.format('YYYY-MM-DD'),
          startTime: '18:00',
          endTime: '20:00'
        });
        curDate = curDate.add(2, 'day'); // simulate 1 session every 2 days
      }

      if (addCourse(payload, sessions)) {
        setIsModalVisible(false);
      }
    });
  };

  const exportCourseStudents = (courseId: string, courseName: string) => {
    const enrollments = dbService.getTable('enrollments').filter(e => e.courseId === courseId);
    const allStudents = dbService.getTable('students');
    
    const rows = [['Tên học viên', 'Email', 'SĐT', 'Trạng thái đăng ký']];
    enrollments.forEach(e => {
      const student = allStudents.find(s => s.id === e.studentId);
      if (student) {
        rows.push([student.name, student.email, student.phone, e.status]);
      }
    });
    exportToCSV(`DanhSachHocVien_${courseName}.csv`, rows);
  };

  const exportTeacherSchedule = (teacherId: string, teacherName: string) => {
    const allSessions = dbService.getTable('sessions');
    const allCourses = dbService.getTable('courses').filter(c => c.teacherId === teacherId);
    const courseIds = allCourses.map(c => c.id);
    const allClassrooms = dbService.getTable('classrooms');

    const rows = [['Ngày', 'Khóa học', 'Phòng học', 'Bắt đầu', 'Kết thúc', 'Trạng thái']];
    allSessions.filter(s => courseIds.includes(s.courseId)).forEach(s => {
      const c = allCourses.find(c => c.id === s.courseId);
      const room = allClassrooms.find(r => r.id === c?.classroomId);
      rows.push([s.date, c?.name || '', room?.name || '', s.startTime, s.endTime, s.status]);
    });
    exportToCSV(`LichDay_${teacherName}.csv`, rows);
  };

  const columns = [
    { title: 'Tên khóa học', dataIndex: 'name', key: 'name' },
    { title: 'Khai giảng', dataIndex: 'startDate', key: 'startDate' },
    { 
      title: 'Giảng viên', 
      key: 'teacherId', 
      render: (_: any, record: Course) => {
        const t = teachers.find(t => t.id === record.teacherId);
        return <span>{t?.name} <Button size="small" type="link" icon={<DownloadOutlined/>} onClick={() => exportTeacherSchedule(t!.id, t!.name)} /></span>
      }
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: CourseStatus) => {
        const colors: Record<CourseStatus, string> = {
          DRAFT: 'default', PENDING: 'warning', ENROLLING: 'processing', IN_PROGRESS: 'success', COMPLETED: 'purple', CANCELLED: 'error'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Course) => (
        <Space size="middle">
          {record.status === 'DRAFT' && <Button type="link" onClick={() => updateCourseStatus(record.id, 'ENROLLING')}>Bắt đầu tuyển sinh</Button>}
          {record.status === 'ENROLLING' && <Button type="link" danger onClick={() => updateCourseStatus(record.id, 'CANCELLED')}>Hủy khóa học</Button>}
          <Button type="link" icon={<DownloadOutlined/>} onClick={() => exportCourseStudents(record.id, record.name)}>Xuất HV</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input 
            placeholder="Tìm kiếm khóa học..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm khóa học</Button>
      </div>
      <Table columns={columns} dataSource={filteredCourses} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} />

      <Modal centered title="Thêm khóa học mới" open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên khóa học" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="teacherId" label="Giảng viên" rules={[{ required: true }]}>
            <Select>
              {teachers.filter(t => t.status === 'ACTIVE').map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="classroomId" label="Phòng học" rules={[{ required: true }]}>
            <Select>
              {classrooms.filter(c => c.status === 'ACTIVE').map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Space>
            <Form.Item name="minStudents" label="Tối thiểu" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
            <Form.Item name="maxStudents" label="Tối đa" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
            <Form.Item name="sessionCount" label="Số buổi học" initialValue={10} rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
          </Space>
          <Form.Item name="dates" label="Thời gian diễn ra" rules={[{ required: true }]}>
            <RangePicker />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
