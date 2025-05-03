import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <Link to="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Back to Store
        </Link>
      </div>

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
                  <td className="py-2 px-4">${order.salesPrice.toFixed(2)}</td>
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