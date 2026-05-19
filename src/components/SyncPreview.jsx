import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MdRefresh,
  MdCloudUpload,
  MdSave,
  MdWarning,
  MdError,
  MdEdit,
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdFilterList,
  MdSearch,
} from 'react-icons/md';
import { authFetch } from '../utils/authFetch';
import EditStudentModal from './EditStudentModal';
import TableScrollSync from './TableScrollSync';
import '../css/SyncPreview.css';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'diff', label: 'С различиями' },
  { value: 'new', label: 'Только в ССО' },
  { value: 'temp', label: 'В TEMP' },
  { value: 'not-temp', label: 'Не в TEMP' },
];

const PAGE_SIZE = 50;

const SyncPreview = ({ showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editLoadingId, setEditLoadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const searchTimerRef = useRef(null);

  const fetchPreview = useCallback(async (page, filterVal, searchVal) => {
    const p = page ?? currentPage;
    const f = filterVal ?? filter;
    const s = searchVal !== undefined ? searchVal : search;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        filter: f,
      });
      if (s.trim()) params.set('search', s.trim());

      const res = await authFetch.get(`/epvo-sso/sync-preview-comparison?${params}`);
      setData(res.data);
      setCurrentPage(res.data.page);
    } catch (err) {
      showNotification?.(`Не удалось загрузить предпросмотр: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, search, showNotification]);

  useEffect(() => { fetchPreview(1, 'all', ''); }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    fetchPreview(1, newFilter, search);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPreview(1, filter, val);
    }, 400);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPreview(newPage, filter, search);
  };

  const handleSaveToTemp = async () => {
    if (!data?.filteredCount) {
      showNotification?.('Нет данных для сохранения', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch.post('/epvo-sso/sync-preview-comparison/save-temp', {
        all: true,
        filter,
        search: search.trim() || null,
        overwriteExisting: false,
      });
      const json = res.data;
      showNotification?.(
        `Сохранено новых записей в STUDENT_TEMP: ${json.count ?? 0}`,
        'success'
      );
      fetchPreview(currentPage, filter, search);
    } catch (err) {
      showNotification?.(`Ошибка сохранения: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToEpvo = async () => {
    if (!window.confirm('Отправить данные из TEMP в ЕПВО?')) return;
    setSending(true);
    try {
      const res = await authFetch.post('/epvo-sso/sync-temp-to-epvo');
      const json = res.data;
      showNotification?.(
        json.message ?? `Отправлено в ЕПВО. Успешно: ${json.success}, ошибок: ${json.errors}`,
        json.errors > 0 ? 'warning' : 'success'
      );
      fetchPreview(currentPage, filter, search);
    } catch (err) {
      showNotification?.(`Ошибка отправки: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      // Редактирование записи в STUDENT_TEMP напрямую
      await authFetch.post('/epvo-sso/update-temp-student', updatedItem.data);

      setEditItem(null);
      showNotification?.('Изменения сохранены в STUDENT_TEMP', 'success');
      fetchPreview(currentPage, filter, search);
    } catch (err) {
      showNotification?.(`Ошибка сохранения: ${err.response?.data?.message ?? err.message}`, 'error');
    }
  };

  const handleOpenEdit = async (item) => {
    if (!item?.iinPlt) {
      showNotification?.('Нельзя открыть редактирование: нет ИИН', 'warning');
      return;
    }

    setEditLoadingId(item.studentId);
    try {
      const res = await authFetch.get(`/epvo-sso/sync-preview-comparison/edit/${encodeURIComponent(item.iinPlt)}`);
      const editData = res.data;
      const editableData = editData.tempData ?? editData.ssoData ?? editData.epvoData ?? item.data ?? {};

      setEditItem({
        ...item,
        data: editableData,
        differentFields: editData.diffFields ?? item.differentFields ?? [],
        editData,
      });
    } catch (err) {
      showNotification?.(`Не удалось открыть редактирование: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setEditLoadingId(null);
    }
  };

  const toggleExpand = (studentId) => {
    setExpandedId((prev) => (prev === studentId ? null : studentId));
  };

  const pageItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const safePage = data?.page ?? 1;
  const filteredCount = data?.filteredCount ?? 0;

  const Pagination = () => (
    <div className="sp-pagination">
      <button className="sp-page-btn" onClick={() => handlePageChange(1)} disabled={safePage === 1}>«</button>
      <button className="sp-page-btn" onClick={() => handlePageChange(Math.max(1, safePage - 1))} disabled={safePage === 1}>‹</button>
      <span className="sp-page-info">
        Стр. <strong>{safePage}</strong> / <strong>{totalPages}</strong>
        &nbsp;·&nbsp;
        {filteredCount > 0 ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredCount)} из ` : ''}
        <strong>{filteredCount}</strong>
      </span>
      <button className="sp-page-btn" onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}>›</button>
      <button className="sp-page-btn" onClick={() => handlePageChange(totalPages)} disabled={safePage === totalPages}>»</button>
    </div>
  );

  return (
    <div className="sync-preview">
      <div className="sync-preview__header">
        <h2 className="sync-preview__title">Предпросмотр синхронизации</h2>
        <div className="sync-preview__actions">
          <button className="sp-btn sp-btn--secondary" onClick={() => fetchPreview(currentPage, filter, search)} disabled={loading}>
            <MdRefresh size={18} />
            Обновить
          </button>
          <button
            className="sp-btn sp-btn--primary"
            onClick={handleSaveToTemp}
            disabled={saving || loading || !data?.filteredCount}
            title="Сохранить все найденные записи в STUDENT_TEMP"
          >
            <MdSave size={18} />
            {saving ? 'Сохранение…' : 'Сохранить все в TEMP'}
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
            <span className="sp-stat__value">{data.totalItems}</span>
            <span className="sp-stat__label">Всего</span>
          </div>
          <div className="sp-stat sp-stat--new">
            <MdWarning size={20} />
            <span className="sp-stat__value">{data.diffCount}</span>
            <span className="sp-stat__label">С различиями</span>
          </div>
          <div className="sp-stat sp-stat--dup">
            <MdError size={20} />
            <span className="sp-stat__value">{data.newCount}</span>
            <span className="sp-stat__label">Только в ССО</span>
          </div>
        </div>
      )}

      <div className="sync-preview__filters">
        <div className="sp-filter-group">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sp-filter-btn${filter === opt.value ? ' active' : ''}`}
              onClick={() => handleFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="sp-search">
          <MdSearch size={18} />
          <input
            type="text"
            placeholder="Поиск по ФИО или ИИН..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {loading && <div className="sync-preview__loading">Загрузка данных из КазНИТУ…</div>}

      {!loading && data && (
        <>
          <Pagination />
          <TableScrollSync bodyClassName="sync-preview__table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ИИН</th>
                  <th>ФИО</th>
                  <th>Курс</th>
                  <th>Форма обучения</th>
                  <th>Институт</th>
                  <th>Специализация</th>
                  <th>Тип оплаты</th>
                  <th>Тип гранта</th>
                  <th>ИИК</th>
                  <th>БИК</th>
                  <th>Дата обн. (ССО)</th>
                  <th>Дата обн. (ЕПВО)</th>
                  <th>Статус TEMP</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={16} className="sp-table__empty">Нет записей</td>
                  </tr>
                )}
                {pageItems.map((item, idx) => (
                  <React.Fragment key={item.studentId}>
                    <tr className={item.isNew ? 'sp-row--new' : 'sp-row--diff'}>
                      <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="sp-monospace">{item.iinPlt ?? '—'}</td>
                      <td>{item.fullName || '—'}</td>
                      <td>{item.courseNumber ?? '—'}</td>
                      <td>{item.studyForm ?? '—'}</td>
                      <td>{item.facultyName ?? '—'}</td>
                      <td>{item.specialization ?? '—'}</td>
                      <td>{item.paymentType ?? '—'}</td>
                      <td>{item.grantType ?? '—'}</td>
                      <td className="sp-monospace">{item.iic ?? '—'}</td>
                      <td className="sp-monospace">{item.bic ?? '—'}</td>
                      <td>{item.ssoUpdatedDate ? new Date(item.ssoUpdatedDate).toLocaleDateString('ru-RU') : '—'}</td>
                      <td>{item.epvoUpdateDate ? new Date(item.epvoUpdateDate).toLocaleDateString('ru-RU') : '—'}</td>
                      <td>
                        {item.isInTemp ? (
                          <span className="sp-badge sp-badge--ok">
                            <MdCheckCircle size={14} /> В TEMP
                          </span>
                        ) : (
                          <span className="sp-badge sp-badge--warn">
                            <MdWarning size={14} /> Нет
                          </span>
                        )}
                      </td>
                      <td>
                        {item.isNew ? (
                          <span className="sp-badge sp-badge--new">
                            <MdError size={14} /> Нет в ЕПВО
                          </span>
                        ) : (
                          <span className="sp-badge sp-badge--diff">
                            <MdWarning size={14} /> {item.differentFields?.length ?? 0} разл.
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="sp-actions">
                          {!item.isNew && item.fieldDiffs?.length > 0 && (
                            <button
                              className="sp-btn-icon"
                              title="Показать различия"
                              onClick={() => toggleExpand(item.studentId)}
                            >
                              {expandedId === item.studentId ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                            </button>
                          )}
                          <button
                            className="sp-btn-icon"
                            title="Редактировать"
                            disabled={editLoadingId === item.studentId}
                            onClick={() => handleOpenEdit(item)}
                          >
                            <MdEdit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === item.studentId && item.fieldDiffs?.length > 0 && (
                      <tr className="sp-row--detail">
                        <td colSpan={16}>
                          <div className="sp-diff-panel">
                            <strong>Различия:</strong>
                            <div className="sp-diff-grid">
                              {item.fieldDiffs.map((diff, i) => (
                                <div key={i} className="sp-diff-item">
                                  <span className="sp-diff-field">{diff.fieldName}</span>
                                  <span className="sp-diff-sso" title="ССО">{diff.ssoValue ?? '—'}</span>
                                  <span className="sp-diff-arrow">→</span>
                                  <span className="sp-diff-epvo" title="ЕПВО">{diff.epvoValue ?? '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </TableScrollSync>
          <Pagination />
        </>
      )}

      {!loading && !data && (
        <div className="sync-preview__empty">
          <MdError size={40} />
          <p>Нет данных. Нажмите «Обновить» для загрузки.</p>
        </div>
      )}

      {editItem && (
        <EditStudentModal
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
};

export default SyncPreview;
