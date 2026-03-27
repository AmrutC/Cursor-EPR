import React, { useEffect, useState } from 'react';
import Modal from './Modal';

export default function PromptDialog({
  open,
  title = 'Enter value',
  message = '',
  placeholder = '',
  defaultValue = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue(defaultValue || '');
    }
  }, [open, defaultValue]);

  const disabled = loading;

  return (
    <Modal
      open={open}
      onClose={disabled ? undefined : onCancel}
      title={title}
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={disabled}
            className="btn-secondary"
            style={{ fontSize: 13, opacity: disabled ? 0.7 : 1 }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => onSubmit?.(value.trim())}
            disabled={disabled}
            className="btn-primary"
            style={{ fontSize: 13, opacity: disabled ? 0.7 : 1 }}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </>
      }
    >
      {message ? (
        <div style={{ fontSize: 12, color: '#4B5675', marginBottom: 10 }}>{message}</div>
      ) : null}
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid #DBDFE9',
          borderRadius: 8,
          fontSize: 13,
          color: '#252F4A',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </Modal>
  );
}
