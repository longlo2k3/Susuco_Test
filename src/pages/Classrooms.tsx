import React, { useState, useMemo } from 'react';
import { Table, Button, Input, Select, Space, Modal, Form, Tag, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useClassrooms } from '../hooks/useClassrooms';
import type { Classroom, ProfileStatus } from '../types';
import { matchVietnameseSearch } from '../utils/stringUtils';

const { Option } = Select;

export const Classrooms: React.FC = () => {
  const { classrooms, loading, addClassroom, updateClassroom, deleteClassroom } = useClassrooms();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | 'ALL'>('ALL');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchSearch = matchVietnameseSearch(c.name, searchText) || 
                          matchVietnameseSearch(c.location, searchText);
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [classrooms, searchText, statusFilter]);

  const columns = [
    { title: 'Tên phòng', dataIndex: 'name', key: 'name' },
    { title: 'Sức chứa', dataIndex: 'capacity', key: 'capacity', render: (val: number) => `${val} người` },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
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
      render: (_: any, record: Classroom) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => deleteClassroom(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: Classroom) => {
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
        updateClassroom(editingId, values);
      } else {
        addClassroom(values);
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input 
            placeholder="Tìm kiếm tên, vị trí..." 
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
          Thêm phòng học
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredClassrooms} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} />

      <Modal centered title={editingId ? "Sửa phòng học" : "Thêm phòng học mới"} open={isModalVisible} onOk={handleModalOk} onCancel={() => setIsModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên phòng" rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Vị trí/Tòa nhà" rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
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
