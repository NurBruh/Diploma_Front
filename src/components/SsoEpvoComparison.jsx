import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MdSync, MdRefresh, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';
import { API_BASE_URL } from '../services';
import AuthService from '../services/AuthService';
import '../css/SsoEpvoComparison.css';

const FIELD_LABELS = {
  firstName: 'Имя',
  lastName: 'Фамилия',
  middleName: 'Отчество',
  faculty: 'Институт',
  speciality: 'Специальность',
  course: 'Курс',
  grantName: 'Тип гранта',
  grantAmount: 'Сумма гранта',
  scholarshipName: 'Стипендия',
  scholarshipAmount: 'Сумма стипендии',
  scholarshipNotes: 'Примечания',
  iban: 'IBAN',
  isActive: 'Активен',
};

const TABLE_COLUMNS = [
  { key: 'lastName', label: 'Фамилия' },
  { key: 'firstName', label: 'Имя' },
  { key: 'middleName', label: 'Отчество' },
  { key: 'iin', label: 'ИИН', accessor: 'iin' },
  { key: 'faculty', label: 'Институт' },
  { key: 'speciality', label: 'Специальность' },
  { key: 'course', label: 'Курс' },
  { key: 'grantName', label: 'Тип гранта' },
  { key: 'grantAmount', label: 'Сумма гранта' },
  { key: 'scholarshipName', label: 'Стипендия' },
  { key: 'scholarshipAmount', label: 'Сумма стипендии' },
  { key: 'scholarshipNotes', label: 'Примечания' },
  { key: 'iban', label: 'IBAN', accessor: 'iban' },
  { key: 'isActive', label: 'Активен' },
];

const PAGE_SIZE = 50;

const SsoEpvoComparison = ({ onSyncToEpvo, syncLoading, showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [syncingIIN, setSyncingIIN] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ssoScrollRef = useRef(null);
  const epvoScrollRef = useRef(null);
  const scrollingRef = useRef(null);

  // Синхронизация горизонтального скролла
  const handleSsoScroll = useCallback(() => {
    if (scrollingRef.current === 'epvo') return;
    scrollingRef.current = 'sso';
    if (epvoScrollRef.current && ssoScrollRef.current) {
      epvoScrollRef.current.scrollLeft = ssoScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { scrollingRef.current = null; });
  }, []);

  const handleEpvoScroll = useCallback(() => {
    if (scrollingRef.current === 'sso') return;
    scrollingRef.current = 'epvo';
    if (ssoScrollRef.current && epvoScrollRef.current) {
      ssoScrollRef.current.scrollLeft = epvoScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { scrollingRef.current = null; });
  }, []);

  const fetchComparison = useCallback(async (page, filterVal) => {
    const p = page ?? currentPage;
    const f = filterVal ?? filter;
    setLoading(true);
    try {
      const token = AuthService.getToken();
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        filter: f,
      });
      const response = await fetch(`${API_BASE_URL}/Epvo/compare?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const json = await response.json();
      // Если сервер уже поддерживает серверную пагинацию
      if (json.page !== undefined && json.totalPages !== undefined) {
        setData(json);
        setCurrentPage(json.page);
      } else {
        // Fallback: сервер отдал всё — режем на клиенте
        const allItems = json.items || [];
        const totalItems = allItems.length;
        const countDiff = allItems.filter(i => i.hasDifferences).length;
        const countSsoOnly = allItems.filter(i => i.onlyInSso).length;
        const countEpvoOnly = allItems.filter(i => i.onlyInEpvo).length;
        const countOk = allItems.filter(i => !i.hasDifferences && !i.onlyInSso && !i.onlyInEpvo).length;

        let filtered = allItems;
        if (f === 'diff') filtered = allItems.filter(i => i.hasDifferences);
        else if (f === 'sso-only') filtered = allItems.filter(i => i.onlyInSso);
        else if (f === 'epvo-only') filtered = allItems.filter(i => i.onlyInEpvo);

        filtered.sort((a, b) => {
          const nameA = (a.ssoData?.lastName || a.epvoData?.lastName || '').trim();
          const nameB = (b.ssoData?.lastName || b.epvoData?.lastName || '').trim();
          return nameA.localeCompare(nameB, ['kk', 'ru'], { sensitivity: 'base' });
        });

        const filteredCount = filtered.length;
        const tp = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
        const safePage = Math.min(p, tp);
        const sliced = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        setData({
          items: sliced,
          totalItems,
          totalDifferences: countDiff,
          onlyInSso: countSsoOnly,
          onlyInEpvo: countEpvoOnly,
          totalOk: countOk,
          filteredCount,
          page: safePage,
          pageSize: PAGE_SIZE,
          totalPages: tp,
        });
        setCurrentPage(safePage);
      }
    } catch (e) {
      showNotification && showNotification('Ошибка при загрузке данных сравнения', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, showNotification]);

  const handleSyncAll = async () => {
    await onSyncToEpvo();
    await fetchComparison(1, filter);
  };

  const syncStudent = async (iin) => {
    setSyncingIIN(iin);
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${API_BASE_URL}/Epvo/sync-student/${iin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      const result = await response.json();
      showNotification && showNotification(`${result.message}`, 'success');
      await fetchComparison(currentPage, filter);
    } catch (e) {
      showNotification && showNotification(' Ошибка при синхронизации студента', 'error');
    } finally {
      setSyncingIIN(null);
    }
  };

  useEffect(() => {
    fetchComparison(1, 'all');
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    fetchComparison(1, newFilter);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchComparison(newPage, filter);
  };

  const isDiffField = (item, field) =>
    item.differences && item.differences.some(d => d.field === field);

  const getCellValue = (dataObj, col) => {
    if (!dataObj) return '—';
    const key = col.accessor || col.key;
    const val = dataObj[key];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Да' : 'Нет';
    return String(val);
  };

  const pageItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const safePage = data?.page ?? 1;
  const filteredCount = data?.filteredCount ?? 0;

  const Pagination = () => (
    <div className="pagination-row">
      <button className="page-btn" onClick={() => handlePageChange(1)} disabled={safePage === 1}>«</button>
      <button className="page-btn" onClick={() => handlePageChange(Math.max(1, safePage - 1))} disabled={safePage === 1}>‹</button>
      <span className="page-info">
        Стр. <strong>{safePage}</strong> / <strong>{totalPages}</strong>
        &nbsp;·&nbsp;
        Показано {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredCount)} из <strong>{filteredCount}</strong>
      </span>
      <button className="page-btn" onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}>›</button>
      <button className="page-btn" onClick={() => handlePageChange(totalPages)} disabled={safePage === totalPages}>»</button>
    </div>
  );

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <div className="comparison-title-row">
          <h2 className="comparison-title">Сравнение данных: ССО vs ЕПВО</h2>
          <div className="comparison-actions">
            <button className="icon-btn-sm" onClick={() => fetchComparison(currentPage, filter)} disabled={loading}>
              <MdRefresh size={18} />
              Обновить
            </button>
            <button
              className={`icon-btn-sm sync-btn${syncLoading ? ' syncing' : ''}`}
              onClick={handleSyncAll}
              disabled={syncLoading}
            >
              <MdSync size={18} className={syncLoading ? 'spin' : ''} />
              {syncLoading ? 'Синхронизация...' : 'Синхр. всех в ЕПВО'}
            </button>
          </div>
        </div>

        {data && (
          <div className="comparison-stats">
            <div className="cstat cstat-total">
              <span className="cstat-num">{data.totalItems}</span>
              <span className="cstat-label">Всего студентов</span>
            </div>
            <div className="cstat cstat-diff">
              <MdWarning size={16} />
              <span className="cstat-num">{data.totalDifferences}</span>
              <span className="cstat-label">С различиями</span>
            </div>
            <div className="cstat cstat-sso">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInSso}</span>
              <span className="cstat-label">Новые записи в SSO</span>
            </div>
            {/* <div className="cstat cstat-epvo">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInEpvo}</span>
              <span className="cstat-label">Только в ЕПВО</span>
            </div> */}
            <div className="cstat cstat-ok">
              <MdCheckCircle size={16} />
              <span className="cstat-num">{data.totalOk}</span>
              <span className="cstat-label">Совпадают</span>
            </div>
          </div>
        )}

        <div className="comparison-filters">
          {[
            { key: 'all', label: 'Все' },
            { key: 'diff', label: 'С различиями' },
            { key: 'sso-only', label: 'Новые записи' },

          ].map(f => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? ' active' : ''}`}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="comparison-loading">Загрузка данных...</div>
      ) : pageItems.length === 0 ? (
        <div className="comparison-empty">
          <MdCheckCircle size={48} color="var(--success-color)" />
          <p>Нет записей для отображения</p>
        </div>
      ) : (
        <>
          <Pagination />
          <div className="comparison-dual-tables">
          {/* Таблица ССО (Посредник) */}
          <div className="comparison-table-block">
            <div className="table-block-header sso-header">
              <h3>ССО (Посредник)</h3>
              <span className="table-count">{pageItems.filter(i => i.ssoData).length} / {filteredCount} записей</span>
            </div>
            <div className="table-scroll-wrapper" ref={ssoScrollRef} onScroll={handleSsoScroll}>
              <table className="comparison-data-table">
                <thead>
                  <tr>
                    <th className="col-action">Действие</th>
                    <th className="col-status">Статус</th>
                    {TABLE_COLUMNS.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => {
                    const hasDiff = item.hasDifferences;
                    const onlyInSso = item.onlyInSso;
                    const onlyInEpvo = item.onlyInEpvo;
                    const rowClass = onlyInSso
                      ? 'row-only-sso'
                      : onlyInEpvo
                        ? 'row-only-epvo'
                        : hasDiff
                          ? 'row-has-diff'
                          : '';

                    return (
                      <tr key={item.iin} className={rowClass}>
                        <td className="col-action">
                          {(hasDiff || onlyInSso) && (
                            <button
                              className="sync-student-btn"
                              onClick={() => syncStudent(item.iin)}
                              disabled={syncingIIN === item.iin}
                              title="Синхронизировать в ЕПВО"
                            >
                              <MdSync size={14} className={syncingIIN === item.iin ? 'spin' : ''} />
                            </button>
                          )}
                        </td>
                        <td className="col-status">
                          {onlyInSso && <span className="status-badge badge-sso">Новый</span>}
                          {onlyInEpvo && <span className="status-badge badge-epvo">Нет в ССО</span>}
                          {hasDiff && <span className="status-badge badge-diff">{item.differences.length} разл.</span>}
                          {!onlyInSso && !onlyInEpvo && !hasDiff && (
                            <span className="status-badge badge-ok">OK</span>
                          )}
                        </td>
                        {TABLE_COLUMNS.map(col => {
                          const diff = isDiffField(item, col.key);
                          return (
                            <td
                              key={col.key}
                              className={diff ? 'cell-diff-sso' : onlyInSso ? 'cell-new' : ''}
                            >
                              {item.ssoData ? getCellValue(item.ssoData, col) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Таблица ЕПВО */}
          <div className="comparison-table-block">
            <div className="table-block-header epvo-header-block">
              <h3>ЕПВО</h3>
              <span className="table-count">{pageItems.filter(i => i.epvoData).length} / {filteredCount} записей</span>
            </div>
            <div className="table-scroll-wrapper" ref={epvoScrollRef} onScroll={handleEpvoScroll}>
              <table className="comparison-data-table">
                <thead>
                  <tr>
                    <th className="col-status">Статус</th>
                    {TABLE_COLUMNS.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => {
                    const hasDiff = item.hasDifferences;
                    const onlyInSso = item.onlyInSso;
                    const onlyInEpvo = item.onlyInEpvo;
                    const rowClass = onlyInSso
                      ? 'row-only-sso'
                      : onlyInEpvo
                        ? 'row-only-epvo'
                        : hasDiff
                          ? 'row-has-diff'
                          : '';

                    return (
                      <tr key={item.iin} className={rowClass}>
                        <td className="col-status">
                          {onlyInSso && <span className="status-badge badge-sso">Нет в ЕПВО</span>}
                          {onlyInEpvo && <span className="status-badge badge-epvo">Только тут</span>}
                          {hasDiff && <span className="status-badge badge-diff">Устарело</span>}
                          {!onlyInSso && !onlyInEpvo && !hasDiff && (
                            <span className="status-badge badge-ok">OK</span>
                          )}
                        </td>
                        {TABLE_COLUMNS.map(col => {
                          const diff = isDiffField(item, col.key);
                          return (
                            <td
                              key={col.key}
                              className={diff ? 'cell-diff-epvo' : onlyInEpvo ? 'cell-epvo-only' : ''}
                            >
                              {item.epvoData ? getCellValue(item.epvoData, col) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
};

export default SsoEpvoComparison;
