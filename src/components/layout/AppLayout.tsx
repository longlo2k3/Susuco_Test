import React, { useState } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  BookOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'hr-management',
      icon: <FolderOpenOutlined />,
      label: 'Quản lý hồ sơ nhân sự và phòng học',
      children: [
        {
          key: '/teachers',
          icon: <TeamOutlined />,
          label: 'Giảng viên',
        },
        {
          key: '/students',
          icon: <UserOutlined />,
          label: 'Học viên',
        },
        {
          key: '/classrooms',
          icon: <BankOutlined />,
          label: 'Phòng học',
        },
      ]
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: 'Khóa học & Lịch',
    },
    {
      key: '/enrollments',
      icon: <UserOutlined />, // or another icon
      label: 'Đăng ký học viên',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!collapsed && <span style={{ color: 'white', fontWeight: 'bold' }}>SASUCO ADMIN</span>}
        </div>
        <Menu 
          theme="dark" 
          selectedKeys={[location.pathname]} 
          mode="inline" 
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Hệ thống Quản lý Đào tạo SASUCO</Title>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          SASUCO Management ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};
