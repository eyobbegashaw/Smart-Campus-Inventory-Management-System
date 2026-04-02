import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiPackage, 
  FiClipboard, 
  FiBookOpen, 
  FiPieChart, 
  FiUsers,
  FiShoppingCart,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, isAdmin, isHod, isStaff, isStudent } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const commonItems = [
      { path: '/', name: 'Dashboard', icon: FiHome },
    ];

    const roleBasedItems = {
      admin: [
        { path: '/assets', name: 'Assets', icon: FiPackage },
        { path: '/inventory', name: 'Inventory', icon: FiShoppingCart },
        { path: '/requests', name: 'Service Requests', icon: FiClipboard },
        { path: '/library', name: 'Library', icon: FiBookOpen },
        { path: '/reports', name: 'Reports', icon: FiPieChart },
        { path: '/admin', name: 'User Management', icon: FiUsers },
        { path: '/settings', name: 'Settings', icon: FiSettings },
      ],
      hod: [
        { path: '/assets', name: 'Department Assets', icon: FiPackage },
        { path: '/inventory', name: 'Inventory', icon: FiShoppingCart },
        { path: '/requests', name: 'Service Requests', icon: FiClipboard },
        { path: '/reports', name: 'Reports', icon: FiPieChart },
      ],
      staff: [
        { path: '/assets', name: 'Assets', icon: FiPackage },
        { path: '/requests', name: 'My Tasks', icon: FiClipboard },
        { path: '/library', name: 'Library', icon: FiBookOpen },
      ],
      student: [
        { path: '/requests', name: 'Submit Request', icon: FiClipboard },
        { path: '/library', name: 'Library', icon: FiBookOpen },
      ],
    };

    let items = [...commonItems];
    
    if (isAdmin) items = [...items, ...roleBasedItems.admin];
    else if (isHod) items = [...items, ...roleBasedItems.hod];
    else if (isStaff) items = [...items, ...roleBasedItems.staff];
    else if (isStudent) items = [...items, ...roleBasedItems.student];

    return items;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-white shadow-lg z-30 flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CI</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Campus Inventory
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {getMenuItems().map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
