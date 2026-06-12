import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Select, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useEnrollments } from '../hooks/useEnrollments';
import { useCourses } from '../hooks/useCourses';
import { useStudents } from '../hooks/useStudents';
import type { Enrollment, EnrollmentStatus } from '../types';
import { matchVietnameseSearch } from '../utils/stringUtils';
import { Input } from 'antd';

const { Option } = Select;

export const Enrollments: React.FC = () => {
  const { enrollments, enrollStudent, updateEnrollmentStatus } = useEnrollments();
  const { courses } = useCourses();
  const { students } = useStudents();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter(e => {
      const student = students.find(s => s.id === e.studentId);
      const course = courses.find(c => c.id === e.courseId);
      const studentName = student ? student.name : '';
      const courseName = course ? course.name : '';
      return matchVietnameseSearch(studentName, searchText) || matchVietnameseSearch(courseName, searchText);
    });
  }, [enrollments, students, courses, searchText]);

  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (enrollStudent(values.courseId, values.studentId)) {
        setIsModalVisible(false);
      }
    });
  };

  const columns = [
    { 
      title: 'Học viên', 
      key: 'studentId', 
      render: (_: any, record: Enrollment) => students.find(s => s.id === record.studentId)?.name
    },
    { 
      title: 'Khóa học', 
      key: 'courseId', 
      render: (_: any, record: Enrollment) => courses.find(c => c.id === record.courseId)?.name
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: EnrollmentStatus) => {
        const colors: Record<EnrollmentStatus, string> = {
          PENDING: 'gold', APPROVED: 'green', REJECTED: 'red', CANCELLED: 'default'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Enrollment) => (
        <Space size="middle">
          {record.status === 'PENDING' && (
            <>
              <Button type="link" onClick={() => updateEnrollmentStatus(record.id, 'APPROVED')}>Duyệt</Button>
              <Button type="link" danger onClick={() => updateEnrollmentStatus(record.id, 'REJECTED')}>Từ chối</Button>
            </>
          )}
          {(record.status === 'APPROVED' || record.status === 'PENDING') && (
            <Button type="link" onClick={() => updateEnrollmentStatus(record.id, 'CANCELLED')}>Hủy</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input 
            placeholder="Tìm kiếm học viên, khóa học..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Đăng ký mới</Button>
      </div>
      <Table columns={columns} dataSource={filteredEnrollments} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} />

      <Modal centered title="Đăng ký học viên" open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="courseId" label="Khóa học" rules={[{ required: true }]}>
            <Select>
              {courses.filter(c => c.status === 'ENROLLING').map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="studentId" label="Học viên" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {students.filter(s => s.status === 'ACTIVE').map(s => <Option key={s.id} value={s.id}>{s.name} ({s.email})</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
