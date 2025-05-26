import React from 'react';

const UserProfile = React.memo(({ user }) => {
  return (
    <div className="flex items-center space-x-6">
      <img
        src={user.avatar || '/default-avatar.png'}
        alt={user.name}
        className="w-24 h-24 rounded-full object-cover shadow-lg"
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
        <p className="text-gray-600">@{user.username}</p>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
      </div>
    </div>
  );
});

export default UserProfile;