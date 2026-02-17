import React from "react";
import { IoCloseSharp } from "react-icons/io5";

/**
 * @param {Object} order - Order object dengan id dan orderId
 * @param {Function} onClose - Callback saat cancel
 * @param {Function} onConfirm - Callback saat konfirmasi delete
 */

export default function DeleteConfirmModalOrders({ order, onClose, onConfirm }) {
  return (
    <div 
      className="order-modal" 
      role="dialog" aria-modal="true" 
      aria-labelledby="delete-modal-title"
    >
      <div className="modal-card">
        <div className="modal-head" id="delete-modal-title">
          <h3>Delete Order</h3>
          <button 
            className="btn-close" 
            onClick={onClose}
          >
            <IoCloseSharp />
          </button>
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