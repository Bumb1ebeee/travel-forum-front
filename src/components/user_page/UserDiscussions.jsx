// components/UserDiscussions.js
import React from 'react';
import { useRouter } from 'next/router';

const UserDiscussions = React.memo(({ discussions }) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Обсуждения</h2>
      {discussions.length === 0 ? (
        <p className="text-gray-600">У пользователя пока нет обсуждений</p>
      ) : (
        <div className="grid gap-6">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/discussions/${discussion.id}`)}
            >
              <h3 className="text-xl font-semibold text-gray-800">{discussion.title}</h3>
              {discussion.category && (
                <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full mt-2">
                  {discussion.category.name}
                </span>
              )}
              {discussion.description && (
                <p className="text-gray-600 mt-2 line-clamp-2">{discussion.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Создано: {new Date(discussion.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default UserDiscussions;