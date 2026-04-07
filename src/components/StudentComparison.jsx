import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MdRefresh, MdCheckCircle, MdWarning, MdError, MdFilterList, MdSearch } from 'react-icons/md';
const API_BASE_URL = 'http://localhost:5150/api';
import AuthService from '../services/AuthService';
import '../css/StudentComparison.css';

const COMPARE_FIELDS = [
  { key: 'fullName', label: 'ФИО', sso: 'sso_FullName', epvo: 'epvo_FullName', diffLabel: 'ФИО' },
  { key: 'course', label: 'Курс', sso: 'sso_CourseNumber', epvo: 'epvo_CourseNumber', diffLabel: 'Курс' },
  { key: 'studyForm', label: 'Форма обучения', sso: 'sso_StudyForm', epvo: 'epvo_StudyForm', diffLabel: 'Форма обучения' },
  { key: 'institute', label: 'Институт', sso: 'sso_Institute', epvo: 'epvo_FacultyName', diffLabel: 'Институт/Факультет' },
  { key: 'cafedra', label: 'Кафедра / Спец.', sso: 'sso_Cafedra', epvo: 'epvo_Specialization', diffLabel: 'Кафедра/Специализация' },
  { key: 'payment', label: 'Тип оплаты', sso: 'sso_PaymentType', epvo: 'epvo_PaymentType', diffLabel: 'Тип оплаты' },
  { key: 'grant', label: 'Тип гранта', sso: 'sso_GrantType', epvo: 'epvo_GrantType', diffLabel: 'Тип гранта' },
];

const PAGE_SIZE = 50;

const StudentComparison = ({ showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIin, setExpandedIin] = useState(null);
  const searchTimerRef = useRef(null);

  const fetchComparison = useCallback(async (page, filterVal, searchVal) => {
    const p = page ?? currentPage;
    const f = filterVal ?? filter;
    const s = searchVal !== undefined ? searchVal : search;
    setLoading(true);
    try {
      const token = AuthService.getToken();
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        filter: f,
      });
      if (s.trim()) params.set('search', s.trim());

      const response = await fetch(`${API_BASE_URL}/comparison/students?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const json = await response.json();
      setData(json);
      setCurrentPage(json.page);
    } catch (e) {
      showNotification?.('Ошибка при загрузке данных сравнения', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, search, showNotification]);

  useEffect(() => {
    fetchComparison(1, 'all', '');
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    fetchComparison(1, newFilter, search);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchComparison(1, filter, val);
    }, 400);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchComparison(newPage, filter, search);
  };

  const getStatusInfo = (item) => {
    if (item.differentFields.includes('Нет в ЕПВО'))
      return { cls: 'badge-sso-only', text: 'Нет в ЕПВО', icon: <MdError size={14} /> };
    if (item.differentFields.includes('Нет в ССО'))
      return { cls: 'badge-epvo-only', text: 'Нет в ССО', icon: <MdError size={14} /> };
    if (item.hasDifference)
      return { cls: 'badge-diff', text: `${item.differentFields.length} разл.`, icon: <MdWarning size={14} /> };
    return { cls: 'badge-ok', text: 'OK', icon: <MdCheckCircle size={14} /> };
  };

  const isDiffField = (item, diffLabel) => item.differentFields.includes(diffLabel);

  const fmt = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const pageItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const safePage = data?.page ?? 1;
  const filteredCount = data?.filteredCount ?? 0;

  const stats = {
    total: data?.totalItems ?? 0,
    withDiff: data?.withDifferences ?? 0,
    onlyInSso: data?.onlyInSso ?? 0,
    onlyInEpvo: data?.onlyInEpvo ?? 0,
    matching: data?.matching ?? 0,
  };

  const Pagination = () => (
    <div className="sc-pagination">
      <button className="sc-page-btn" onClick={() => handlePageChange(1)} disabled={safePage === 1}>«</button>
      <button className="sc-page-btn" onClick={() => handlePageChange(Math.max(1, safePage - 1))} disabled={safePage === 1}>‹</button>
      <span className="sc-page-info">
        Стр. <strong>{safePage}</strong> / <strong>{totalPages}</strong>
        &nbsp;·&nbsp;
        {filteredCount > 0 ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredCount)} из ` : ''}
        <strong>{filteredCount}</strong>
      </span>
      <button className="sc-page-btn" onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}>›</button>
      <button className="sc-page-btn" onClick={() => handlePageChange(totalPages)} disabled={safePage === totalPages}>»</button>
    </div>
  );

  return (
    <div className="sc-page">
      {/* Header */}
      <div className="sc-header">
        <div className="sc-title-row">
          <h2 className="sc-title">Сравнение данных: ССО ↔ ЕПВО</h2>
          <button className="sc-btn sc-btn-refresh" onClick={() => fetchComparison(currentPage, filter, search)} disabled={loading}>
            <MdRefresh size={18} className={loading ? 'spin' : ''} />
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        {/* Статистика */}
        <div className="sc-stats">
          <div className="sc-stat" onClick={() => handleFilterChange('all')}>
            <span className="sc-stat-num">{stats.total}</span>
            <span className="sc-stat-label">Всего</span>
          </div>
          <div className="sc-stat sc-stat-diff" onClick={() => handleFilterChange('diff')}>
            <MdWarning size={16} />
            <span className="sc-stat-num">{stats.withDiff}</span>
            <span className="sc-stat-label">С различиями</span>
          </div>
          <div className="sc-stat sc-stat-sso" onClick={() => handleFilterChange('sso-only')}>
            <MdError size={16} />
            <span className="sc-stat-num">{stats.onlyInSso}</span>
            <span className="sc-stat-label">Только в ССО</span>
          </div>
          <div className="sc-stat sc-stat-epvo" onClick={() => handleFilterChange('epvo-only')}>
            <MdError size={16} />
            <span className="sc-stat-num">{stats.onlyInEpvo}</span>
            <span className="sc-stat-label">Только в ЕПВО</span>
          </div>
          <div className="sc-stat sc-stat-ok" onClick={() => handleFilterChange('ok')}>
            <MdCheckCircle size={16} />
            <span className="sc-stat-num">{stats.matching}</span>
            <span className="sc-stat-label">Совпадают</span>
          </div>
        </div>

        {/* Фильтры + поиск */}
        <div className="sc-toolbar">
          <div className="sc-filters">
            {[
              { key: 'all', label: 'Все' },
              { key: 'diff', label: 'С различиями' },
              { key: 'sso-only', label: 'Только в ССО' },
              { key: 'epvo-only', label: 'Только в ЕПВО' },
              { key: 'ok', label: 'Совпадают' },
            ].map(f => (
              <button key={f.key} className={`sc-filter-tab${filter === f.key ? ' active' : ''}`} onClick={() => handleFilterChange(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="sc-search">
            <MdSearch size={18} />
            <input
              type="text"
              placeholder="Поиск по ФИО или ИИН..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Таблица */}
      {loading && !data ? (
        <div className="sc-loading">Загрузка данных сравнения...</div>
      ) : pageItems.length === 0 ? (
        <div className="sc-empty">
          <MdFilterList size={48} />
          <p>Нет записей для отображения</p>
        </div>
      ) : (
        <>
          <Pagination />
          <div className="sc-table-wrapper">
            <table className="sc-table">
              <thead>
                <tr>
                  <th className="sc-th-num">№</th>
                  <th className="sc-th-status">Статус</th>
                  <th className="sc-th-iin">ИИН</th>
                  {COMPARE_FIELDS.map(f => (
                    <th key={f.key} className="sc-th-pair">
                      <div className="sc-th-pair-label">{f.label}</div>
                      <div className="sc-th-pair-sub">
                        <span className="sc-sub-sso">ССО</span>
                        <span className="sc-sub-epvo">ЕПВО</span>
                      </div>
                    </th>
                  ))}
                  <th className="sc-th-iic">Р/С (ЕПВО)</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const status = getStatusInfo(item);
                  const isExpanded = expandedIin === item.iin;
                  const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <React.Fragment key={item.iin || idx}>
                      <tr
                        className={`sc-row ${item.hasDifference ? 'sc-row-diff' : 'sc-row-ok'}`}
                        onClick={() => setExpandedIin(isExpanded ? null : item.iin)}
                      >
                        <td className="sc-td-num">{rowNum}</td>
                        <td className="sc-td-status">
                          <span className={`sc-badge ${status.cls}`}>
                            {status.icon} {status.text}
                          </span>
                        </td>
                        <td className="sc-td-iin">{item.iin || '—'}</td>
                        {COMPARE_FIELDS.map(f => {
                          const ssoVal = fmt(item[f.sso]);
                          const epvoVal = fmt(item[f.epvo]);
                          const hasDiff = isDiffField(item, f.diffLabel);
                          return (
                            <td key={f.key} className={`sc-td-pair ${hasDiff ? 'sc-td-diff' : ''}`}>
                              <div className="sc-pair-vals">
                                <span className={`sc-val-sso ${hasDiff ? 'sc-val-highlight-sso' : ''}`}>
                                  {ssoVal}
                                </span>
                                <span className={`sc-val-epvo ${hasDiff ? 'sc-val-highlight-epvo' : ''}`}>
                                  {epvoVal}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="sc-td-iic">{fmt(item.epvo_Iic)}</td>
                      </tr>

                      {/* Развёрнутая строка с деталями различий */}
                      {isExpanded && item.hasDifference && (
                        <tr className="sc-row-detail">
                          <td colSpan={COMPARE_FIELDS.length + 4}>
                            <div className="sc-detail-box">
                              <strong>Расхождения:</strong>
                              {item.differentFields.map((field, i) => (
                                <span key={i} className="sc-detail-tag">{field}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      <div className="sc-footer">
        Показано {pageItems.length} из {filteredCount} записей (всего: {stats.total})
      </div>
    </div>
  );
};

export default StudentComparison;
