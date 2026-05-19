import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';
import '../css/SyncHistory.css';

const ChangeHistory = ({ showNotification }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchIin, setSearchIin] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (searchIin.trim()) {
        params.iin = searchIin.trim();
      }
      const res = await authFetch.get('/comparison/change-logs', { params });
      const data = res.data;

      if (Array.isArray(data)) {
        setLogs(data);
        setTotalCount(data.length);
      } else if (data.items) {
        setLogs(data.items);
        setTotalCount(data.totalCount || data.items.length);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории изменений:', err);
      showNotification?.('Ошибка загрузки истории изменений', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchIin, showNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="sync-history-container">
      <h2>📋 История изменений полей студентов</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
        Здесь отображаются все изменения, обнаруженные при сравнении данных ССО и ЕПВО.
      </p>

      <form onSubmit={handleSearch} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Поиск по ИИН..."
          value={searchIin}
          onChange={(e) => setSearchIin(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '0.9rem',
            width: '250px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Найти
        </button>
        {searchIin && (
          <button
            type="button"
            onClick={() => { setSearchIin(''); setPage(1); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Сбросить
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading-message">Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className="no-data-message">Нет данных об изменениях</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="sync-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ИИН</th>
                  <th>Поле</th>
                  <th>Старое значение (ЕПВО)</th>
                  <th>Новое значение (ССО)</th>
                  <th>Приоритет</th>
                  <th>Дата обнаружения</th>
                  <th>Сессия</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td style={{ fontFamily: 'monospace' }}>{log.iinPlt}</td>
                    <td><strong>{log.fieldName}</strong></td>
                    <td style={{ color: '#ef4444' }}>{log.oldValue || '—'}</td>
                    <td style={{ color: '#22c55e' }}>{log.newValue || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: log.dataSource === 'SSO' ? '#dbeafe' :
                                   log.dataSource === 'EPVO' ? '#fef3c7' : '#f3f4f6',
                        color: log.dataSource === 'SSO' ? '#1d4ed8' :
                               log.dataSource === 'EPVO' ? '#92400e' : '#374151'
                      }}>
                        {log.dataSource}
                      </span>
                    </td>
                    <td>{log.changedAt ? new Date(log.changedAt).toLocaleString('ru-RU') : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.syncSessionId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer' }}
            >
              ← Назад
            </button>
            <span style={{ padding: '0.4rem 0.8rem' }}>
              Страница {page} из {totalPages} ({totalCount} записей)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer' }}
            >
              Вперёд →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChangeHistory;
