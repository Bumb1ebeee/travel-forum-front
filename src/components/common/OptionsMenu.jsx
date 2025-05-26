'use client';

import { useState } from 'react';
import styles from './OptionsMenu.module.css';

const OptionsMenu = ({ onReport, onUnsubscribe, onArchive, isJoined, isArchived }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleReportClick = () => {
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleArchiveClick = () => {
    if (onArchive) {
      onArchive();
    }
    setIsOpen(false);
  };

  const handleUnsubscribeClick = () => {
    onUnsubscribe();
    setIsOpen(false);
  };

  const handleSubmitReport = () => {
    if (reportReason.trim()) {
      onReport(reportReason);
      setIsModalOpen(false);
      setReportReason('');
    } else {
      alert('Пожалуйста, укажите причину жалобы.');
    }
  };

  return (
    <div className={styles.optionsMenu}>
      <button onClick={toggleMenu} className={styles.optionsButton}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z"
          />
        </svg>
      </button>
      {isOpen && (
        <div className={styles.optionsMenuContent}>
          {isJoined && !isArchived && (
            <button
              onClick={handleArchiveClick}
              className={styles.menuItem}
            >
              Архивировать
            </button>
          )}
          {isJoined && (
            <button
              onClick={handleUnsubscribeClick}
              className={styles.menuItem}
            >
              Отписаться
            </button>
          )}
          <button
            onClick={handleReportClick}
            className={styles.menuItem}
          >
            Пожаловаться
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Поясните причину жалобы</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className={styles.modalTextarea}
              rows="4"
              placeholder="Опишите причину жалобы..."
            />
            <div className={styles.modalButtons}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitReport}
                className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsMenu;