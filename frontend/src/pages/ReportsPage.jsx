import React, { useState } from 'react';
import axios from 'axios';
import { FiDownload, FiCalendar, FiFileText, FiFile, FiPrinter } from 'react-icons/fi';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('assets');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [department, setDepartment] = useState('');

  const reportTypes = [
    { id: 'assets', name: 'Asset Report', icon: FiFile, description: 'Complete inventory of all assets with status and value' },
    { id: 'requests', name: 'Service Request Report', icon: FiFile, description: 'Summary of all service requests and their status' },
    { id: 'inventory', name: 'Inventory Report', icon: FiFile, description: 'Stock levels, low stock items, and inventory value' },
    { id: 'dashboard', name: 'Dashboard Summary', icon: FiFileText, description: 'Comprehensive dashboard statistics' }
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.REACT_APP_API_URL}/reports/${reportType}?format=${format}`;
      
      if (reportType === 'requests' || reportType === 'assets') {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      
      if (department) {
        url += `&department=${department}`;
      }
      
      const response = await axios.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url_ = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and download system reports</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Types */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Report Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-4 border rounded-lg text-left transition ${
                      reportType === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <type.icon className={`mt-1 ${reportType === type.id ? 'text-primary-600' : 'text-gray-400'}`} size={20} />
                      <div>
                        <h3 className={`font-medium ${reportType === type.id ? 'text-primary-700' : 'text-gray-900'}`}>
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Report Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Options</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setFormat('pdf')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-sm font-medium transition ${
                        format === 'pdf'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiFile className="inline mr-1" size={14} />
                      PDF
                    </button>
                    <button
                      onClick={() => setFormat('excel')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-sm font-medium transition ${
                        format === 'excel'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiFileText className="inline mr-1" size={14} />
                      Excel
                    </button>
                  </div>
                </div>
                
                {(reportType === 'requests' || reportType === 'assets') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Start Date</label>
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">End Date</label>
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="All departments"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
                
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full mt-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="spinner-border h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiDownload className="mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Report History Placeholder */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiFile className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Asset Report</p>
                    <p className="text-xs text-gray-500">Generated on Jan 15, 2024</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm">Download</button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiFileText className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Service Request Summary</p>
                    <p className="text-xs text-gray-500">Generated on Jan 10, 2024</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm">Download</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;