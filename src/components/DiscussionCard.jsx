import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';

export default function DiscussionCard({ discussion }) {
  const router = useRouter();

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getTextContent = (media) => {
    if (media.type !== 'text') return null;
    if (typeof media.content === 'string') return media.content;
    return media.content?.text_content || media.content?.text || null;
  };

  const handleDiscussionClick = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${config.apiUrl}/discussions/${discussionId}`);
      }
      router.push(`/discussions/${discussionId}`);
    } catch (err) {
      console.error(err.response?.data?.message || 'Ошибка при открытии обсуждения');
    }
  };

  return (
    <li
      className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleDiscussionClick(discussion.id)}
    >
      <h3 className="text-lg font-semibold text-text-primary">{discussion.title}</h3>
      {discussion.description && (
        <p className="text-text-secondary mt-1">
          {truncateText(discussion.description, 200)}
        </p>
      )}

      <div className="mt-2 space-y-2">
        {discussion.media && discussion.media.length > 0 ? (
          discussion.media.map((media) => {
            const textContent = getTextContent(media);
            return (
              <div key={media.id}>
                {media.type === 'text' && textContent && (
                  <p className="media-text">{truncateText(textContent, 200)}</p>
                )}
                {media.type === 'image' && media.content?.image_url && (
                  <img
                    src={media.content.image_url}
                    alt="Discussion Image"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400';
                    }}
                  />
                )}
                {media.type === 'video' && media.content?.video_url && (
                  <video
                    src={media.content.video_url}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                {media.type === 'audio' && media.content?.music_url && (
                  <audio
                    src={media.content.music_url}
                    controls
                    className="w-full"
                  />
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm">Медиа отсутствуют</p>
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
} 