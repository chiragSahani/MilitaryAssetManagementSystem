import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Filter, Download, Eye, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Purchase {
  id: number;
  asset_name: string;
  asset_category: string;
  base_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string;
  purchase_date: string;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  created_by_name: string;
  approved_by_name?: string;
}

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [bases, setBases] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    assetType: ''
  });
  const { user } = useAuth();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.assetType) params.append('assetType', filters.assetType);

      const response = await axios.get(`/api/purchases?${params.toString()}`);
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [assetTypesResponse, basesResponse] = await Promise.all([
        axios.get('/api/assets/types'),
        axios.get('/api/assets/bases')
      ]);
      setAssetTypes(assetTypesResponse.data);
      setBases(basesResponse.data);
    } catch (error) {
      console.error('Failed to fetch form data:', error);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [filters]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const handleStatusUpdate = async (purchaseId: number, status: string, receivedDate?: string) => {
    try {
      await axios.patch(`/api/purchases/${purchaseId}/status`, {
        status,
        received_date: receivedDate
      });
      fetchPurchases();
    } catch (error) {
      console.error('Failed to update purchase status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: Check },
      received: { color: 'bg-green-100 text-green-800', icon: Check },
      cancelled: { color: 'bg-red-100 text-red-800', icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canApprove = (purchase: Purchase) => {
    return user?.role === 'admin' || user?.role === 'base_commander';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600">Manage asset purchases and procurement</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewPurchaseModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Purchase
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filters.assetType}
            onChange={(e) => setFilters(prev => ({ ...prev, assetType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="Weapons">Weapons</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Ammunition">Ammunition</option>
            <option value="Equipment">Equipment</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No purchases found
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{purchase.asset_name}</div>
                        <div className="text-sm text-gray-500">{purchase.asset_category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {purchase.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">${purchase.total_cost.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">${purchase.unit_cost}/unit</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{purchase.supplier}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        {purchase.status === 'pending' && canApprove(purchase) && (
                          <button
                            onClick={() => handleStatusUpdate(purchase.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {purchase.status === 'approved' && canApprove(purchase) && (
                          <button
                            onClick={() => handleStatusUpdate(purchase.id, 'received', new Date().toISOString().split('T')[0])}
                            className="text-blue-600 hover:text-blue-700"
                            title="Mark as Received"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;