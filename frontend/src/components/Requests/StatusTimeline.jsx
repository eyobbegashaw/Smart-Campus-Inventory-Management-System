import React from 'react';
import { FiCheckCircle, FiClock, FiCircle, FiAlertCircle } from 'react-icons/fi';

const StatusTimeline = ({ request }) => {
  const statuses = [
    { key: 'submitted', label: 'Submitted', icon: FiCircle },
    { key: 'reviewing', label: 'Under Review', icon: FiClock },
    { key: 'approved', label: 'Approved', icon: FiCircle },
    { key: 'in-progress', label: 'In Progress', icon: FiClock },
    { key: 'completed', label: 'Completed', icon: FiCheckCircle }
  ];

  const currentIndex = statuses.findIndex(s => s.key === request.status);
  const isRejected = request.status === 'rejected';
  const isCancelled = request.status === 'cancelled';

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="text-red-500" size={24} />
          <div>
            <p className="font-medium text-red-800">Request Rejected</p>
            <p className="text-sm text-red-600 mt-1">
              {request.comments?.find(c => c.text.includes('rejected'))?.text || 'No reason provided'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiCircle className="text-gray-500" size={24} />
          <div>
            <p className="font-medium text-gray-800">Request Cancelled</p>
            <p className="text-sm text-gray-600 mt-1">
              This request has been cancelled
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      <div className="space-y-6">
        {statuses.map((status, index) => {
          const Icon = status.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={status.key} className="relative flex items-start">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                isCompleted ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon className={`${isCompleted ? 'text-green-600' : 'text-gray-400'}`} size={20} />
              </div>
              <div className="ml-4 flex-1">
                <div className={`font-medium ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                  {status.label}
                </div>
                {isCurrent && request.status === status.key && (
                  <p className="text-sm text-gray-500 mt-1">
                    {status.key === 'submitted' && 'Your request has been submitted and is waiting for review'}
                    {status.key === 'reviewing' && 'Your request is being reviewed by the department head'}
                    {status.key === 'approved' && 'Your request has been approved and assigned to staff'}
                    {status.key === 'in-progress' && 'Work has started on your request'}
                    {status.key === 'completed' && 'Your request has been completed'}
                  </p>
                )}
                {isCurrent && request.assignedTo && (
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned to: {request.assignedTo.name}
                  </p>
                )}
                {request.completedAt && status.key === 'completed' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Completed on: {new Date(request.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;