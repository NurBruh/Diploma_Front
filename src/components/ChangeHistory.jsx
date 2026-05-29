import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';
import '../css/ChangeHistory.css';

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

  const getSourceBadgeClass = (source) => {
    if (source === 'SSO') return 'change-history__source-badge change-history__source-badge--sso';
    if (source === 'EPVO') return 'change-history__source-badge change-history__source-badge--epvo';
    return 'change-history__source-badge change-history__source-badge--default';
  };

  return (
    <div className="change-history">
      <h2 className="change-history__title">История изменений полей студентов</h2>
      <p className="change-history__subtitle">
        Здесь отображаются все изменения, обнаруженные при сравнении данных ССО и ЕПВО.
      </p>

      <form onSubmit={handleSearch} className="change-history__search-form">
        <input
          type="text"
          placeholder="Поиск по ИИН..."
          value={searchIin}
          onChange={(e) => setSearchIin(e.target.value)}
          className="change-history__search-input"
        />
        <button type="submit" className="change-history__search-btn">
          Найти
        </button>
        {searchIin && (
          <button
            type="button"
            onClick={() => { setSearchIin(''); setPage(1); }}
            className="change-history__reset-btn"
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
          <div className="change-history__table-wrap">
            <table className="change-history__table">
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
                    <td className="change-history__iin">{log.iinPlt}</td>
                    <td><strong>{log.fieldName}</strong></td>
                    <td className="change-history__old-value">{log.oldValue || '—'}</td>
                    <td className="change-history__new-value">{log.newValue || '—'}</td>
                    <td>
                      <span className={getSourceBadgeClass(log.dataSource)}>
                        {log.dataSource}
                      </span>
                    </td>
                    <td>{log.changedAt ? new Date(log.changedAt).toLocaleString('ru-RU') : '—'}</td>
                    <td className="change-history__session-id">{log.syncSessionId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="change-history__pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="change-history__page-btn"
            >
              ← Назад
            </button>
            <span className="change-history__page-info">
              Страница {page} из {totalPages} ({totalCount} записей)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="change-history__page-btn"
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
