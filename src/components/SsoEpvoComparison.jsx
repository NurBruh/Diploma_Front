import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdSync, MdRefresh, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import AuthService from '../services/AuthService';
import './SsoEpvoComparison.css';

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
  { key: 'iban', label: 'IBAN', accessor: 'iban' },
  { key: 'isActive', label: 'Активен' },
];

const SsoEpvoComparison = ({ onSyncToEpvo, syncLoading, showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [syncingIIN, setSyncingIIN] = useState(null);
  const ssoTbodyRef = useRef(null);
  const epvoTbodyRef = useRef(null);
  const ssoScrollRef = useRef(null);
  const epvoScrollRef = useRef(null);
  const scrollingRef = useRef(null);

  // Синхронизация высоты строк между двумя таблицами
  const syncRowHeights = useCallback(() => {
    const ssoTbody = ssoTbodyRef.current;
    const epvoTbody = epvoTbodyRef.current;
    if (!ssoTbody || !epvoTbody) return;

    const ssoRows = ssoTbody.querySelectorAll('tr');
    const epvoRows = epvoTbody.querySelectorAll('tr');
    const count = Math.min(ssoRows.length, epvoRows.length);

    // Сбрасываем высоту
    for (let i = 0; i < count; i++) {
      ssoRows[i].style.height = 'auto';
      epvoRows[i].style.height = 'auto';
    }

    // Устанавливаем одинаковую (максимальную) высоту для каждой пары строк
    requestAnimationFrame(() => {
      for (let i = 0; i < count; i++) {
        const maxH = Math.max(ssoRows[i].offsetHeight, epvoRows[i].offsetHeight);
        ssoRows[i].style.height = maxH + 'px';
        epvoRows[i].style.height = maxH + 'px';
      }
    });
  }, []);

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

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${API_BASE_URL}/Epvo/compare`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const json = await response.json();
      setData(json);
    } catch (e) {
      showNotification && showNotification('Ошибка при загрузке данных сравнения', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    await onSyncToEpvo();
    await fetchComparison();
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
      await fetchComparison();
    } catch (e) {
      showNotification && showNotification(' Ошибка при синхронизации студента', 'error');
    } finally {
      setSyncingIIN(null);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  // Синхронизация высоты строк после каждого обновления данных/фильтра
  useEffect(() => {
    if (data) {
      const t = setTimeout(syncRowHeights, 50);
      return () => clearTimeout(t);
    }
  }, [data, filter, syncRowHeights]);

  const sortByLastName = (arr) =>
    [...arr].sort((a, b) => {
      const nameA = (a.ssoData?.lastName || a.epvoData?.lastName || '').trim();
      const nameB = (b.ssoData?.lastName || b.epvoData?.lastName || '').trim();
      return nameA.localeCompare(nameB, ['kk', 'ru'], { sensitivity: 'base' });
    });

  const getFilteredItems = () => {
    if (!data) return [];
    switch (filter) {
      case 'diff': return sortByLastName(data.items.filter(i => i.hasDifferences));
      case 'sso-only': return sortByLastName(data.items.filter(i => i.onlyInSso));
      case 'epvo-only': return sortByLastName(data.items.filter(i => i.onlyInEpvo));
      default: return sortByLastName(data.items);
    }
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

  const items = getFilteredItems();

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <div className="comparison-title-row">
          <h2 className="comparison-title">Сравнение данных: ССО vs ЕПВО</h2>
          <div className="comparison-actions">
            <button className="icon-btn-sm" onClick={fetchComparison} disabled={loading}>
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
              <span className="cstat-num">{data.items.length}</span>
              <span className="cstat-label">Всего студентов</span>
            </div>
            <div className="cstat cstat-diff">
              <MdWarning size={16} />
              <span className="cstat-num">{data.items.filter(i => i.hasDifferences).length}</span>
              <span className="cstat-label">С различиями</span>
            </div>
            {/* <div className="cstat cstat-sso">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInSso}</span>
              <span className="cstat-label">Только в ССО</span>
            </div>
            <div className="cstat cstat-epvo">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInEpvo}</span>
              <span className="cstat-label">Только в ЕПВО</span>
            </div> */}
            <div className="cstat cstat-ok">
              <MdCheckCircle size={16} />
              <span className="cstat-num">
                {data.items.filter(i => !i.hasDifferences && !i.onlyInSso && !i.onlyInEpvo).length}
              </span>
              <span className="cstat-label">Совпадают</span>
            </div>
          </div>
        )}

        <div className="comparison-filters">
          {[
            { key: 'all', label: 'Все' },
            { key: 'diff', label: 'С различиями' },
            // { key: 'sso-only', label: 'Только в ССО' },
            // { key: 'epvo-only', label: 'Только в ЕПВО' },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="comparison-loading">Загрузка данных...</div>
      ) : items.length === 0 ? (
        <div className="comparison-empty">
          <MdCheckCircle size={48} color="var(--success-color)" />
          <p>Нет записей для отображения</p>
        </div>
      ) : (
        <div className="comparison-dual-tables">
          {/* Таблица ССО (Посредник) */}
          <div className="comparison-table-block">
            <div className="table-block-header sso-header">
              <h3>ССО (Посредник)</h3>
              <span className="table-count">{items.filter(i => i.ssoData).length} записей</span>
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
                <tbody ref={ssoTbodyRef}>
                  {items.map((item) => {
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
              <span className="table-count">{items.filter(i => i.epvoData).length} записей</span>
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
                <tbody ref={epvoTbodyRef}>
                  {items.map((item) => {
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
      )}
    </div>
  );
};

export default SsoEpvoComparison;
