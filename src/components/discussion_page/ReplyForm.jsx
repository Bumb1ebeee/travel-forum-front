import React, { useState } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';

const ReplyForm = ({ discussionId, replyTo, setReplies, onNewReply }) => {
  const [newReply, setNewReply] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false); // Форма скрыта по умолчанию

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

      setReplies((prevReplies) => {
        if (!replyTo) {
          return [newReplyData, ...prevReplies];
        } else {
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

      setNewReply('');
      setFiles([]);
      setError('');
      onNewReply();
    } catch (err) {
      console.error('Не удалось отправить ответ:', err.message);
      setError(err.response?.data?.message || 'Ошибка при отправке ответа');
    }
  };

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm focus:outline-none"
      >
        Новый ответ
      </button>
    );
  }

  return (
    <div className="bg-white mt-4">
      <div className="flex justify-between items-center mb-4 bg-indigo-50 rounded-t-lg p-2">
        <h3 className="text-lg font-semibold text-gray-800">Новый ответ</h3>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
          title="Скрыть форму"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="Введите свой ответ..."
          rows={3} // Уменьшаем высоту textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-between items-center">
          <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            + Прикрепить файлы
          </label>
          <button
            type="submit"
            disabled={!newReply.trim() && files.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
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
    </div>
  );
};

export default ReplyForm;