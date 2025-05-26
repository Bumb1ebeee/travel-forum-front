'use client';

import React from 'react';
import PropTypes from 'prop-types';

const ActionButtons = ({
                         onSaveDraft,
                         onPublish,
                         onDelete,
                         onCancel,
                         submitting,
                         hasId,
                       }) => {
  return (
    <div className="flex gap-4 flex-wrap">
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={submitting}
        className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md font-semibold disabled:bg-gray-400"
      >
        Сохранить
      </button>
      <button
        type="button"
        onClick={onPublish}
        disabled={submitting}
        className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md font-semibold disabled:bg-gray-400"
      >
        Опубликовать
      </button>
      {hasId && (
        <button
          type="button"
          onClick={onDelete}
          disabled={submitting}
          className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md font-semibold disabled:bg-gray-400"
        >
          Удалить
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md font-semibold"
      >
        Отмена
      </button>
    </div>
  );
};

ActionButtons.propTypes = {
  onSaveDraft: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  hasId: PropTypes.bool,
};

export default ActionButtons;