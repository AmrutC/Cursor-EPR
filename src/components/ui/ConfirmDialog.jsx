import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const confirmStyle =
    tone === 'danger'
      ? {
          background: '#FFE2E5',
          border: '1px solid #FFB8C6',
          color: '#7F1D1D',
        }
      : {
          background: '#E8FFF3',
          border: '1px solid #50CD89',
          color: '#17C653',
        };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
            style={{ fontSize: 13, opacity: loading ? 0.7 : 1 }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...confirmStyle,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: loading ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 13, color: '#4B5675', lineHeight: 1.5 }}>{message}</div>
    </Modal>
  );
}
