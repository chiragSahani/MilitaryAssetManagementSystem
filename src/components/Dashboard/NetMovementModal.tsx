import React from 'react';
import { X, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';

interface NetMovementData {
  purchases: number;
  transferIn: number;
  transferOut: number;
  total: number;
}

interface NetMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NetMovementData;
}

const NetMovementModal: React.FC<NetMovementModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const movements = [
    {
      label: 'Purchases',
      value: data.purchases,
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      type: 'positive'
    },
    {
      label: 'Transfer In',
      value: data.transferIn,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      type: 'positive'
    },
    {
      label: 'Transfer Out',
      value: data.transferOut,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      type: 'negative'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Net Movement Breakdown</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {movements.map((movement) => (
            <div key={movement.label} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${movement.bgColor}`}>
                  <movement.icon className={`h-5 w-5 ${movement.color}`} />
                </div>
                <span className="font-medium text-gray-900">{movement.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                {movement.type === 'positive' ? (
                  <span className="text-green-600 text-lg">+</span>
                ) : (
                  <span className="text-red-600 text-lg">-</span>
                )}
                <span className="text-lg font-bold text-gray-900">
                  {movement.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-semibold text-gray-900">Net Total</span>
              <div className="flex items-center space-x-2">
                {data.total >= 0 ? (
                  <>
                    <span className="text-green-600 text-xl">+</span>
                    <span className="text-xl font-bold text-green-600">
                      {data.total.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600 text-xl">-</span>
                    <span className="text-xl font-bold text-red-600">
                      {Math.abs(data.total).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NetMovementModal;