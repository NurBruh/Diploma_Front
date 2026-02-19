import React, { useState, useEffect } from 'react';
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

const SsoEpvoComparison = ({ onSyncToEpvo, syncLoading, showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'diff' | 'sso-only' | 'epvo-only'

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
      showNotification && showNotification('❌ Ошибка при загрузке данных сравнения', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const getFilteredItems = () => {
    if (!data) return [];
    switch (filter) {
      case 'diff': return data.items.filter(i => i.hasDifferences);
      case 'sso-only': return data.items.filter(i => i.onlyInSso);
      case 'epvo-only': return data.items.filter(i => i.onlyInEpvo);
      default: return data.items;
    }
  };

  const getFullName = (obj) => {
    if (!obj) return '—';
    return [obj.lastName, obj.firstName, obj.middleName].filter(Boolean).join(' ');
  };

  const isDiffField = (item, field) =>
    item.differences && item.differences.some(d => d.field === field);

  const renderCell = (value, hasDiff) => (
    <td className={hasDiff ? 'diff-cell' : ''}>{value ?? '—'}</td>
  );

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
              onClick={onSyncToEpvo}
              disabled={syncLoading}
            >
              <MdSync size={18} className={syncLoading ? 'spin' : ''} />
              {syncLoading ? 'Синхронизация...' : 'Синхр. в ЕПВО'}
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
            <div className="cstat cstat-sso">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInSso}</span>
              <span className="cstat-label">Только в ССО</span>
            </div>
            <div className="cstat cstat-epvo">
              <MdError size={16} />
              <span className="cstat-num">{data.onlyInEpvo}</span>
              <span className="cstat-label">Только в ЕПВО</span>
            </div>
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
            { key: 'sso-only', label: 'Только в ССО' },
            { key: 'epvo-only', label: 'Только в ЕПВО' },
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
      ) : (
        <div className="comparison-tables-wrapper">
          {items.length === 0 ? (
            <div className="comparison-empty">
              <MdCheckCircle size={48} color="var(--success-color)" />
              <p>Нет записей для отображения</p>
            </div>
          ) : (
            items.map((item) => {
              const rowClass = item.onlyInSso
                ? 'comparison-row only-sso'
                : item.onlyInEpvo
                ? 'comparison-row only-epvo'
                : item.hasDifferences
                ? 'comparison-row has-diff'
                : 'comparison-row';

              return (
                <div key={item.iin} className={rowClass}>
                  <div className="comparison-row-header">
                    <span className="comparison-iin">ИИН: {item.iin}</span>
                    <span className="comparison-fullname">
                      {getFullName(item.ssoData || item.epvoData)}
                    </span>
                    {item.onlyInSso && <span className="badge badge-sso">Только в ССО</span>}
                    {item.onlyInEpvo && <span className="badge badge-epvo">Только в ЕПВО</span>}
                    {item.hasDifferences && (
                      <span className="badge badge-diff">
                        {item.differences.length} различий
                      </span>
                    )}
                    {!item.onlyInSso && !item.onlyInEpvo && !item.hasDifferences && (
                      <span className="badge badge-ok">Совпадает</span>
                    )}
                  </div>

                  {(item.hasDifferences || item.onlyInSso || item.onlyInEpvo) && (
                    <div className="comparison-tables">
                      <div className="comparison-side">
                        <div className="side-label sso-label">ССО</div>
                        <table className="side-table">
                          <tbody>
                            {Object.entries(FIELD_LABELS).map(([field, label]) => {
                              const val = item.ssoData ? item.ssoData[field] : null;
                              const diff = isDiffField(item, field);
                              return (
                                <tr key={field} className={diff ? 'diff-row' : ''}>
                                  <td className="field-label-cell">{label}</td>
                                  <td className={`field-value-cell${diff ? ' diff-value' : ''}`}>
                                    {val !== null && val !== undefined ? String(val) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="comparison-divider">
                        {item.hasDifferences && <span className="diff-arrow">≠</span>}
                      </div>

                      <div className="comparison-side">
                        <div className="side-label epvo-label">ЕПВО</div>
                        <table className="side-table">
                          <tbody>
                            {Object.entries(FIELD_LABELS).map(([field, label]) => {
                              const val = item.epvoData ? item.epvoData[field] : null;
                              const diff = isDiffField(item, field);
                              return (
                                <tr key={field} className={diff ? 'diff-row' : ''}>
                                  <td className="field-label-cell">{label}</td>
                                  <td className={`field-value-cell${diff ? ' diff-value epvo-diff' : ''}`}>
                                    {val !== null && val !== undefined ? String(val) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SsoEpvoComparison;
