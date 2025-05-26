'use client';

import axios from 'axios';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import config from '@/pages/api/config';
import FormHeader from './form/FormHeader';
import TitleInput from './form/TitleInput';
import CategorySelect from './form/CategorySelect';
import ActionButtons from './form/ActionButtons';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

const DescriptionEditor = dynamic(() => import('./form/MediaEditor'), {
  ssr: false,
});

const DiscussionForm = ({
                          isEdit = false,
                          categories = [],
                          setIsModalOpen,
                          submitting = false,
                          error = '',
                          editDiscussion = null,
                        }) => {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const editorRef = useRef(null);
  const [formError, setFormError] = useState(error);
  const [localCategories, setLocalCategories] = useState(categories);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState(null);
  const [draftId, setDraftId] = useState(
    isEdit && editDiscussion ? parseInt(editDiscussion.id, 10) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [mediaItems, setMediaItems] = useState([]);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const [discussionData, setDiscussionData] = useState(
    isEdit && editDiscussion
      ? {
        title: editDiscussion.title || '',
        description: editDiscussion.description || '',
        category_id: editDiscussion.category_id || '',
        map: Array.isArray(editDiscussion.map) ? editDiscussion.map : [],
        map_start: editDiscussion.map_start || [],
        map_end: editDiscussion.map_end || [],
        status: editDiscussion.status || 'pending',
        images: [],
        videos: [],
        audio: null,
        id: parseInt(editDiscussion.id, 10),
        is_draft: editDiscussion.is_draft ?? true,
      }
      : {
        title: '',
        description: '',
        category_id: '',
        map: [],
        map_start: [],
        map_end: [],
        status: 'pending',
        images: [],
        videos: [],
        audio: null,
        is_draft: true,
      }
  );

  // Инициализация mediaItems из editDiscussion.media
  useEffect(() => {
    if (isEdit && editDiscussion?.media) {
      console.log('Инициализация медиа:', JSON.stringify(editDiscussion.media, null, 2));
      const initialMediaItems = editDiscussion.media
        .filter((m) => m && m.id)
        .map((m) => ({
          id: String(m.id), // Используем только m.id
          content_type: m.file_type?.startsWith('image/')
            ? 'image'
            : m.file_type?.startsWith('video/')
              ? 'video'
              : m.file_type?.startsWith('audio/')
                ? 'music'
                : m.content?.map_points
                  ? 'map'
                  : 'text',
          content: {
            image_url: m.content?.image_url || '',
            video_url: m.content?.video_url || '',
            music_url: m.content?.music_url || '',
            text_content: m.content?.text_content || '',
            map_points: m.content?.map_points || [],
            file_id: m.content?.file_id || String(m.id),
          },
          file_type: m.file_type || '',
          order: m.order || 0,
        }));
      setMediaItems(initialMediaItems);
      setDiscussionData((prev) => ({
        ...prev,
        images: initialMediaItems
          .filter((m) => m.content_type === 'image')
          .map((m) => ({ url: m.content.image_url, mediaId: m.id })),
        videos: initialMediaItems
          .filter((m) => m.content_type === 'video')
          .map((m) => ({ url: m.content.video_url, mediaId: m.id })),
        audio: initialMediaItems.find((m) => m.content_type === 'music')
          ? { url: m.content.music_url, mediaId: m.id }
          : null,
        map: initialMediaItems.find((m) => m.content_type === 'map')?.content.map_points || [],
      }));
    }
  }, [isEdit, editDiscussion]);

  // Загрузка категорий
  useEffect(() => {
    if (!categories.length) {
      const fetchCategories = async () => {
        try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(`${config.apiUrl}/categories`, { headers });
          const fetchedCategories = response.data.categories || response.data;
          setLocalCategories(fetchedCategories);
          if (fetchedCategories.length > 0 && !discussionData.category_id) {
            setDiscussionData((prev) => ({
              ...prev,
              category_id: fetchedCategories[0].id,
            }));
          }
        } catch (err) {
          console.error('Ошибка загрузки категорий:', err);
          setFormError('Не удалось загрузить категории');
          toast.error('Не удалось загрузить категории');
        }
      };
      fetchCategories();
    }
  }, [categories]);

  // Обновление ошибки
  useEffect(() => {
    if (error) setFormError(error);
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Изменение поля:', { name, value });
    setDiscussionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = useCallback(
    debounce((html) => {
      console.log('Обновление описания:', html);
      setDiscussionData((prev) => ({
        ...prev,
        description: html,
      }));
    }, 300),
    []
  );

  const handleMapChange = (mapPoints) => {
    console.log('Обновление точек карты:', mapPoints);
    setDiscussionData((prev) => ({
      ...prev,
      map: mapPoints,
    }));
    setMediaItems((prev) => {
      const mapItem = prev.find((item) => item.content_type === 'map');
      if (mapItem) {
        return prev.map((item) =>
          item.content_type === 'map'
            ? { ...item, content: { ...item.content, map_points: mapPoints } }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `temp-map-${Date.now()}`,
          content_type: 'map',
          content: { map_points: mapPoints },
          file_type: null,
          order: prev.length,
        },
      ];
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Выбрано изображение:', file);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Выбран файл:', file);
      handleFileUpload(file);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      console.log('Deleting media with ID:', mediaId);
      const discussionId = draftId || discussionData.id;
      if (!discussionId) {
        console.warn('ID обсуждения не определён');
        toast.error('Не удалось определить ID обсуждения');
        return;
      }
      // Проверка существования медиа
      console.log('Fetching media for discussion:', discussionId);
      const { data } = await axios.get(`/api/media?mediable_id=${discussionId}&mediable_type=App\\Models\\Discussion`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Media response:', JSON.stringify(data.media, null, 2));
      const mediaExists = data.media.find((item) => item.id === parseInt(mediaId));
      if (!mediaExists) {
        console.warn('Медиа не найдено:', mediaId);
        toast.warn('Медиа не найдено в базе данных');
        return; // Не обновляем mediaItems
      }
      await axios.delete(`/api/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // Обновить mediaItems после успешного удаления
      const updatedMedia = data.media.filter((item) => item.id !== parseInt(mediaId));
      setMediaItems(updatedMedia.map((m) => ({
        id: String(m.id),
        content_type: m.type,
        content: {
          image_url: m.content?.image_url || '',
          video_url: m.content?.video_url || '',
          music_url: m.content?.music_url || '',
          text_content: m.content?.text_content || '',
          map_points: m.content?.map_points || [],
          file_id: m.content?.file_id || String(m.id),
        },
        file_type: m.file_type || '',
        order: m.order || 0,
      })));
      toast.success('Медиа удалено');
    } catch (err) {
      console.error('Ошибка удаления медиа:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Ошибка удаления медиа');
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropConfig = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(cropConfig);
  };

  const getCroppedImage = async () => {
    if (!crop || !imgRef.current) {
      console.error('Нет данных обрезки или изображения');
      return null;
    }
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            resolve(file);
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        0.8
      );
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedFile = await getCroppedImage();
      if (!croppedFile) {
        setFormError('Не удалось обработать изображение');
        toast.error('Не удалось обработать изображение');
        return;
      }
      await handleFileUpload(croppedFile);
      setIsCropModalOpen(false);
      setSelectedImage(null);
      setCrop(null);
    } catch (err) {
      console.error('Ошибка сохранения обрезки:', err);
      setFormError('Ошибка при сохранении изображения: ' + (err.message || 'Неизвестная ошибка'));
      toast.error('Ошибка при сохранении изображения');
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      console.log('Загрузка файла:', { name: file.name, type: file.type, size: file.size });

      let discussionId = draftId || discussionData.id;
      if (!discussionId) {
        if (!discussionData.title || !discussionData.category_id) {
          throw new Error('Заполните заголовок и категорию перед загрузкой медиа');
        }
        const draftResponse = await handleSaveDraft();
        discussionId = parseInt(draftResponse.draft?.id || draftResponse.data?.id, 10);
        await new Promise((resolve) => setTimeout(resolve, 0));
        setDraftId(discussionId);
        setDiscussionData((prev) => ({
          ...prev,
          id: discussionId,
          is_draft: true,
        }));
      }

      console.log('Загрузка медиа для discussionId:', discussionId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediable_type', 'App\\Models\\Discussion');
      formData.append('mediable_id', discussionId);
      formData.append('type', file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'music');

      const response = await axios.post(`${config.apiUrl}/media`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Медиа загружено:', response.data);
      const newMedia = {
        id: response.data.media.id,
        content_type: response.data.media.type,
        type: response.data.media.type,
        content: response.data.media.content,
        file_type: response.data.media.file_type,
        order: mediaItems.length,
      };
      setMediaItems((prev) => [...prev, newMedia]);
      toast.success('Медиа загружено');
    } catch (err) {
      console.error('Ошибка загрузки медиа:', {
        message: err.message,
        response: err.response?.data,
      });
      setFormError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const saveDraft = async () => {
    try {
      setIsSaving(true);
      console.log('Вызов saveDraft:', new Date().toISOString());
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');
      if (!discussionData.title || !discussionData.category_id) {
        throw new Error('Заполните заголовок и категорию');
      }
      const currentDescription = editorRef.current ? editorRef.current.getHTML() : discussionData.description;
      const payload = {
        title: discussionData.title,
        category_id: parseInt(discussionData.category_id, 10),
        description: currentDescription || '',
        map: discussionData.map || [],
        map_start: discussionData.map_start || [],
        map_end: discussionData.map_end || [],
        status: discussionData.status || 'pending',
      };
      let response;
      let discussionId = draftId || discussionData.id;
      console.log('Сохранение черновика:', { discussionId, isEdit, payload });
      if (discussionId && isEdit) {
        response = await axios.put(`${config.apiUrl}/discussions/${discussionId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        });
      } else {
        response = await axios.post(`${config.apiUrl}/drafts`, payload, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        });
      }
      console.log('Ответ API /drafts:', response.data);
      if (!response.data) {
        throw new Error('Ответ сервера пустой');
      }
      const draftData = response.data.draft || response.data.data || response.data;
      if (!draftData || !draftData.id) {
        throw new Error('Некорректный формат ответа: отсутствует draft или id');
      }
      discussionId = parseInt(draftData.id, 10);
      setDraftId(discussionId);
      setDiscussionData((prev) => ({
        ...prev,
        id: discussionId,
        is_draft: true,
      }));
      setFormError('');
      toast.success('Черновик сохранён');
      return { draft: draftData };
    } catch (err) {
      console.error('Ошибка сохранения черновика:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = useCallback(() => {
    saveDraft().catch((err) => {
      console.error('Ошибка в saveDraft:', err);
    });
  }, [draftId, discussionData, isEdit, editorRef]);

  const handleNextStep = async () => {
    try {
      if (draftId && isEdit) {
        console.log('Используем существующий draftId:', draftId);
        setStep(2);
        return;
      }
      const draftResponse = await saveDraft();
      console.log('draftResponse в handleNextStep:', draftResponse);
      if (!draftResponse || !draftResponse.draft) {
        throw new Error('Не удалось сохранить черновик: некорректный ответ сервера');
      }
      const discussionId = parseInt(draftResponse.draft.id, 10);
      setDraftId(discussionId);
      setStep(2);
    } catch (err) {
      console.error('Ошибка перехода к следующему шагу:', err);
      setFormError(err.message);
      toast.error(err.message);
    }
  };

  const handlePublish = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      if (!discussionData.title || !discussionData.category_id) {
        throw new Error('Заполните заголовок и категорию');
      }

      let discussionId = draftId || discussionData.id;
      if (!discussionId) {
        const draftResponse = await handleSaveDraft();
        discussionId = parseInt(draftResponse.draft?.id, 10);
      }

      const payload = {
        title: discussionData.title,
        category_id: parseInt(discussionData.category_id, 10),
        description: editorRef.current ? editorRef.current.getHTML() : discussionData.description || '',
        map: discussionData.map || [],
        map_start: discussionData.map_start || [],
        map_end: discussionData.map_end || [],
        status: discussionData.status || 'pending',
        publish: true,
      };

      const response = await axios.put(`${config.apiUrl}/discussions/${discussionId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      setFormError('');
      setIsModalOpen(false);
      toast.success('Обсуждение опубликовано');
    } catch (err) {
      console.error('Ошибка публикации:', err);
      let errorMessage = err.response?.data?.message || err.message || 'Ошибка публикации';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draftId && !discussionData.id) {
      setFormError('Нет черновика или обсуждения для удаления');
      toast.error('Нет черновика или обсуждения для удаления');
      return;
    }
    if (!confirm(`Вы уверены, что хотите удалить ${discussionData.is_draft ? 'черновик' : 'обсуждение'}?`)) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      const id = draftId || discussionData.id;
      await axios.delete(`${config.apiUrl}/discussions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      setFormError('');
      setIsModalOpen(false);
      toast.success(discussionData.is_draft ? 'Черновик удалён' : 'Обсуждение удалено');
    } catch (err) {
      console.error('Ошибка удаления:', err);
      let errorMessage = err.response?.data?.message || err.message || 'Ошибка удаления';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraftAndClose = async () => {
    try {
      await saveDraft();
      if (setIsModalOpen) {
        setIsModalOpen(false);
      } else {
        console.warn('setIsModalOpen не передан в DiscussionForm');
      }
    } catch (error) {
      console.error('Ошибка сохранения черновика и закрытия:', error);
      toast.error('Не удалось сохранить черновик');
    }
  };

  const onClose = () => {
    if (setIsModalOpen) {
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  if (!editDiscussion && isEdit) {
    return <div className="text-center text-gray-500">Загрузка данных...</div>;
  }

  if (!localCategories.length) {
    return <div className="text-center text-gray-500">Загрузка категорий...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
        <FormHeader isEdit={isEdit} isDraft={discussionData.is_draft} />

        {formError && (
          <p className="text-red-500 mb-6 text-center font-medium bg-red-50 p-3 rounded-lg">
            {formError}
          </p>
        )}
        {(isSaving || isUploading) && (
          <p className="text-center text-gray-500 mb-4">
            {isSaving ? 'Сохранение...' : 'Загрузка медиа...'}
          </p>
        )}

        <form className="space-y-6">
          {step === 1 && (
            <>
              <TitleInput
                value={discussionData.title}
                onChange={handleChange}
                error={formError}
                submitting={submitting || isSaving || isUploading}
              />
              <CategorySelect
                categories={localCategories}
                value={discussionData.category_id}
                onChange={handleChange}
                error={formError}
                submitting={submitting || isSaving || isUploading}
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={submitting || isSaving || isUploading || !discussionData.title || !discussionData.category_id}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md font-semibold disabled:bg-gray-400"
                >
                  Далее
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md font-semibold"
                >
                  Отмена
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <DescriptionEditor
                draftId={draftId}
                mediableId={draftId}
                mediableType="App\\Models\\Discussion"
                content={discussionData.description}
                onChange={handleDescriptionChange}
                onImageSelect={handleImageSelect}
                onFileSelect={handleFileSelect}
                handleDeleteMedia={handleDeleteMedia}
                submitting={submitting || isUploading}
                onEditorReady={(editor) => {
                  console.log('Редактор инициализирован');
                  editorRef.current = editor;
                  setIsEditorReady(true);
                }}
                onMapChange={handleMapChange}
                onMediaChange={setMediaItems}
                initialMapPoints={discussionData.map}
                initialMediaItems={mediaItems}
                isEdit={isEdit}
              />
              <ActionButtons
                onSaveDraft={handleSaveDraftAndClose}
                onPublish={handlePublish}
                onDelete={handleDelete}
                onCancel={handleCancel}
                submitting={submitting || isSaving || isUploading}
                hasId={!!discussionData.id}
              />
            </>
          )}
        </form>

        {isCropModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Редактировать изображение</h3>
              {selectedImage ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCrop(c)}
                  aspect={16 / 9}
                >
                  <img
                    ref={imgRef}
                    src={selectedImage}
                    alt="Предпросмотр обрезки"
                    onLoad={onImageLoad}
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
              ) : (
                <p className="text-red-500">Ошибка загрузки изображения</p>
              )}
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleCropSave}
                  disabled={!crop || !imgRef.current || isSaving || isUploading}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md font-semibold disabled:bg-gray-400"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCropModalOpen(false);
                    setSelectedImage(null);
                    setCrop(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md font-semibold"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DiscussionForm.propTypes = {
  isEdit: PropTypes.bool,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  setIsModalOpen: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  editDiscussion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    description: PropTypes.string,
    category_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    map: PropTypes.arrayOf(
      PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      })
    ),
    map_start: PropTypes.array,
    map_end: PropTypes.array,
    status: PropTypes.string,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        file_type: PropTypes.string,
        content: PropTypes.shape({
          image_url: PropTypes.string,
          video_url: PropTypes.string,
          music_url: PropTypes.string,
          file_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          url: PropTypes.string,
        }),
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    is_draft: PropTypes.bool,
  }),
};

export default DiscussionForm;