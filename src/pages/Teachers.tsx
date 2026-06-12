import React, { useState, useMemo } from 'react';
import { Table, Button, Input, Select, Space, Modal, Form, Tag, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTeachers } from '../hooks/useTeachers';
import type { Teacher, ProfileStatus } from '../types';
import { matchVietnameseSearch } from '../utils/stringUtils';

const { Option } = Select;

export const Teachers: React.FC = () => {
  const { teachers, loading, addTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | 'ALL'>('ALL');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = matchVietnameseSearch(t.name, searchText) || 
                          matchVietnameseSearch(t.email, searchText) ||
                          t.phone.includes(searchText);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [teachers, searchText, statusFilter]);

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Chuyên môn', dataIndex: 'specialty', key: 'specialty' },
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
      render: (_: any, record: Teacher) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => deleteTeacher(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: Teacher) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingId) {
        updateTeacher(editingId, values);
      } else {
        addTeacher(values);
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
            <Option value="SUSPENDED">Tạm ngừng hoạt động</Option>
            <Option value="INACTIVE">Ngừng hoạt động</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm giảng viên
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredTeachers} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal centered
        title={editingId ? "Sửa thông tin giảng viên" : "Thêm giảng viên mới"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
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
          <Form.Item name="specialty" label="Chuyên môn" rules={[{ required: true, message: 'Vui lòng nhập chuyên môn' }]}>
            <Input />
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
