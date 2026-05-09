import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  activeStock: string;
  onSelectStock: (ticker: string) => void;
  onRefresh: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ activeStock, onSelectStock, onRefresh }) => {
  return (
    <div className="ns-app">
      <Sidebar activeStock={activeStock} onSelectStock={onSelectStock} />
      <main className="ns-main">
        <TopBar onSelectStock={onSelectStock} onRefresh={onRefresh} />
        <div className="ns-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
