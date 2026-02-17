import React, { useEffect, useState } from 'react';
import { useToast } from "@chakra-ui/react";
import { LuPencilLine } from "react-icons/lu";
import { CiTrash } from "react-icons/ci";
import '../styles/orders-table.css';
import { updateOrderStatus, deleteOrder } from '../utils/api';
import { validateOrderPayload } from '../utils/validators';
import DeleteConfirmModalOrders from './DeleteConfirmModalOrders.jsx';
import EditStatusModalOrders from './EditStatusModalOrders.jsx';

export default function OrdersTable({
  orders = [],
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
}) {
  // Toast for notifications
  const toast = useToast();

  // Add order handler
  useEffect(() => {
    async function handleAdd(e) {
      const newOrder = e?.detail;
      if (!newOrder) return;

      // If order_number might be a Promise, resolve it safely
      let resolvedOrderNumber = '';
      try {
        // Promise.resolve will wrap non-promises; awaiting it is safe
        resolvedOrderNumber = await Promise.resolve(newOrder.order_number ?? newOrder.orderId ?? '');
        if (resolvedOrderNumber == null) resolvedOrderNumber = '';
        resolvedOrderNumber = String(resolvedOrderNumber);
      } catch (err) {
        console.warn('Failed to resolve order_number promise', err);
        resolvedOrderNumber = '';
      }

      // validate payload shape and required fields
      const check = validateOrderPayload(newOrder);
      if (!check.ok) {
        console.warn('Ignored invalid orders:add event:', check.reason, newOrder);
        return;
      }

      // normalize minimal fields for UI consistency
      const normalized = {
        id: newOrder.id ?? null,
        // prefer resolvedOrderNumber; fallback to raw fields coerced to string; final fallback ''
        orderId: resolvedOrderNumber || String(newOrder.order_number ?? newOrder.orderId ?? '') || '',
        customer: newOrder.customer_name ?? newOrder.customer ?? '',
        platform: newOrder.platform ?? 'Unknown',
        destination: newOrder.destination ?? '',
        total_amount: newOrder.total_amount ?? 1,
        status: (newOrder.status ?? 'pending').toLowerCase(),
        created_at: newOrder.created_at
          ? new Date(newOrder.created_at).toLocaleString()
          : new Date().toLocaleString(),
        __raw: newOrder,
      };

      // optionally notify parent (do not call parent to re-add to backend)
      if (typeof onAddOrder === 'function') {
        try {
          onAddOrder(normalized);
        } catch (err) {
          // swallow errors from parent callback to avoid breaking table
          console.warn('onAddOrder callback error', err);
        }
      }
    }

    window.addEventListener('orders:add', handleAdd);
    return () => window.removeEventListener('orders:add', handleAdd);
  }, [onAddOrder]);

  // Handler for edit status and delete order
  const [editOrder, setEditOrder] = useState(null);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState(null);

  return (
    <div className="card">
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Customer Name</th>
              <th>Platform</th>
              <th>Destination</th>
              <th>Total Amount</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="orders-table">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="11">No orders found</td>
              </tr>
            ) : (
              orders.map((o, idx) => {
                // key: gunakan orderId jika ada, fallback ke id atau index
                const key = o.orderId ?? o.order_number ?? o.id ?? `order-${idx}`;
                // status class for 3 options
                const statusValue = (o.status || '').toLowerCase();
                let statusClass = '';
                if (statusValue === 'completed' || statusValue === 'complete') {
                  statusClass = 'completed';   // green
                } else if (statusValue === 'shipping' || statusValue === 'shipped') {
                  statusClass = 'shipping';    // gray
                } else if (statusValue === 'pending') {
                  statusClass = 'pending';     // red
                }

                return (
                  <tr key={key}>
                    <td className="mono">{o.orderId ?? o.order_number ?? o.id ?? '-'}</td>
                    <td>{o.product_id != null ? o.product_id : '-'}</td>
                    <td>{o.product_name != null ? o.product_name : '-'}</td>
                    <td>{o.customer || '-'}</td>
                    <td>{o.platform || '-'}</td>
                    <td>{o.destination || '-'}</td>
                    <td className="center">{o.total_amount != null ? o.total_amount : '-'}</td>
                    <td className="center">
                      IDR {o.price_idr != null ? o.price_idr : '-'} K</td>
                    <td className="center">
                      <span className={`status ${statusClass}`}>
                        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                      </span>
                    </td>
                    <td>
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '-'}
                    </td>
                    {/* Actions Column */}
                    <td className="center actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        onClick={() => setEditOrder(o)}
                        title="Edit Status"
                        aria-label="Edit order status"
                      >
                        <LuPencilLine />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => setDeleteOrderTarget(o)}
                        title="Delete Order"
                        aria-label="Delete order status"
                      >
                        <CiTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {editOrder && (
        <EditStatusModalOrders
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSave={async (id, status) => {
            try {
              const updated = await updateOrderStatus(id, status);
              if (typeof onUpdateOrder === "function") {
                onUpdateOrder(id, updated.status);
              }
              toast({
                title: `Order #${id} updated`,
                description: `Status changed to ${updated.status}`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });
            } catch (err) {
              toast({
                title: "Update failed",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            }
            setEditOrder(null);
          }}
        />
      )}

      {deleteOrderTarget && (
        <DeleteConfirmModalOrders
          order={deleteOrderTarget}
          onClose={() => setDeleteOrderTarget(null)}
          onConfirm={async () => {
            try {
              await deleteOrder(deleteOrderTarget.id);
              if (typeof onDeleteOrder === "function") {
                onDeleteOrder(deleteOrderTarget.id);
              }
              toast({
                title: `Order #${deleteOrderTarget.orderId} deleted`,
                description: "The order has been removed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
              });
            } catch (err) {
              toast({
                title: "Delete failed",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            }
            setDeleteOrderTarget(null);
          }}
        />
      )}
      </div>
    </div>
  );
}