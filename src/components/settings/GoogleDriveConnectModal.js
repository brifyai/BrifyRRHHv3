import React, { useState } from 'react';
import GoogleDriveDirectConnect from './GoogleDriveDirectConnect';

/**
 * GoogleDriveConnectModal
 * Modal personalizado para conectar Google Drive sin usar Swal.fire
 */
const GoogleDriveConnectModal = ({ isOpen, onClose, companyId, companyName, onSuccess, onError }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            🔧 Conectar Google Drive
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <GoogleDriveDirectConnect
            companyId={companyId}
            companyName={companyName}
            onConnectionSuccess={(data) => {
              onSuccess(data);
              onClose();
            }}
            onConnectionError={(error) => {
              onError(error);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveConnectModal;