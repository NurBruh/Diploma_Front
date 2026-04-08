import React, { useState, useEffect, useCallback } from 'react';
import { MdRefresh, MdCloudUpload, MdSave, MdWarning, MdCheckCircle, MdError } from 'react-icons/md';
import AuthService from '../services/AuthService';
import '../css/SyncPreview.css';

const API_BASE_URL = 'http://localhost:5150/api';

const FILTER_OPTIONS = [
  { value: 'all',       label: 'Все' },
  { value: 'new',       label: 'Новые' },
  { value: 'duplicate', label: 'Дубликаты' },
];

const SyncPreview = ({ showNotification }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState('all');
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const token = AuthService.getToken();
      const res = await fetch(`${API_BASE_URL}/epvo-sso/sync-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      showNotification?.(`Не удалось загрузить предпросмотр: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const handleSaveToTemp = async () => {
    setSaving(true);
    try {
      const token = AuthService.getToken();
      const res = await fetch(`${API_BASE_URL}/epvo-sso/save-to-temp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const json = await res.json();
      showNotification?.(`Сохранено в TEMP: ${json.saved ?? json.message ?? 'OK'}`, 'success');
    } catch (err) {
      showNotification?.(`Ошибка сохранения: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToEpvo = async () => {
    if (!window.confirm('Отправить данные из TEMP в ЕПВО?')) return;
    setSending(true);
    try {
      const token = AuthService.getToken();
      const res = await fetch(`${API_BASE_URL}/epvo-sso/send-temp-to-epvo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const json = await res.json();
      showNotification?.(
        `Отправлено в ЕПВО. Успешно: ${json.success}, ошибок: ${json.errors}`,
        json.errors > 0 ? 'warning' : 'success'
      );
    } catch (err) {
      showNotification?.(`Ошибка отправки: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const displayedItems = data?.items?.filter(item => {
    if (filter === 'new')       return !item.isDuplicate;
    if (filter === 'duplicate') return item.isDuplicate;
    return true;
  }) ?? [];

  return (
    <div className="sync-preview">
      <div className="sync-preview__header">
        <h2 className="sync-preview__title">Предпросмотр синхронизации</h2>
        <div className="sync-preview__actions">
          <button
            className="sp-btn sp-btn--secondary"
            onClick={fetchPreview}
            disabled={loading}
          >
            <MdRefresh size={18} />
            Обновить
          </button>
          <button
            className="sp-btn sp-btn--primary"
            onClick={handleSaveToTemp}
            disabled={saving || loading || !data}
          >
            <MdSave size={18} />
            {saving ? 'Сохранение…' : 'Сохранить в TEMP'}
          </button>
          <button
            className="sp-btn sp-btn--success"
            onClick={handleSendToEpvo}
            disabled={sending || loading || !data}
          >
            <MdCloudUpload size={18} />
            {sending ? 'Отправка…' : 'Отправить в ЕПВО'}
          </button>
        </div>
      </div>

      {data && (
        <div className="sync-preview__stats">
          <div className="sp-stat sp-stat--total">
            <span className="sp-stat__value">{data.total}</span>
            <span className="sp-stat__label">Всего</span>
          </div>
          <div className="sp-stat sp-stat--new">
            <MdCheckCircle size={20} />
            <span className="sp-stat__value">{data.newCount}</span>
            <span className="sp-stat__label">Новых</span>
          </div>
          <div className="sp-stat sp-stat--dup">
            <MdWarning size={20} />
            <span className="sp-stat__value">{data.duplicateCount}</span>
            <span className="sp-stat__label">Дублей</span>
          </div>
        </div>
      )}

      <div className="sync-preview__filters">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`sp-filter-btn${filter === opt.value ? ' active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <div className="sync-preview__loading">Загрузка данных из КазНИТУ…</div>}

      {!loading && data && (
        <div className="sync-preview__table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ИИН</th>
                <th>ФИО</th>
                <th>Курс</th>
                <th>Тип оплаты</th>
                <th>Тип гранта</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="sp-table__empty">Нет записей</td>
                </tr>
              )}
              {displayedItems.map((item, idx) => (
                <tr key={item.iinPlt ?? idx} className={item.isDuplicate ? 'sp-row--dup' : 'sp-row--new'}>
                  <td>{idx + 1}</td>
                  <td className="sp-monospace">{item.iinPlt ?? '—'}</td>
                  <td>{item.fullName || '—'}</td>
                  <td>{item.courseNumber ?? '—'}</td>
                  <td>{item.paymentType ?? '—'}</td>
                  <td>{item.grantType ?? '—'}</td>
                  <td>
                    {item.isDuplicate ? (
                      <span className="sp-badge sp-badge--dup">
                        <MdWarning size={14} /> Дубль ({item.duplicateSource})
                      </span>
                    ) : (
                      <span className="sp-badge sp-badge--new">
                        <MdCheckCircle size={14} /> Новый
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !data && (
        <div className="sync-preview__empty">
          <MdError size={40} />
          <p>Нет данных. Нажмите «Обновить» для загрузки.</p>
        </div>
      )}
    </div>
  );
};

export default SyncPreview;
