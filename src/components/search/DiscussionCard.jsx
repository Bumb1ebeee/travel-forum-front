import React from 'react';
import Image from 'next/image';

const DiscussionCard = ({ discussion, onClick }) => (
  <li
    className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <h3 className="text-lg font-semibold text-text-primary">{discussion.title}</h3>
    {discussion.description && (
      <p className="text-text-secondary mt-1">{discussion.description}</p>
    )}
    <div className="mt-2 space-y-2">
      {discussion.media && discussion.media.length > 0 && (
        discussion.media.map((media) => (
          <div key={media.id}>
            {media.type === 'image' && (
              <Image
                src={media.path}
                alt="Discussion Image"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            {media.type === 'video' && (
              <video
                src={media.path}
                controls
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            {media.type === 'audio' && (
              <audio src={media.path} controls className="w-full" />
            )}
          </div>
        ))
      )}
    </div>
    <p className="text-sm text-gray-500 mt-2">
      Автор: {discussion.user?.name || 'Неизвестный'} | Создано:{' '}
      {new Date(discussion.created_at).toLocaleDateString()}
    </p>
    {discussion.tags && discussion.tags.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {discussion.tags.map((tag) => (
          <span
            key={tag.id}
            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
          >
            {tag.name}
          </span>
        ))}
      </div>
    )}
  </li>
);

export default DiscussionCard;