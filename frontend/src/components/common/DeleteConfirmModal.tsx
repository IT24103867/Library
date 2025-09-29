import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  isLoading: boolean;
  action?: string; // e.g., "delete", "mark as lost", "remove"
  icon?: React.ReactNode;
  confirmButtonText?: string;
  title?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading,
  action = 'delete',
  icon = <FiTrash2 className="h-6 w-6 text-red-600" />,
  confirmButtonText,
  title = ""
}) => {
  const defaultConfirmText = confirmButtonText || `${action.charAt(0).toUpperCase() + action.slice(1)} ${itemType}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      showCloseButton={false}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-gray-600">
            Are you sure you want to {action} <span className="font-semibold text-gray-900">{itemName}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? `${action.charAt(0).toUpperCase() + action.slice(1)}ing...` : defaultConfirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;