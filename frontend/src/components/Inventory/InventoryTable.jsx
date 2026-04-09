import React, { useState, useMemo } from 'react';
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';
import { FiSearch, FiAlertCircle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const InventoryTable = ({ items, loading, onDelete, onEdit }) => {
  const [filterInput, setFilterInput] = useState('');

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row, value }) => (
          <div>
            <span className="font-medium">{value}</span>
            {row.original.nameAm && (
              <p className="text-xs text-gray-500 font-amharic">{row.original.nameAm}</p>
            )}
          </div>
        )
      },
      {
        Header: 'SKU',
        accessor: 'sku',
        Cell: ({ value }) => <span className="font-mono text-sm">{value}</span>
      },
      {
        Header: 'Category',
        accessor: 'category',
        Cell: ({ value }) => (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {value}
          </span>
        )
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: ({ row, value }) => {
          const isLowStock = value <= row.original.minimumQuantity;
          return (
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                {value}
              </span>
              <span className="text-sm text-gray-500">{row.original.unit}</span>
              {isLowStock && (
                <FiAlertCircle className="text-red-500" title="Low Stock" />
              )}
            </div>
          );
        }
      },
      {
        Header: 'Min Qty',
        accessor: 'minimumQuantity',
        Cell: ({ value, row }) => (
          <span className="text-gray-600">{value} {row.original.unit}</span>
        )
      },
      {
        Header: 'Location',
        accessor: 'location',
        Cell: ({ value }) => <span className="text-gray-600">{value || 'N/A'}</span>
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(row.original)}
              className="p-1 text-gray-600 hover:text-blue-600"
              title="Edit"
            >
              <FiEdit size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${row.original.name}?`)) {
                  onDelete(row.original._id);
                }
              }}
              className="p-1 text-gray-600 hover:text-red-600"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )
      }
    ],
    [onDelete, onEdit]
  );

  const filteredData = useMemo(() => {
    if (!filterInput) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(filterInput.toLowerCase()) ||
      item.sku.toLowerCase().includes(filterInput.toLowerCase()) ||
      item.category.toLowerCase().includes(filterInput.toLowerCase())
    );
  }, [items, filterInput]);

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
      data: filteredData,
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
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or category..."
                value={filterInput}
                onChange={e => setFilterInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <Link
            to="/inventory/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add Item
          </Link>
        </div>
      </div>

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
                {Math.min((pageIndex + 1) * pageSize, filteredData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredData.length}</span> results
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
    </div>
  );
};

export default InventoryTable;
