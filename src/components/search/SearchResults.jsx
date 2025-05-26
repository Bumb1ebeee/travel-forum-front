import React from 'react';
import DiscussionCard from './DiscussionCard';

const SearchResults = ({ discussions, handleDiscussionClick }) => (
  <ul className="space-y-4">
    {discussions.map((discussion) => (
      <DiscussionCard
        key={discussion.id}
        discussion={discussion}
        onClick={() => handleDiscussionClick(discussion.id)}
      />
    ))}
  </ul>
);

export default SearchResults;