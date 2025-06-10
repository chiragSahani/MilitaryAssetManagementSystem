import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  ArrowRightLeft, 
  Users, 
  Target,
  Settings,
  Shield,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'base_commander', 'logistics_officer'] },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart, roles: ['admin', 'base_commander', 'logistics_officer'] },
    { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft, roles: ['admin', 'base_commander', 'logistics_officer'] },
    { name: 'Assignments', href: '/assignments', icon: Users, roles: ['admin', 'base_commander'] },
    { name: 'Expenditures', href: '/expenditures', icon: Target, roles: ['admin', 'base_commander'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'base_commander'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-slate-700">
        <Shield className="h-8 w-8 text-blue-400" />
        <div className="ml-3">
          <h1 className="text-lg font-bold">MilAsset</h1>
          <p className="text-xs text-slate-400">Asset Management</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            <p className="text-xs text-slate-500">{user?.baseCode}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Base Info */}
      <div className="px-6 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          <p>Current Base:</p>
          <p className="text-white font-medium">{user?.baseName}</p>
          <p className="text-slate-500">{user?.baseCode}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar