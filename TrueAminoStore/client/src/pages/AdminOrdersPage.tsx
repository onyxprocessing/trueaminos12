import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';

interface Order {
  id: number;
  orderId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  productName: string;
  productId: number;
  quantity: number;
  selectedWeight?: string;
  salesPrice: number;
  shipping: string;
  paymentIntentId: string;
  paymentDetails: string;
  createdAt: string;
}

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate offset based on current page
      const offset = (page - 1) * limit;
      
      // Fetch orders with search if applicable
      const url = searchTerm 
        ? `/api/orders?search=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
        : `/api/orders?limit=${limit}&offset=${offset}`;
      
      const response = await axios.get(url);
      setOrders(response.data);
      
      // Get total count for pagination
      const countResponse = await axios.get('/api/orders/count');
      setTotalOrders(countResponse.data.count);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchOrders();
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    
    try {
      const response = await axios.post('/api/admin/sync-stripe-orders');
      console.log('Sync response:', response.data);
      
      setSyncResult({
        success: response.data.success,
        message: response.data.message
      });
      
      // Refresh orders after sync
      fetchOrders();
    } catch (error) {
      console.error('Error syncing orders:', error);
      setSyncResult({
        success: false,
        message: 'Failed to sync orders from Stripe. Please try again.'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPaymentDetails = (detailsStr: string) => {
    try {
      const details = JSON.parse(detailsStr);
      return `$${parseFloat(details.amount).toFixed(2)} ${details.currency}`;
    } catch (err) {
      return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className={`flex items-center gap-1 px-4 py-2 rounded ${
              syncLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {syncLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Orders from Stripe
              </>
            )}
          </button>
          <Link to="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Back to Store
          </Link>
        </div>
      </div>

      {/* Sync Result Notification */}
      {syncResult && (
        <div className={`mb-4 p-4 rounded ${
          syncResult.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex">
            <div className="py-1">
              {syncResult.success ? (
                <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-bold">{syncResult.success ? 'Sync Successful' : 'Sync Failed'}</p>
              <p className="text-sm">{syncResult.message}</p>
            </div>
            <button 
              onClick={() => setSyncResult(null)} 
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search orders..."
            className="flex-grow p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-1">
          Search by name, email, order ID, address, or product
        </p>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading orders...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-4">No orders found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Order ID</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Customer</th>
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-left">Qty</th>
                <th className="py-2 px-4 text-left">Weight</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">Shipping</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{order.orderId}</td>
                  <td className="py-2 px-4">{formatDate(order.createdAt)}</td>
                  <td className="py-2 px-4">
                    {order.firstName} {order.lastName}
                    {order.email && (
                      <div className="text-sm text-gray-600">{order.email}</div>
                    )}
                  </td>
                  <td className="py-2 px-4">{order.productName}</td>
                  <td className="py-2 px-4">{order.quantity}</td>
                  <td className="py-2 px-4">{order.selectedWeight || 'N/A'}</td>
                  <td className="py-2 px-4">${typeof order.salesPrice === 'number' ? order.salesPrice.toFixed(2) : order.salesPrice}</td>
                  <td className="py-2 px-4 capitalize">{order.shipping}</td>
                  <td className="py-2 px-4">
                    <Link 
                      to={`/admin/orders/${order.id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex items-center px-2">
              Page {page} of {totalPages}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;