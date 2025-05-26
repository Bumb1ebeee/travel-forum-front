import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ReplyForm = ({ newReply, setNewReply, handleReply, replyTo, setReplyTo, replies }) => {
  const [files, setFiles] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const findReplyById = (replies, id) => {
    for (const reply of replies) {
      if (reply.id === id) return reply;
      if (reply.children && reply.children.length > 0) {
        const found = findReplyById(reply.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const parentReply = replyTo ? findReplyById(replies, replyTo) : null;
  const parentUsername = parentReply ? parentReply.user?.username || 'Неизвестный' : null;
  const parentContent = parentReply ? parentReply.content.slice(0, 30) + (parentReply.content.length > 30 ? '...' : '') : '';

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', newReply);
    if (replyTo) formData.append('parent_id', replyTo);
    files.forEach((file, index) => {
      formData.append(`media[${index}]`, file);
    });

    handleReply(e, replyTo, formData);
    setFiles([]);
  };

  const isImage = (file) => file.type.startsWith('image/');
  const isVideo = (file) => file.type.startsWith('video/');

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Заголовок с кнопкой сворачивания */}
      <div 
        className="flex items-center justify-between px-3 py-3 bg-indigo-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-indigo-900">
          {replyTo ? 'Ответ на комментарий' : 'Новый ответ'}
        </h3>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-indigo-600" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
        )}
      </div>

      {isExpanded && (
        <form onSubmit={onSubmit} className="p-4">
          {replyTo && parentReply && (
            <div className="mb-3 p-3 bg-indigo-50 rounded text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-indigo-800">
                    Ответ для {parentUsername}:
                  </span>
                  <p className="text-gray-600 mt-1">{parentContent}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-indigo-600 hover:text-indigo-800 text-xs"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}

          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="w-full p-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all resize-none"
            placeholder={replyTo ? 'Введите ответ...' : 'Ваш ответ...'}
            rows="3"
          />

          <div className="mt-3 flex items-center justify-between">
            <label className="text-xs text-gray-600">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                + Прикрепить файлы
              </span>
            </label>

            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
              disabled={!newReply.trim() && files.length === 0}
            >
              Отправить
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  {isImage(file) && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded"
                    />
                  )}
                  {isVideo(file) && (
                    <video
                      src={URL.createObjectURL(file)}
                      className="w-full h-20 object-cover rounded"
                      controls
                    />
                  )}
                  {!isImage(file) && !isVideo(file) && (
                    <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs">
                      {file.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default ReplyForm;