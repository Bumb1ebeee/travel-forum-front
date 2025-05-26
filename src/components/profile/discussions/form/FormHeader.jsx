import React from 'react';

const FormHeader = ({ isEdit, isDraft }) => {
  const getTitle = () => {
    if (isEdit) {
      return isDraft ? 'Редактировать черновик' : 'Редактировать обсуждение';
    }
    return 'Создать обсуждение';
  };

  return (
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
      {getTitle()}
    </h2>
  );
};

export default FormHeader; 