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
                       initialMediaItems,
                       isEdit = false,
                     }) => {
  const [mediaItems, setMediaItems] = useState(initialMediaItems || []);
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
    },
    [onMediaChange]
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
    [memoizedOnMediaChange, onMapChange]
  );

  // Инициализация редактора
  useEffect(() => {
    console.log('MediaEditor mounted:', { mediableId, mediableType, isEdit });
    if (onEditorReady) {
      const editor = {
        chain: () => ({
          focus: () => ({
            insertContent: (content) => ({ run: () => console.log('Вставка контента:', content) }),
            deleteNode: (node) => ({ run: () => console.log('Удаление узла:', node) }),
          }),
        }),
        getHTML: () => content || '',
      };
      console.log('Инициализация редактора');
      onEditorReady(editor);
    }
  }, [onEditorReady, content]);

  // Синхронизация mediaItems с initialMediaItems
  useEffect(() => {
    console.log('Синхронизация initialMediaItems:', initialMediaItems);
    setMediaItems(initialMediaItems || []);
  }, [initialMediaItems]);

  // Загрузка медиа из API только при инициализации, если initialMediaItems пуст
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Токен авторизации отсутствует');
        }
        const mediableType = 'App\\Models\\Discussion';
        console.log('Отправка запроса на загрузку медиа:', {
          url: `${config.apiUrl}/media?mediable_id=${mediableId}&mediable_type=${encodeURIComponent(mediableType)}`,
          token: token.slice(0, 10) + '...',
        });
        const response = await axios.get(
          `${config.apiUrl}/media`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              mediable_id: mediableId,
              mediable_type: mediableType,
            },
          }
        );
        console.log('Полученные медиа:', JSON.stringify(response.data.media, null, 2));
        if (!response.data.media || response.data.media.length === 0) {
          console.warn('Медиа отсутствуют в ответе API');
          setMediaItems([]);
          memoizedOnMediaChange([]);
        } else {
          const fetchedMediaItems = response.data.media.map((item) => ({
            id: String(item.id),
            content_type: item.type,
            type: item.type,
            content: {
              file_id: item.content?.file_id ?? item.id,
              content_type: item.content?.content_type ?? item.type,
              order: item.content?.order ?? 0,
              image_url: item.content?.image_url ?? (item.type === 'image' ? 'https://placehold.co/80x80' : null),
              video_url: item.content?.video_url ?? null,
              music_url: item.content?.music_url ?? null,
              text_content: item.content?.text_content ?? (item.type === 'text' ? '' : null),
              map_points: item.content?.map_points ?? (item.type === 'map' ? [] : null),
            },
            file_type: item.file_type,
            order: item.order ?? 0,
          }));
          setMediaItems(fetchedMediaItems);
          memoizedOnMediaChange(fetchedMediaItems);
        }
      } catch (err) {
        console.error('Ошибка загрузки медиа:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        toast.error(err.response?.data?.message || 'Не удалось загрузить медиа');
      }
    };

    if (mediableId && isEdit && (!initialMediaItems || initialMediaItems.length === 0)) {
      fetchMedia();
    }
  }, [mediableId, isEdit, initialMediaItems, memoizedOnMediaChange]);

  // Инициализация карты
  const initMap = useCallback(() => {
    if (!ymapsRef.current || !mapRef.current) return;

    // Уничтожаем предыдущую карту, если она существует
    if (mapRef.current.mapInstance) {
      mapRef.current.mapInstance.destroy();
      mapRef.current.mapInstance = null;
    }

    const map = new ymapsRef.current.Map(
      mapRef.current,
      {
        center: mapPoints.length > 0
          ? [mapPoints[0].lat, mapPoints[0].lng]
          : [55.7558, 37.6173],
        zoom: 10,
        controls: ['zoomControl'],
      },
      {
        suppressMapOpenBlock: true,
      }
    );
    mapRef.current.mapInstance = map;

    // Храним placemarks для управления
    const placemarks = mapPoints.map((point) => {
      const placemark = new ymapsRef.current.Placemark(
        [point.lat, point.lng],
        {},
        { preset: 'islands#redDotIcon' }
      );
      map.geoObjects.add(placemark);
      return placemark;
    });

    // Обработчик клика для добавления точки
    map.events.add('click', (e) => {
      const coords = e.get('coords');
      const newPoint = { lat: coords[0], lng: coords[1] };
      setMapPoints((prev) => {
        const updatedPoints = [...prev, newPoint];
        const placemark = new ymapsRef.current.Placemark(
          coords,
          {},
          { preset: 'islands#redDotIcon' }
        );
        map.geoObjects.add(placemark);
        // Обновляем mediaItems
        updateMediaItemsWithMapPoints(updatedPoints);
        return updatedPoints;
      });
    });

    // Устанавливаем границы, если есть точки
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

    // Очистка карты при закрытии модального окна
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
      // Обновляем карту
      if (mapRef.current.mapInstance) {
        mapRef.current.mapInstance.geoObjects.removeAll();
        updatedPoints.forEach((point) => {
          const placemark = new ymapsRef.current.Placemark(
            [point.lat, point.lng],
            {},
            { preset: 'islands#redDotIcon' }
          );
          mapRef.current.mapInstance.geoObjects.add(placemark);
        });
        if (updatedPoints.length > 0) {
          mapRef.current.mapInstance.setBounds(
            updatedPoints.reduce(
              (bounds, point) => [
                [Math.min(bounds[0][0], point.lat), Math.min(bounds[0][1], point.lng)],
                [Math.max(bounds[1][0], point.lat), Math.max(bounds[1][1], point.lng)],
              ],
              [
                [updatedPoints[0].lat, updatedPoints[0].lng],
                [updatedPoints[0].lat, updatedPoints[0].lng],
              ]
            ),
            { checkZoomRange: true }
          );
        } else {
          mapRef.current.mapInstance.setCenter([55.7558, 37.6173], 10);
        }
      }
      // Обновляем mediaItems
      updateMediaItemsWithMapPoints(updatedPoints);
      return updatedPoints;
    });
  };

  const handleSelectType = (type) => {
    console.log('Выбор типа медиа:', type);
    setSelectedType(type);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    console.log('Изменение текста:', value);
    setTextContent(value);
  };

  const handleAddMedia = async () => {
    try {
      if (!mediableId) {
        throw new Error('mediableId не определен');
      }
      const mediableType = 'App\\Models\\Discussion'; // Фиксируем значение
      console.log('Отправка mediableType:', mediableType); // Логируем для отладки

      if (selectedType === 'text' && !textContent.trim()) {
        throw new Error('Текст не может быть пустым');
      }
      if (['image', 'video', 'music'].includes(selectedType) && !file) {
        throw new Error('Файл не выбран');
      }
      if (selectedType === 'map' && !mapPoints.length) {
        throw new Error('Не выбраны точки на карте');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации отсутствует');
      }

      let response;
      console.log('Отправка запроса для медиа:', {
        selectedType,
        mediableId,
        mediableType,
        mapPoints: selectedType === 'map' ? mapPoints : undefined,
      });

      if (selectedType === 'text') {
        response = await axios.post(
          `${config.apiUrl}/media`,
          {
            mediable_id: mediableId,
            mediable_type: mediableType,
            type: 'text',
            text_content: textContent,
            file_type: null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else if (['image', 'video', 'music'].includes(selectedType)) {
        const formData = new FormData();
        formData.append('mediable_id', mediableId);
        formData.append('mediable_type', mediableType);
        formData.append('type', selectedType);
        formData.append('file', file);
        formData.append('file_type', selectedType);

        response = await axios.post(
          `${config.apiUrl}/media`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else if (selectedType === 'map') {
        const payload = {
          mediable_id: mediableId,
          mediable_type: mediableType,
          type: 'map',
          map_points: mapPoints,
          file_type: null,
        };
        console.log('Payload для карты:', payload);

        if (editingMediaId) {
          response = await axios.patch(
            `${config.apiUrl}/media/${editingMediaId}`,
            {
              mediable_id: mediableId,
              mediable_type: mediableType, // Добавляем mediable_type
              map_points: mapPoints,
              type: 'map',
              file_type: null,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          response = await axios.post(
            `${config.apiUrl}/media`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
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

      console.log('Ответ /api/media:', response.data);
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
      toast.success(editingMediaId ? 'Карта обновлена' : 'Медиа добавлено');
    } catch (err) {
      console.error('Ошибка добавления медиа:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || 'Ошибка добавления медиа');
      toast.error(err.response?.data?.message || 'Ошибка добавления медиа');
    }
  };

  const handleEditMedia = async (mediaId) => {
    try {
      if (!editingTextContent.trim()) {
        throw new Error('Текст не может быть пустым');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      console.log('Обновление медиа:', { mediaId, text_content: editingTextContent });

      const response = await axios.patch(
        `${config.apiUrl}/media/${mediaId}`,
        {
          text_content: editingTextContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Ответ /api/media PATCH:', response.data);

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
      console.error('Ошибка обновления медиа:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
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
            console.log('Рендеринг медиа:', JSON.stringify(media, null, 2));
            return (
              <div key={media.id} className="p-2 border rounded-lg">
                {editingMediaId === media.id && (media.content_type === 'text' || media.type === 'text') ? (
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
                    {(media.content_type === 'text' || media.type === 'text') && (
                      <p className="flex-1 truncate">
                        {media.content?.text_content || 'Нет текста'}
                      </p>
                    )}
                    {(media.content_type === 'image' || media.type === 'image') && (
                      <img
                        src={media.content?.image_url || 'https://placehold.co/80x80'}
                        alt="Превью"
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/80x80';
                          console.error('Ошибка загрузки изображения:', media.id);
                        }}
                      />
                    )}
                    {(media.content_type === 'map' || media.type === 'map') && (
                      <div className="flex-1">
                        <p>Карта ({media.content?.map_points?.length || 0} точек)</p>
                      </div>
                    )}
                    {(media.content_type === 'text' || media.type === 'text') && (
                      <button
                        type="button"
                        onClick={() => startEditing(media)}
                        className="text-blue-500 hover:text-blue-700"
                        disabled={submitting}
                      >
                        Редактировать
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.id, media.file_type)}
                      className="text-red-500 hover:text-red-700"
                      disabled={submitting}
                    >
                      Удалить
                    </button>
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
            // Не сбрасываем mapPoints, чтобы сохранить изменения
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
                  setIsMapModalOpen(false);
                  handleAddMedia();
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
                  // Не сбрасываем mapPoints
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
  initialMapPoints: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number,
    })
  ),
  initialMediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      content_type: PropTypes.string,
      content: PropTypes.object,
      file_type: PropTypes.string,
      order: PropTypes.number,
    })
  ),
  isEdit: PropTypes.bool,
};

export default MediaEditor;