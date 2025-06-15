'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import Image from 'next/image';

export default function TwoFactorAuthForm({ user, submitting }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.two_factor_enabled || false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Загрузка QR-кода при включении 2FA
  const handleEnable2FA = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/2fa/setup`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки QR-кода');
    } finally {
      setLoading(false);
    }
  };

  // Подтверждение TOTP-кода для активации 2FA
  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/2fa/enable`,
        { two_factor_code: twoFactorCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess(response.data.message);
      setIs2FAEnabled(true);
      setQrCode('');
      setSecret('');
      setTwoFactorCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка активации 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Отключение 2FA
  const handleDisable2FA = async () => {
    if (!confirm('Вы уверены, что хотите отключить двухфакторную аутентификацию?')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/2fa/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Двухфакторная аутентификация отключена');
      setIs2FAEnabled(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка отключения 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-8">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Двухфакторная аутентификация</h3>
      {error && (
        <p className="text-red-500 text-center mb-4 bg-red-100 p-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-green-500 text-center mb-4 bg-green-100 p-3 rounded-lg">{success}</p>
      )}

      {is2FAEnabled ? (
        <div>
          <p className="text-gray-600 mb-4">Двухфакторная аутентификация включена.</p>
          <button
            onClick={handleDisable2FA}
            disabled={submitting || loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Отключить 2FA
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            Двухфакторная аутентификация не включена. Настройте её для повышения безопасности.
          </p>
          <button
            onClick={handleEnable2FA}
            disabled={submitting || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-4"
          >
            Включить 2FA
          </button>

          {qrCode && (
            <div className="mt-4">
              <p className="text-gray-600 mb-2">
                Отсканируйте QR-код с помощью приложения-аутентификатора (например, Google Authenticator):
              </p>
              <Image
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code"
                className="mx-auto mb-4 w-48 h-48"
              />
              <p className="text-gray-600 mb-2">Или введите секрет вручную: {secret}</p>
              <form onSubmit={handleConfirm2FA}>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Введите код 2FA"
                  className="mb-4 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Подтвердить 2FA
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}