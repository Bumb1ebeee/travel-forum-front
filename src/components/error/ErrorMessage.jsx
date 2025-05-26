import React from 'react';

const ErrorMessage = ({ message }) => (
  <p className="text-red-500 text-center mt-4 bg-red-50 p-3 rounded-lg">{message}</p>
);

export default ErrorMessage;