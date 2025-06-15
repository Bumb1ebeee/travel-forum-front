'use client';
import React, { useState, useRef, useEffect } from 'react';
import parse from 'html-react-parser';
import axios from 'axios';
import config from '@/pages/api/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './DiscussionItem.module.css';
import { toast } from 'react-toastify';

const DiscussionItem = ({ discussion, user, type, openEditModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [mediaItems, setMediaItems] = useState(discussion.media || []);
  const mapRef = useRef(null);
  const router = useRouter();

  const checkUrlValidity = async (url) => {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch (err) {
      return false;
    }
  };

  const refreshMediaUrl = async (mediaId, urlKey) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${config.apiUrl}/media/${mediaId}/refresh`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newUrl = response.data.url;
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === String(mediaId)
            ? {
              ...item,
              content: { ...item.content, [urlKey]: newUrl },
            }
            : item
        )
      );
      toast.success('Ссылка обновлена');
      return newUrl;
    } catch (err) {
      console.error('Не удалось обновить ссылку:', err.message);
      toast.error('Не удалось обновить ссылку');
      return null;
    }
  };

  useEffect(() => {
    if (!isModalOpen || ymapsLoaded) return;

    if (window.ymaps) {
      setYmapsLoaded(true);
      initAllMaps();
    } else {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=ваш_ключ';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          setYmapsLoaded(true);
          initAllMaps();
        });
      };
      script.onerror = () => {
        console.error('Не удалось загрузить Yandex Maps API');
        setError('Не удалось загрузить карту');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isModalOpen]);

  const initAllMaps = () => {
    mediaItems.forEach((item) => {
      if (item.type === 'map' && item.content?.map_points?.length > 0) {
        initMap(item.id, item.content.map_points);
      }
    });
  };

  const initMap = (id, points) => {
    const mapContainer = document.getElementById(`map-${id}`);
    if (!mapContainer || !window.ymaps) return;

    const map = new window.ymaps.Map(mapContainer, {
      center: [points[0].lat, points[0].lng],
      zoom: 10,
    });

    points.forEach((point) => {
      map.geoObjects.add(new window.ymaps.Placemark([point.lat, point.lng]));
    });

    if (points.length > 1) {
      map.setBounds(
        points.reduce(
          (bounds, p) => [
            [Math.min(bounds[0][0], p.lat), Math.min(bounds[0][1], p.lng)],
            [Math.max(bounds[1][0], p.lat), Math.max(bounds[1][1], p.lng)],
          ],
          [[points[0].lat, points[0].lng], [points[0].lat, points[0].lng]]
        ),
        { checkZoomRange: true }
      );
    }
  };

  const renderMediaItem = (item, isPreview = false) => {
    console.log('Рендерим медиа:', {
      id: item.id,
      type: item.type,
      content: item.content,
    });

    const urlKey = item.type === 'image' ? 'image_url' : item.type === 'video' ? 'video_url' : 'music_url';
    const url = item.content?.[urlKey];

    const handleMediaError = async () => {
      if (url && item.type !== 'text' && item.type !== 'map') {
        const isValid = await checkUrlValidity(url);
        if (!isValid) {
          const newUrl = await refreshMediaUrl(item.id, urlKey);
          return newUrl;
        }
      }
    };

    switch (item.type || item.content_type) {
      case 'image':
        return (
          <img
            src={`${url}&disposition=inline`}
            alt="Медиа"
            onError={handleMediaError}
            className={isPreview ? styles.mediaImagePreview : styles.mediaImage}
          />
        );

      case 'video':
        return (
          <video
            controls
            className={isPreview ? styles.mediaVideoPreview : styles.mediaVideo}
            onError={handleMediaError}
          >
            <source src={`${url}&disposition=inline`} type='video/mp4' />
            Ваш браузер не поддерживает видео.
          </video>
        );

      case 'music':
        return (
          <audio
            controls
            className={styles.mediaAudio}
            src={`${url}&disposition=inline`}
            onError={handleMediaError}
          >
            Ваш браузер не поддерживает аудио.
          </audio>
        );

      case 'text':
        return (
          <p className={styles.mediaText}>
            {parse(item.content?.text_content || 'Нет текста')}
          </p>
        );

      case 'map':
        return (
          <div className={styles.mediaMap} key={`map-container-${item.id}`}>
            <p>Карта ({item.content?.map_points?.length || 0} точек)</p>
            <div
              id={`map-${item.id}`}
              ref={mapRef}
              style={{ width: '100%', height: isPreview ? '150px' : '400px' }}
            ></div>
          </div>
        );

      default:
        return <p>Неизвестный тип медиа</p>;
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить ${discussion.is_draft ? 'черновик' : 'публикацию'}?`
      )
    )
      return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      await axios.delete(`${config.apiUrl}/discussions/${discussion.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setError('');
      router.refresh();
      toast.success(discussion.is_draft ? 'Черновик удалён' : 'Публикация удалена');
    } catch (err) {
      console.error('Ошибка удаления:', err.message);
      setError('Не удалось удалить публикацию');
      toast.error('Не удалось удалить публикацию');
    }
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      await axios.put(
        `${config.apiUrl}/discussions/${discussion.id}/publish`,
        {
          title: discussion.title,
          category_id: discussion.category_id,
          description: discussion.description || '',
          map: discussion.map || [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      );

      toast.success('Публикация опубликована');
      router.refresh();
    } catch (err) {
      console.error('Ошибка публикации:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Ошибка публикации');
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Вы уверены, что хотите снять обсуждение с публикации?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      await axios.post(
        `${config.apiUrl}/discussions/${discussion.id}/unpublish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setError('');
      router.refresh();
      toast.success('Обсуждение снято с публикации');
    } catch (err) {
      console.error('Ошибка снятия с публикации:', err.message);
      setError('Не удалось снять обсуждение с публикации');
      toast.error('Не удалось снять обсуждение с публикации');
    }
  };

  return (
    <div className={styles.discussionItem}>
      <div
        className={styles.discussionContent}
        onClick={() => setIsModalOpen(true)}
      >
        {type === 'published' ? (
          <Link
            href={`/discussions/${discussion.id}`}
            className={styles.titleLink}
            onClick={(e) => e.stopPropagation()}
          >
            {discussion.title}
          </Link>
        ) : (
          <h3 className={styles.title}>{discussion.title}</h3>
        )}
        <p className={styles.category}>
          Категория: {discussion.category?.name || 'Не указана'}
        </p>

        {discussion.map?.start && discussion.map?.end && (
          <p className={styles.route}>
            Маршрут: {discussion.map.start} → {discussion.map.end}
          </p>
        )}

        <p className={styles.status}>
          Статус: {discussion.is_draft ? 'Черновик' : 'Опубликовано'}
        </p>

        {mediaItems?.length > 0 && (
          <div className={styles.mediaPreview}>
            {mediaItems.slice(0, 2).map((item) => (
              <div key={item.id} className={styles.mediaItem}>
                {renderMediaItem(item, true)}
              </div>
            ))}
            {mediaItems.length > 2 && (
              <p className={styles.mediaCount}>+{mediaItems.length - 2}...</p>
            )}
          </div>
        )}
      </div>

      {user && user.id === discussion.user_id && (
        <div className={styles.menuButton}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 6h.01M12 12h.01M12 18h.01'
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className={styles.menu}>
              <button
                onClick={() => {
                  openEditModal(discussion);
                  setIsMenuOpen(false);
                }}
                className={styles.menuItem}
              >
                Редактировать
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setIsMenuOpen(false);
                }}
                className={`${styles.menuItem} ${styles.menuItemDelete}`}
              >
                Удалить
              </button>
              {discussion.is_draft ? (
                <button
                  onClick={() => {
                    handlePublish();
                    setIsMenuOpen(false);
                  }}
                  className={`${styles.menuItem} ${styles.menuItemPublish}`}
                >
                  Опубликовать
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleUnpublish();
                    setIsMenuOpen(false);
                  }}
                  className={`${styles.menuItem} ${styles.menuItemUnpublish}`}
                >
                  Снять с публикации
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              onClick={() => setIsModalOpen(false)}
              className={styles.modalClose}
            >
              ✕
            </button>
            <h3 className={styles.title}>{discussion.title}</h3>
            <p className={styles.category}>
              Категория: {discussion.category?.name || 'Не указана'}
            </p>

            {discussion.map?.start && discussion.map?.end && (
              <p className={styles.route}>
                Маршрут: {discussion.map.start} → {discussion.map.end}
              </p>
            )}

            <p className={styles.status}>
              Статус: {discussion.is_draft ? 'Черновик' : 'Опубликовано'}
            </p>

            {mediaItems?.length > 0 && (
              <div className={`${styles.mediaPreview} ${styles.mediaPreviewWrap}`}>
                {mediaItems.map((item) => (
                  <div key={item.id} className={styles.mediaItem}>
                    {renderMediaItem(item, false)}
                  </div>
                ))}
              </div>
            )}

            {user && user.id === discussion.user_id && (
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  openEditModal(discussion);
                }}
                className={styles.editButton}
              >
                Редактировать
              </button>
            )}

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionItem;