'use client';
import React from 'react';
import UserAvatar from "@/components/profile/profile/userAvatar";

const UserProfile = React.memo(({ user }) => {

  return (
    <div className="flex items-center space-x-6">
      <UserAvatar user={user} size="large" />
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
        <p className="text-gray-600">@{user.username}</p>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
      </div>
    </div>
  );
});

export default UserProfile;