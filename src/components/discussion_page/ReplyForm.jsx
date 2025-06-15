import React, { useState } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReplyForm = ({ discussionId, replyTo, setReplies, onNewReply, onCancel }) => {
  const [newReply, setNewReply] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const isImage = (file) => file.type.startsWith('image/');
  const isVideo = (file) => file.type.startsWith('video/');

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!discussionId) {
      console.error('discussionId не задан');
      setError('Ошибка: ID обсуждения не задано');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Пожалуйста, войдите в систему');
      return;
    }

    const formData = new FormData();
    formData.append('content', newReply);

    if (replyTo) {
      formData.append('parent_id', replyTo);
    }

    files.forEach((file, index) => {
      formData.append(`media[${index}]`, file);
    });

    try {
      const response = await axios.post(
        `${config.apiUrl}/discussions/${discussionId}/replies`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newReplyData = response.data.reply;

      // Update replies state
      setReplies((prevReplies) => {
        if (!replyTo) {
          // Top-level reply: append to the root replies array
          return [newReplyData, ...prevReplies];
        } else {
          // Nested reply: add to the children of the parent reply
          const addReplyToChildren = (replies, parentId, newReply) => {
            return replies.map((reply) => {
              if (reply.id === parentId) {
                return {
                  ...reply,
                  children: [newReply, ...(reply.children || [])],
                };
              }
              if (reply.children?.length) {
                return {
                  ...reply,
                  children: addReplyToChildren(reply.children, parentId, newReply),
                };
              }
              return reply;
            });
          };
          return addReplyToChildren(prevReplies, replyTo, newReplyData);
        }
      });

      // Reset form and replyTo state
      setNewReply('');
      setFiles([]);
      setError('');
      onNewReply();
    } catch (err) {
      console.error('Не удалось отправить ответ:', err.message);
      setError(err.response?.data?.message || 'Ошибка при отправке ответа');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {replyTo && (
        <div className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg">
          <span className="text-sm text-indigo-700">Ответ на комментарий #{replyTo}</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-indigo-700 hover:text-indigo-900"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      <textarea
        value={newReply}
        onChange={(e) => setNewReply(e.target.value)}
        placeholder="Введите свой ответ..."
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="flex items-center gap-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586M12 3v6m0 0H6m6 0h6" />
            </svg>
            Добавить файлы
          </span>
        </label>
        <button
          type="submit"
          disabled={!newReply.trim() && files.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Отправить
        </button>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              {isImage(file) && (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
              )}
              {isVideo(file) && (
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full h-24 object-cover rounded-lg"
                />
              )}
              {!(isImage(file) || isVideo(file)) && (
                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-xs p-2">
                  {file.name}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
};

export default ReplyForm;