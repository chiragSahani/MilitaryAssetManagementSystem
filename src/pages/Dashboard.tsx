import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  UserCheck,
  AlertTriangle,
  Filter
} from 'lucide-react';
import MetricsCard from '../components/Dashboard/MetricsCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import NetMovementModal from '../components/Dashboard/NetMovementModal';
import { useAuth } from '../contexts/AuthContext';

interface DashboardMetrics {
  openingBalance: number;
  purchases: number;
  transfersIn: number;
  transfersOut: number;
  expenditures: number;
  assignments: number;
  netMovement: {
    purchases: number;
    transferIn: number;
    transferOut: number;
    total: number;
  };
  totalCost: {
    purchases: number;
    expenditures: number;
  };
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  base_id: number;
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNetMovementModal, setShowNetMovementModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    assetType: '',
    baseId: ''
  });
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.assetType) params.append('assetType', filters.assetType);
      if (filters.baseId) params.append('baseId', filters.baseId);

      const [metricsResponse, activitiesResponse] = await Promise.all([
        axios.get(`/api/dashboard/metrics?${params.toString()}`),
        axios.get('/api/dashboard/activities')
      ]);

      setMetrics(metricsResponse.data.metrics);
      setActivities(activitiesResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      assetType: '',
      baseId: ''
    });
  };

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const closingBalance = metrics ? 
    metrics.openingBalance + metrics.netMovement.total - metrics.expenditures - metrics.assignments : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName}! Here's your asset overview.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="End Date"
            />
            <select
              value={filters.assetType}
              onChange={(e) => handleFilterChange('assetType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="Weapons">Weapons</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Ammunition">Ammunition</option>
              <option value="Equipment">Equipment</option>
            </select>
            {(filters.startDate || filters.endDate || filters.assetType) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Opening Balance"
          value={metrics?.openingBalance || 0}
          icon={Package}
          color="blue"
        />
        <MetricsCard
          title="Net Movement"
          value={metrics?.netMovement.total || 0}
          change={`${metrics?.netMovement.purchases || 0} in, ${metrics?.netMovement.transferOut || 0} out`}
          changeType={metrics?.netMovement.total && metrics.netMovement.total > 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          color="green"
          onClick={() => setShowNetMovementModal(true)}
        />
        <MetricsCard
          title="Assigned Assets"
          value={metrics?.assignments || 0}
          icon={UserCheck}
          color="purple"
        />
        <MetricsCard
          title="Closing Balance"
          value={closingBalance}
          change={metrics?.expenditures ? `${metrics.expenditures} expended` : undefined}
          changeType="neutral"
          icon={Target}
          color="orange"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expenditures</h3>
            <Target className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{metrics?.expenditures || 0}</p>
            <p className="text-sm text-gray-500">
              Total Cost: ${(metrics?.totalCost.expenditures || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Purchases</h3>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{metrics?.purchases || 0}</p>
            <p className="text-sm text-gray-500">
              Total Cost: ${(metrics?.totalCost.purchases || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transfers</h3>
            <TrendingDown className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-green-600">
              +{metrics?.transfersIn || 0} In
            </p>
            <p className="text-lg font-bold text-red-600">
              -{metrics?.transfersOut || 0} Out
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} loading={loading} />
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">New Purchase</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
              <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Transfer Assets</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200">
              <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Assign Assets</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-red-500 hover:bg-red-50 transition-colors duration-200">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Record Expenditure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Net Movement Modal */}
      <NetMovementModal
        isOpen={showNetMovementModal}
        onClose={() => setShowNetMovementModal(false)}
        data={metrics?.netMovement || { purchases: 0, transferIn: 0, transferOut: 0, total: 0 }}
      />
    </div>
  );
};

export default Dashboard;