'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from "@/pages/api/config";

export default function Setup2FA() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/2fa/setup`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setQrCode(response.data.qr_code);
        setSecret(response.data.secret);
      } catch (err) {
        setError('Ошибка загрузки QR-кода');
      }
    };
    fetchQRCode();
  }, []);

  const handleEnable2FA = async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/2fa/enable`,
        { two_factor_code: code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSuccess(response.data.message);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка включения 2FA');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">Настройка 2FA</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}
        {qrCode && (
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="QR Code"
            className="mx-auto mb-4"
          />
        )}
        <p className="text-center mb-4">Секрет: {secret}</p>
        <input
          type="text"
          placeholder="Введите код 2FA..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-6 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2"
        />
        <button
          onClick={handleEnable2FA}
          className="w-full p-3 text-white rounded-lg transition-colors main_button"
        >
          Включить 2FA
        </button>
      </div>
    </div>
  );
}