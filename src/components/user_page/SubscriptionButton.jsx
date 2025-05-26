import React from 'react';

const SubscriptionButton = React.memo(({ isSubscribed, handleSubscription }) => {
  return (
    <button
      onClick={handleSubscription}
      className={`mt-4 w-full ${
        isSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
      } text-white px-6 py-2 rounded-lg transition-colors shadow-md`}
    >
      {isSubscribed ? 'Отписаться' : 'Подписаться'}
    </button>
  );
});

export default SubscriptionButton;