import React from "react";

export default function DeleteConfirmModalOrders({ order, onClose, onConfirm }) {
  return (
    <div className="order-modal">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Delete Order</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete order number <b>{order.orderId}</b>?</p>
          <div className="form-actions">
            <button className="btn-modal btn-outline-modal" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal btn-primary-modal"
              onClick={() => onConfirm(order.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}