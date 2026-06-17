import React from 'react';
import '../../App.css';

export default function Modal({ children, onClose, contentClassName = '' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${contentClassName}`.trim()} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}
