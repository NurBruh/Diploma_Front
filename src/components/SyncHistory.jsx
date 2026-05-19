import React, { useState, useEffect, useCallback } from 'react';
import { MdRefresh, MdCheckCircle, MdError, MdHourglassEmpty } from 'react-icons/md';
import { authFetch } from '../utils/authFetch';
import '../css/SyncHistory.css';


const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { value: '',        label: 'Все' },
  { value: 'Success', label: 'Успешно' },
  { value: 'Error',   label: 'Ошибка' },
  { value: 'Pending', label: 'В ожидании' },
];

const StatusBadge = ({ status }) => {
  const map = {
    Success: { icon: <MdCheckCircle size={14} />, cls: 'sh-badge--success', label: 'Успешно' },
    Error:   { icon: <MdError size={14} />,       cls: 'sh-badge--error',   label: 'Ошибка' },
    Pending: { icon: <MdHourglassEmpty size={14} />, cls: 'sh-badge--pending', label: 'В ожидании' },
  };
  const info = map[status] ?? { icon: null, cls: 'sh-badge--unknown', label: status ?? '—' };
  return (
    <span className={`sh-badge ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

const SyncHistory = ({ showNotification }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(1);

  const fetchHistory = useCallback(async (p, s) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:     String(p ?? page),
        pageSize: String(PAGE_SIZE),
      });
      if ((s ?? status)) params.set('status', s ?? status);

      const res = await authFetch.get(`/epvo-sso/sync-logs?${params}`);
      setData(res.data);
    } catch (err) {
      showNotification?.(`Не удалось загрузить историю: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, showNotification]);

  useEffect(() => { fetchHistory(1, status); }, []);

  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(1);
    fetchHistory(1, val);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchHistory(newPage, status);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const logs = data?.logs ?? [];

  const formatDate = (raw) => {
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return raw; }
  };

  return (
    <div className="sync-history">
      <div className="sync-history__header">
        <h2 className="sync-history__title">История синхронизации</h2>
        <button
          className="sh-btn sh-btn--secondary"
          onClick={() => fetchHistory(page, status)}
          disabled={loading}
        >
          <MdRefresh size={18} />
          Обновить
        </button>
      </div>

      <div className="sync-history__filters">
        {STATUS_FILTERS.map(opt => (
          <button
            key={opt.value}
            className={`sh-filter-btn${status === opt.value ? ' active' : ''}`}
            onClick={() => handleStatusChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        {data && (
          <span className="sh-total-label">Найдено: {data.total}</span>
        )}
      </div>

      {loading && <div className="sync-history__loading">Загрузка…</div>}

      {!loading && (
        <>
          <div className="sync-history__table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ИИН</th>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Кто запустил</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="sh-table__empty">Записей не найдено</td>
                  </tr>
                )}
                {logs.map((log, idx) => (
                  <tr key={log.id ?? idx}>
                    <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="sh-monospace">{log.iinPlt ?? '—'}</td>
                    <td className="sh-date">{formatDate(log.sentAt)}</td>
                    <td><StatusBadge status={log.status} /></td>
                    <td>{log.triggeredBy ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="sh-pagination">
              <button
                className="sh-page-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ← Назад
              </button>
              <span className="sh-page-info">Стр. {page} / {totalPages}</span>
              <button
                className="sh-page-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SyncHistory;
