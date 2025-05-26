'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import parse from 'html-react-parser';
import axios from 'axios';
import config from '@/pages/api/config';
import { useRouter } from 'next/navigation';
import styles from './DiscussionItem.module.css';

const DiscussionItem = ({ discussion, user, openEditModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);
  const mapRefs = useRef({});

  // Ограничиваем описание до 100 символов для краткого отображения
  const shortDescription = discussion.description
    ? parse(
      discussion.description.length > 100
        ? discussion.description.slice(0, 100) + '...'
        : discussion.description
    )
    : '';

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Загрузка Yandex Maps API для модального окна
  useEffect(() => {
    if (isModalOpen && !ymapsLoaded && discussion.media?.some((item) => item.type === 'map')) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=b6a3646e-c364-4407-b0b6-05e469ce3812';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          setYmapsLoaded(true);
        });
      };
      script.onerror = () => {
        setError('Не удалось загрузить Yandex Maps API');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isModalOpen, ymapsLoaded]);

  // Инициализация карт в модальном окне
  const initMap = useCallback((mediaId, mapPoints) => {
    if (!window.ymaps || !mapRefs.current[mediaId]) return;

    const map = new window.ymaps.Map(
      mapRefs.current[mediaId],
      {
        center: mapPoints.length > 0 ? [mapPoints[0].lat, mapPoints[0].lng] : [55.7558, 37.6173],
        zoom: 10,
        controls: ['zoomControl'],
      },
      {
        suppressMapOpenBlock: true,
      }
    );

    mapPoints.forEach((point) => {
      const placemark = new window.ymaps.Placemark(
        [point.lat, point.lng],
        {},
        { preset: 'islands#redDotIcon' }
      );
      map.geoObjects.add(placemark);
    });

    if (mapPoints.length > 0) {
      map.setBounds(
        mapPoints.reduce(
          (bounds, point) => [
            [Math.min(bounds[0][0], point.lat), Math.min(bounds[0][1], point.lng)],
            [Math.max(bounds[1][0], point.lat), Math.max(bounds[1][1], point.lng)],
          ],
          [
            [mapPoints[0].lat, mapPoints[0].lng],
            [mapPoints[0].lat, mapPoints[0].lng],
          ]
        ),
        { checkZoomRange: true }
      );
    }
  }, []);

  useEffect(() => {
    if (ymapsLoaded && isModalOpen) {
      discussion.media?.forEach((item) => {
        if (item.type === 'map' && item.content?.map_points) {
          initMap(item.id, item.content.map_points);
        }
      });
    }
  }, [ymapsLoaded, isModalOpen, discussion.media, initMap]);

  const handleDelete = async () => {
    if (!confirm(`Вы уверены, что хотите удалить ${discussion.is_draft ? 'черновик' : 'обсуждение'}?`)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      await axios.delete(`${config.apiUrl}/discussions/${discussion.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setError('');
      router.refresh();
      alert(discussion.is_draft ? 'Черновик удалён' : 'Обсуждение удалено');
    } catch (err) {
      console.error('Ошибка удаления:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        localStorage.removeItem('token');
        router.push('/login');
      } else if (err.response?.status === 404) {
        setError('Обсуждение или черновик не найден');
      } else {
        setError('Ошибка удаления: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      await axios.put(
        `${config.apiUrl}/discussions/${discussion.id}/publish`,
        {
          title: discussion.title,
          category_id: discussion.category_id,
          description: discussion.description || '',
          map: {
            start: discussion.map?.start || '',
            end: discussion.map?.end || '',
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setError('');
      router.refresh();
      alert('Обсуждение опубликовано');
    } catch (err) {
      console.error('Ошибка публикации:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        localStorage.removeItem('token');
        router.push('/login');
      } else if (err.response?.status === 422) {
        setError('Ошибка валидации: ' + Object.values(err.response.data.errors).flat().join(', '));
      } else {
        setError('Ошибка публикации: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Вы уверены, что хотите снять обсуждение с публикации?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      await axios.put(
        `${config.apiUrl}/discussions/${discussion.id}/unpublish`,
        {
          title: discussion.title,
          category_id: discussion.category_id,
          description: discussion.description || '',
          map: {
            start: discussion.map?.start || '',
            end: discussion.map?.end || '',
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setError('');
      router.refresh();
      alert('Обсуждение перемещено в черновики');
    } catch (err) {
      console.error('Ошибка снятия с публикации:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError('Ошибка снятия с публикации: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Рендеринг медиа-элемента
  const renderMediaItem = (item, isPreview = false) => {
    switch (item.type) {
      case 'text':
        const text = item.content?.text_content;
        return (
          <p className={`${styles.mediaText} ${isPreview ? styles.mediaTextPreview : styles.mediaTextFull}`}>
            {text
              ? (isPreview && text.length > 50 ? text.slice(0, 50) + '...' : text)
              : 'Текст отсутствует'}
          </p>
        );
      case 'image':
        return (
          <img
            src={item.content?.image_url || 'https://placehold.co/80x80'}
            alt="Медиа"
            className={isPreview ? styles.mediaImagePreview : styles.mediaImage}
            onError={(e) => {
              e.target.src = 'https://placehold.co/80x80';
            }}
          />
        );
      case 'video':
        return (
          <video
            src={item.content?.video_url}
            controls
            className={isPreview ? styles.mediaVideoPreview : styles.mediaVideo}
          />
        );
      case 'music':
        return (
          <audio
            src={item.content?.music_url}
            controls
            className={isPreview ? styles.mediaAudioPreview : styles.mediaAudio}
          />
        );
      case 'map':
        if (isPreview && item.content?.map_points?.length > 0) {
          const [point] = item.content.map_points;
          const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${point.lng},${point.lat}&z=12&size=200,100&l=map&pt=${point.lng},${point.lat},pm2rdm`;
          return (
            <img
              src={staticMapUrl}
              alt="Превью карты"
              className={styles.mediaMapPreview}
            />
          );
        } else if (!isPreview) {
          return (
            <div
              ref={(el) => (mapRefs.current[item.id] = el)}
              className={styles.mediaMap}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={styles.discussionItem}>
      <div
        className={styles.discussionContent}
        onClick={() => setIsModalOpen(true)}
      >
        <h3 className={styles.title}>{discussion.title}</h3>
        <p className={styles.category}>Категория: {discussion.category?.name || 'Не указана'}</p>
        {discussion.map?.start && discussion.map?.end && (
          <p className={styles.route}>
            Маршрут: {discussion.map.start} → {discussion.map.end}
          </p>
        )}
        <p className={styles.status}>
          Статус: {discussion.is_draft ? 'Черновик' : 'Опубликовано'}
        </p>
        {/* Превью медиа */}
        {discussion.media?.length > 0 && (
          <div className={styles.mediaPreview}>
            {discussion.media.slice(0, 2).map((item) => (
              <div key={item.id} className={styles.mediaItem}>
                {renderMediaItem(item, true)}
              </div>
            ))}
            {discussion.media.length > 2 && (
              <p className={styles.mediaCount}>
                +{discussion.media.length - 2}...
              </p>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6h.01M12 12h.01M12 18h.01"
              />
            </svg>
          </button>
          {isMenuOpen && (
            <div
              ref={menuRef}
              className={styles.menu}
            >
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

      {/* Модальное окно для полного просмотра */}
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
            <p className={styles.category}>Категория: {discussion.category?.name || 'Не указана'}</p>
            {discussion.map?.start && discussion.map?.end && (
              <p className={styles.route}>
                Маршрут: {discussion.map.start} → {discussion.map.end}
              </p>
            )}
            <p className={styles.status}>
              Статус: {discussion.is_draft ? 'Черновик' : 'Опубликовано'}
            </p>
            {/* Полное отображение медиа */}
            {discussion.media?.length > 0 && (
              <div className={`${styles.mediaPreview} ${styles.mediaPreviewWrap}`}>
                <div className={styles.mediaItem}>
                  {discussion.media.map((item) => (
                    <div key={item.id}>
                      {renderMediaItem(item, false)}
                    </div>
                  ))}
                </div>
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