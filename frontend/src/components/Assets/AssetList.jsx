
import React, { useState, useMemo } from 'react';
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';
import { FiSearch, FiFilter, FiDownload, FiCamera, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import QRCodeModal from './QRCodeDisplay';

const AssetList = ({ assets, loading, onCheckout, onReturn }) => {
  const [filterInput, setFilterInput] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const columns = useMemo(
    () => [
      {
        Header: 'Asset Tag',
        accessor: 'assetTag',
        Cell: ({ value }) => <span className="font-mono text-sm">{value}</span>
      },
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value }) => <span className="font-medium">{value}</span>
      },
      {
        Header: 'Category',
        accessor: 'category.name',
        Cell: ({ value }) => <span className="text-gray-600">{value || 'N/A'}</span>
      },
      {
        Header: 'Location',
        accessor: 'location',
        Cell: ({ value }) => <span className="text-gray-600">{value || 'N/A'}</span>
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          const statusColors = {
            available: 'bg-green-100 text-green-800',
            'checked-out': 'bg-yellow-100 text-yellow-800',
            maintenance: 'bg-red-100 text-red-800',
            retired: 'bg-gray-100 text-gray-800'
          };
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
              {value}
            </span>
          );
        }
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedAsset(row.original);
                setShowQRModal(true);
              }}
              className="p-1 text-gray-600 hover:text-primary-600"
              title="View QR Code"
            >
              <FiCamera size={18} />
            </button>
            <Link
              to={`/assets/${row.original._id}`}
              className="p-1 text-gray-600 hover:text-blue-600"
              title="View Details"
            >
              <FiEye size={18} />
            </Link>
            {row.original.status === 'available' ? (
              <button
                onClick={() => onCheckout(row.original)}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Checkout
              </button>
            ) : row.original.status === 'checked-out' && (
              <button
                onClick={() => onReturn(row.original)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Return
              </button>
            )}
          </div>
        )
      }
    ],
    [onCheckout, onReturn]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data: assets,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    useFilters,
    useSortBy,
    usePagination
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, tag, or serial..."
                value={filterInput}
                onChange={e => setFilterInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiFilter className="mr-2" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min((pageIndex + 1) * pageSize, assets.length)}
              </span>{' '}
              of <span className="font-medium">{assets.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {[5, 10, 20, 30, 50].map(size => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                «
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                ‹
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {pageIndex + 1} of {pageOptions.length}
              </span>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                ›
              </button>
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                »
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedAsset && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
        />
      )}
    </div>
  );
};

export default AssetList;
