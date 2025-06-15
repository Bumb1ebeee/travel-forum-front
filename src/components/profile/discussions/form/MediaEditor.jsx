'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { MapIcon, DocumentTextIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import PropTypes from 'prop-types';
import config from '@/pages/api/config';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

const MediaEditor = ({
                       mediableId,
                       mediableType,
                       content,
                       onChange,
                       onImageSelect,
                       onFileSelect,
                       handleDeleteMedia,
                       submitting,
                       onEditorReady,
                       onMapChange,
                       onMediaChange,
                       initialMapPoints,
                       mediaItems,
                       setMediaItems,
                       isEdit = false,
                     }) => {
  const [selectedType, setSelectedType] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [mapPoints, setMapPoints] = useState(initialMapPoints || []);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [editingMediaId, setEditingMediaId] = useState(null);
  const [editingTextContent, setEditingTextContent] = useState('');
  const mapRef = useRef(null);
  const ymapsRef = useRef(null);

  // Мемоизация onMediaChange
  const memoizedOnMediaChange = useCallback(
    (items) => {
      console.log('Вызов onMediaChange:', items);
      onMediaChange(items);
      setMediaItems(items);
    },
    [onMediaChange, setMediaItems]
  );

  // Функция для обновления mediaItems с новыми точками карты
  const updateMediaItemsWithMapPoints = useCallback(
    (updatedPoints) => {
      setMediaItems((prev) => {
        const mapItem = prev.find((item) => item.content_type === 'map');
        let updatedMediaItems;
        if (mapItem) {
          updatedMediaItems = prev.map((item) =>
            item.content_type === 'map'
              ? { ...item, content: { ...item.content, map_points: updatedPoints } }
              : item
          );
        } else {
          const newMapItem = {
            id: `temp-map-${Date.now()}`,
            content_type: 'map',
            content: { map_points: updatedPoints },
            file_type: null,
            order: prev.length,
          };
          updatedMediaItems = [...prev, newMapItem];
        }
        memoizedOnMediaChange(updatedMediaItems);
        onMapChange(updatedPoints);
        return updatedMediaItems;
      });
    },
    [memoizedOnMediaChange, onMapChange, setMediaItems]
  );

  // Инициализация карты
  const initMap = useCallback(() => {
    if (!ymapsRef.current || !mapRef.current) return;

    if (mapRef.current.mapInstance) {
      mapRef.current.mapInstance.destroy();
      mapRef.current.mapInstance = null;
    }

    const map = new ymapsRef.current.Map(mapRef.current, {
      center: mapPoints.length > 0
        ? [mapPoints[0].lat, mapPoints[0].lng]
        : [55.7558, 37.6173],
      zoom: 10,
      controls: ['zoomControl'],
    }, {
      suppressMapOpenBlock: true,
    });

    mapRef.current.mapInstance = map;

    const placemarks = mapPoints.map((point) => {
      const placemark = new ymapsRef.current.Placemark([point.lat, point.lng], {}, {
        preset: 'islands#redDotIcon',
      });
      map.geoObjects.add(placemark);
      return placemark;
    });

    map.events.add('click', (e) => {
      const coords = e.get('coords');
      const newPoint = { lat: coords[0], lng: coords[1] };
      setMapPoints((prev) => {
        const updatedPoints = [...prev, newPoint];
        const placemark = new ymapsRef.current.Placemark(coords, {}, {
          preset: 'islands#redDotIcon',
        });
        map.geoObjects.add(placemark);
        updateMediaItemsWithMapPoints(updatedPoints);
        return updatedPoints;
      });
    });

    if (mapPoints.length > 0) {
      map.setBounds(
        mapPoints.reduce(
          (bounds, point) => [
            [Math.min(bounds[0][0], point.lat), Math.min(bounds[0][1], point.lng)],
            [Math.max(bounds[1][0], point.lat), Math.max(bounds[1][1], point.lng)],
          ],
          [[mapPoints[0].lat, mapPoints[0].lng], [mapPoints[0].lat, mapPoints[0].lng]]
        ),
        { checkZoomRange: true }
      );
    }
  }, [mapPoints, updateMediaItemsWithMapPoints]);

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (isMapModalOpen && !ymapsRef.current) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=b6a3646e-c364-4407-b0b6-05e469ce3812';
      script.async = true;
      script.onload = () => {
        ymapsRef.current = window.ymaps;
        ymapsRef.current.ready(initMap);
      };
      script.onerror = () => {
        setError('Не удалось загрузить Yandex Maps API');
        toast.error('Не удалось загрузить Yandex Maps API');
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else if (isMapModalOpen && ymapsRef.current) {
      ymapsRef.current.ready(initMap);
    }

    return () => {
      if (mapRef.current && mapRef.current.mapInstance) {
        mapRef.current.mapInstance.destroy();
        mapRef.current.mapInstance = null;
      }
    };
  }, [isMapModalOpen, initMap]);

  // Функция удаления точки
  const handleRemovePoint = (index) => {
    setMapPoints((prev) => {
      const updatedPoints = prev.filter((_, i) => i !== index);
      if (mapRef.current.mapInstance) {
        mapRef.current.mapInstance.geoObjects.removeAll();
        updatedPoints.forEach((point) => {
          const placemark = new ymapsRef.current.Placemark([point.lat, point.lng], {}, {
            preset: 'islands#redDotIcon',
          });
          mapRef.current.mapInstance.geoObjects.add(placemark);
        });
        if (updatedPoints.length > 0) {
          mapRef.current.mapInstance.setBounds(
            updatedPoints.reduce(
              (bounds, point) => [
                [Math.min(bounds[0][0], point.lat), Math.min(bounds[0][1], point.lng)],
                [Math.max(bounds[1][0], point.lat), Math.max(bounds[1][1], point.lng)],
              ],
              [[updatedPoints[0].lat, updatedPoints[0].lng], [updatedPoints[0].lat, updatedPoints[0].lng]]
            ),
            { checkZoomRange: true }
          );
        } else {
          mapRef.current.mapInstance.setCenter([55.7558, 37.6173], 10);
        }
      }
      updateMediaItemsWithMapPoints(updatedPoints);
      return updatedPoints;
    });
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
  };

  const handleTextChange = (e) => {
    setTextContent(e.target.value);
  };

  const uploadToYandexDisk = async (file) => {
    const yandexToken = 'y0__xDM36utBBjblgMg2umTwBPo4gx7IP25mE7cLmmXfep29ytG8w'; // Замените на свой
    const fileName = `${Date.now()}-${uuidv4()}-${file.name}`;

    try {
      const { data } = await axios.get(
        'https://cloud-api.yandex.net/v1/disk/resources/upload',
        {
          params: {
            path: `/media/${fileName}`,
            overwrite: true,
          },
          headers: {
            Authorization: `OAuth ${yandexToken}`,
          },
        }
      );

      await axios.put(data.href, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      await axios.put(
        'https://cloud-api.yandex.net/v1/disk/resources/publish',
        null,
        {
          params: { path: `/media/${fileName}` },
          headers: {
            Authorization: `OAuth ${yandexToken}`,
          },
        }
      );

      const publicLinkResponse = await axios.get(
        'https://cloud-api.yandex.net/v1/disk/resources',
        {
          params: { path: `/media/${fileName}` },
          headers: {
            Authorization: `OAuth ${yandexToken}`,
          },
        }
      );

      const publicUrl = publicLinkResponse.data.public_url;
      return publicUrl;

    } catch (error) {
      console.error('Ошибка загрузки на Яндекс.Диск:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.status, error.response.data);
      }
      throw new Error('Не удалось загрузить файл на Яндекс.Диск');
    }
  };

  const handleAddMedia = async () => {
    try {
      if (!mediableId) throw new Error('mediableId не определен');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен авторизации отсутствует');

      let response;

      if (selectedType === 'text') {
        response = await axios.post(`${config.apiUrl}/media`, {
          mediable_id: mediableId,
          mediable_type: 'App\\Models\\Discussion',
          type: 'text',
          text_content: textContent,
          file_type: null,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (['image', 'video', 'music'].includes(selectedType)) {
        const publicUrl = await uploadToYandexDisk(file);

        response = await axios.post(`${config.apiUrl}/media`, {
          mediable_id: mediableId,
          mediable_type: 'App\\Models\\Discussion',
          type: selectedType,
          content: {
            ...(selectedType === 'image' && { image_url: publicUrl }),
            ...(selectedType === 'video' && { video_url: publicUrl }),
            ...(selectedType === 'music' && { music_url: publicUrl }),
          },
          file_type: selectedType,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (selectedType === 'map') {
        const payload = {
          mediable_id: mediableId,
          mediable_type: 'App\\Models\\Discussion',
          type: 'map',
          content: { map_points: mapPoints },
          file_type: null,
        };

        if (editingMediaId) {
          response = await axios.patch(`${config.apiUrl}/media/${editingMediaId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          response = await axios.post(`${config.apiUrl}/media`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      const newMedia = {
        id: String(response.data.media.id),
        content_type: response.data.media.type,
        type: response.data.media.type,
        content: response.data.media.content,
        file_type: response.data.media.file_type || null,
        order: mediaItems.length,
      };

      const updatedMediaItems = editingMediaId
        ? mediaItems.map((item) =>
          item.id === editingMediaId ? { ...item, content: response.data.media.content } : item
        )
        : [...mediaItems, newMedia];

      setMediaItems(updatedMediaItems);
      memoizedOnMediaChange(updatedMediaItems);

      setTextContent('');
      setFile(null);
      setSelectedType('');
      setMapPoints([]);
      setEditingMediaId(null);
      toast.success(editingMediaId ? 'Медиа обновлено' : 'Медиа добавлено');
    } catch (err) {
      console.error('Ошибка добавления медиа:', err.message);
      setError(err.response?.data?.message || 'Ошибка добавления медиа');
      toast.error(err.response?.data?.message || 'Ошибка добавления медиа');
    }
  };

  const handleEditMedia = async (mediaId) => {
    try {
      if (!editingTextContent.trim()) throw new Error('Текст не может быть пустым');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      const response = await axios.patch(`${config.apiUrl}/media/${mediaId}`, {
        text_content: editingTextContent,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedMediaItems = mediaItems.map((item) =>
        item.id === mediaId
          ? {
            ...item,
            content: {
              ...item.content,
              text_content: editingTextContent,
            },
          }
          : item
      );

      setMediaItems(updatedMediaItems);
      memoizedOnMediaChange(updatedMediaItems);
      setEditingMediaId(null);
      setEditingTextContent('');
      toast.success('Текст обновлён');
    } catch (err) {
      console.error('Ошибка обновления медиа:', err.message);
      setError(err.response?.data?.message || 'Ошибка обновления текста');
      toast.error(err.response?.data?.message || 'Ошибка обновления текста');
    }
  };

  const startEditing = (media) => {
    setEditingMediaId(media.id);
    setEditingTextContent(media.content?.text_content || '');
  };

  const cancelEditing = () => {
    setEditingMediaId(null);
    setEditingTextContent('');
  };

  const renderMediaItem = (media, isPreview = false) => {
    console.log('MediaEditor - рендерим медиа:', {
      id: media.id,
      type: media.type,
      content_type: media.content_type,
      content: media.content,
    });

    let effectiveType = media.content_type || media.type || 'unknown';
    if (media.content?.image_url && media.content.image_url !== '') {
      effectiveType = 'image';
    } else if (media.content?.video_url && media.content.video_url !== '') {
      effectiveType = 'video';
    } else if (media.content?.music_url && media.content.music_url !== '') {
      effectiveType = 'music';
    } else if (media.content?.map_points && media.content.map_points.length > 0) {
      effectiveType = 'map';
    } else if (media.content?.text_content && media.content.text_content !== '') {
      effectiveType = 'text';
    }

    console.log('MediaEditor - эффективный тип медиа:', effectiveType);

    switch (effectiveType) {
      case 'image':
        return (
          <div>
            <img
              src={media.content?.image_url || 'https://placehold.co/80x80'}
              alt="Превью"
              className={isPreview ? 'w-20 h-20 object-cover rounded' : 'w-full max-w-xs object-cover rounded'}
              onError={(e) => {
                e.target.src = 'https://placehold.co/80x80';
                console.error('Ошибка загрузки изображения:', media.id, media.content?.image_url);
                toast.error(`Не удалось загрузить изображение ${media.id}`);
              }}
            />
            {!media.content?.image_url && (
              <p className="text-red-500 text-sm mt-1">Ошибка: URL изображения отсутствует</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div>
            <video
              src={media.content?.video_url || 'https://placehold.co/80x80'}
              controls
              className={isPreview ? 'w-20 h-20 object-cover rounded' : 'w-full max-w-xs object-cover rounded'}
              onError={(e) => {
                console.error('Ошибка воспроизведения видео:', media.id, media.content?.video_url);
                e.target.poster = 'https://placehold.co/80x80';
                toast.error(`Не удалось загрузить видео ${media.id}`);
              }}
            >
              <source src={media.content?.video_url} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
            {!media.content?.video_url && (
              <p className="text-red-500 text-sm mt-1">Ошибка: URL видео отсутствует</p>
            )}
          </div>
        );

      case 'music':
        return (
          <div>
            <audio
              controls
              className="w-full"
              src={media.content?.music_url || 'https://placehold.co/80x80'}
              onError={() => {
                console.error('Ошибка воспроизведения аудио:', media.id, media.content?.music_url);
                toast.error(`Не удалось загрузить аудио ${media.id}`);
              }}
            >
              Ваш браузер не поддерживает аудио.
            </audio>
            {!media.content?.music_url && (
              <p className="text-red-500 text-sm mt-1">Ошибка: URL аудио отсутствует</p>
            )}
          </div>
        );

      case 'text':
        return <p className="flex-1 truncate">{media.content?.text_content || 'Нет текста'}</p>;

      case 'map':
        return (
          <div className="flex-1">
            <p>Карта ({media.content?.map_points?.length || 0} точек)</p>
          </div>
        );

      default:
        return <p className="text-red-500">Неизвестный тип медиа: {effectiveType}</p>;
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-500 text-center bg-red-50 p-3 rounded-lg">{error}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleSelectType('text')}
          className={`p-2 rounded-lg flex items-center gap-2 ${
            selectedType === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-indigo-500 hover:text-white transition-all duration-200`}
          disabled={submitting}
        >
          <DocumentTextIcon className="w-5 h-5" />
          Текст
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('image')}
          className={`p-2 rounded-lg flex items-center gap-2 ${
            selectedType === 'image' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-indigo-500 hover:text-white transition-all duration-200`}
          disabled={submitting}
        >
          <PhotoIcon className="w-5 h-5" />
          Изображение
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('video')}
          className={`p-2 rounded-lg flex items-center gap-2 ${
            selectedType === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-indigo-500 hover:text-white transition-all duration-200`}
          disabled={submitting}
        >
          <VideoCameraIcon className="w-5 h-5" />
          Видео
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('music')}
          className={`p-2 rounded-lg flex items-center gap-2 ${
            selectedType === 'music' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-indigo-500 hover:text-white transition-all duration-200`}
          disabled={submitting}
        >
          <MusicalNoteIcon className="w-5 h-5" />
          Аудио
        </button>
        <button
          type="button"
          onClick={() => {
            handleSelectType('map');
            setIsMapModalOpen(true);
          }}
          className={`p-2 rounded-lg flex items-center gap-2 ${
            selectedType === 'map' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-indigo-500 hover:text-white transition-all duration-200`}
          disabled={submitting}
        >
          <MapIcon className="w-5 h-5" />
          Карта
        </button>
      </div>

      {selectedType === 'text' && (
        <div className="space-y-2">
          <textarea
            value={textContent}
            onChange={handleTextChange}
            placeholder="Введите текст..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={handleAddMedia}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
            disabled={submitting || !textContent.trim()}
          >
            Добавить текст
          </button>
        </div>
      )}

      {['image', 'video', 'music'].includes(selectedType) && (
        <div className="space-y-2">
          <input
            type="file"
            accept={
              selectedType === 'image'
                ? 'image/*'
                : selectedType === 'video'
                  ? 'video/*'
                  : 'audio/*'
            }
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              setFile(selectedFile);
              if (selectedType === 'image') {
                onImageSelect(e);
              } else {
                onFileSelect(e);
              }
            }}
            className="w-full p-3 border rounded-lg"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={handleAddMedia}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
            disabled={submitting || !file}
          >
            Добавить {selectedType === 'image' ? 'изображение' : selectedType === 'video' ? 'видео' : 'аудио'}
          </button>
        </div>
      )}

      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Добавленные медиа</h3>
          {mediaItems.map((media) => {
            let effectiveType = media.content_type || media.type || 'unknown';
            if (media.content?.image_url && media.content.image_url !== '') {
              effectiveType = 'image';
            } else if (media.content?.video_url && media.content.video_url !== '') {
              effectiveType = 'video';
            } else if (media.content?.music_url && media.content.music_url !== '') {
              effectiveType = 'music';
            } else if (media.content?.map_points && media.content.map_points.length > 0) {
              effectiveType = 'map';
            } else if (media.content?.text_content && media.content.text_content !== '') {
              effectiveType = 'text';
            }

            console.log('MediaEditor - рендеринг медиа:', JSON.stringify(media, null, 2));
            console.log('MediaEditor - эффективный тип медиа:', effectiveType);

            return (
              <div key={media.id} className="p-2 border rounded-lg">
                {editingMediaId === media.id && effectiveType === 'text' ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingTextContent}
                      onChange={(e) => setEditingTextContent(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={4}
                      disabled={submitting}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditMedia(media.id)}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
                        disabled={submitting || !editingTextContent.trim()}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
                        disabled={submitting}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {renderMediaItem(media, true)}
                    <div className="flex gap-2">
                      {effectiveType === 'text' && (
                        <button
                          type="button"
                          onClick={() => startEditing(media)}
                          className="text-blue-500 hover:text-blue-700"
                          disabled={submitting}
                        >
                          Редактировать
                        </button>
                      )}
                      {effectiveType === 'map' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedType('map');
                            setMapPoints(media.content?.map_points || []);
                            setIsMapModalOpen(true);
                            setEditingMediaId(media.id);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          disabled={submitting}
                        >
                          Редактировать
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(media.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={submitting}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isMapModalOpen && (
        <Modal
          isOpen={isMapModalOpen}
          onClose={() => {
            console.log('Закрытие модального окна карты, mapPoints:', mapPoints);
            setIsMapModalOpen(false);
            setSelectedType('');
            setMapPoints(initialMapPoints || []);
            setEditingMediaId(null);
          }}
        >
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">Выберите точки на карте</h3>
            <div
              ref={mapRef}
              className="w-full h-[400px] rounded-lg border"
              style={{ minHeight: '400px' }}
            />
            {mapPoints.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold">Выбранные точки:</h4>
                <ul className="list-disc pl-5">
                  {mapPoints.map((point, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span>
                        Широта: {point.lat.toFixed(4)}, Долгота: {point.lng.toFixed(4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePoint(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={submitting}
                      >
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  console.log('Сохранение карты с точками:', mapPoints);
                  handleAddMedia();
                  setIsMapModalOpen(false);
                }}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
                disabled={submitting || !mapPoints.length}
              >
                Сохранить карту
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Отмена карты, сброс точек');
                  setIsMapModalOpen(false);
                  setSelectedType('');
                  setMapPoints(initialMapPoints || []);
                  setEditingMediaId(null);
                }}
                className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

MediaEditor.propTypes = {
  mediableId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mediableType: PropTypes.string.isRequired,
  content: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onImageSelect: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  handleDeleteMedia: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  onEditorReady: PropTypes.func,
  onMapChange: PropTypes.func,
  onMediaChange: PropTypes.func.isRequired,
  initialMapPoints: PropTypes.arrayOf(PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  })),
  mediaItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    content_type: PropTypes.string,
    content: PropTypes.object,
    file_type: PropTypes.string,
    order: PropTypes.number,
  })).isRequired,
  setMediaItems: PropTypes.func.isRequired,
  isEdit: PropTypes.bool,
};

export default MediaEditor;