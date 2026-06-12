import React, { useState, useMemo } from 'react';
import { Table, Button, Input, Select, Space, Modal, Form, Tag, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useStudents } from '../hooks/useStudents';
import type { Student, ProfileStatus } from '../types';
import dayjs from 'dayjs';
import { matchVietnameseSearch } from '../utils/stringUtils';

const { Option } = Select;

export const Students: React.FC = () => {
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | 'ALL'>('ALL');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = matchVietnameseSearch(s.name, searchText) || 
                          matchVietnameseSearch(s.email, searchText) ||
                          s.phone.includes(searchText);
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, searchText, statusFilter]);

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Ngày sinh', dataIndex: 'dateOfBirth', key: 'dateOfBirth' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: ProfileStatus) => {
        const color = status === 'ACTIVE' ? 'green' : status === 'SUSPENDED' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Student) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => deleteStudent(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: Student) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth, 'YYYY-MM-DD') : null,
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : '',
      };
      if (editingId) {
        updateStudent(editingId, payload);
      } else {
        addStudent(payload);
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input 
            placeholder="Tìm kiếm tên, email, sđt..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
            <Option value="ALL">Tất cả trạng thái</Option>
            <Option value="ACTIVE">Đang hoạt động</Option>
            <Option value="SUSPENDED">Tạm ngừng</Option>
            <Option value="INACTIVE">Ngừng hoạt động</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm học viên
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredStudents} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} />

      <Modal centered title={editingId ? "Sửa thông tin học viên" : "Thêm học viên mới"} open={isModalVisible} onOk={handleModalOk} onCancel={() => setIsModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Ngày sinh" rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="SUSPENDED">Tạm ngừng hoạt động</Option>
              <Option value="INACTIVE">Ngừng hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
