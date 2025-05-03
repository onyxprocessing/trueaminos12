import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  const renderPaymentDetails = () => {
    if (!order?.paymentDetails) return 'No payment details available';

    try {
      const details = JSON.parse(order.paymentDetails);
      return (
        <div className="space-y-2">
          <div><span className="font-semibold">Payment ID:</span> {details.id}</div>
          <div><span className="font-semibold">Amount:</span> ${parseFloat(details.amount).toFixed(2)} {details.currency}</div>
          <div><span className="font-semibold">Status:</span> {details.status}</div>
          <div><span className="font-semibold">Date:</span> {formatDate(details.created)}</div>
        </div>
      );
    } catch (err) {
      return (
        <div className="text-red-500">
          Error parsing payment details: {order.paymentDetails}
        </div>
      );
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/admin/orders" className="text-blue-500 hover:underline">
            &larr; Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Order not found
        </div>
        <div className="mt-4">
          <Link to="/admin/orders" className="text-blue-500 hover:underline">
            &larr; Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Link to="/admin/orders" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Back to Orders
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">Order #{order.orderId}</h2>
              <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
              {order.shipping} Shipping
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Contact Details</h4>
              <p>{order.firstName} {order.lastName}</p>
              {order.email && <p>{order.email}</p>}
              {order.phone && <p>{order.phone}</p>}
            </div>
            <div>
              <h4 className="font-medium">Shipping Address</h4>
              <p>{order.address}</p>
              <p>{order.city}, {order.state} {order.zip}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left">Product</th>
                  <th className="py-2 px-4 text-left">Quantity</th>
                  <th className="py-2 px-4 text-left">Weight</th>
                  <th className="py-2 px-4 text-left">Price</th>
                  <th className="py-2 px-4 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">{order.productName}</td>
                  <td className="py-2 px-4">{order.quantity}</td>
                  <td className="py-2 px-4">{order.selectedWeight || 'N/A'}</td>
                  <td className="py-2 px-4">${order.salesPrice.toFixed(2)}</td>
                  <td className="py-2 px-4">${(order.salesPrice * order.quantity).toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right font-medium">Total</td>
                  <td className="py-2 px-4 font-bold">${(order.salesPrice * order.quantity).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="bg-gray-50 p-4 rounded">
            {renderPaymentDetails()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;