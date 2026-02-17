import React, { useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";

export default function EditStatusModalOrders({ order, onClose, onSave }) {
  const [status, setStatus] = React.useState(order.status);
  useEffect(() => {
    setStatus(order.status);
  }, [order]);

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(order.id, status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="order-modal">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Edit Status</h3>
          <button
            className="btn-close" 
            onClick={onClose}
            aria-label="Close status edit modal"
            type="button"
            >
              <IoCloseSharp />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="form-label">Status</label>
          <select
            className="control-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
          </select>

          <div className="form-actions">
            <button type="button" className="btn-modal btn-outline-modal" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal btn-primary-modal">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}