import React, { useState, useEffect, useCallback } from 'react';
import { MdRefresh, MdCloudUpload, MdSave, MdWarning, MdError, MdEdit, MdExpandMore, MdExpandLess, MdCheckCircle } from 'react-icons/md';
import { authFetch } from '../utils/authFetch';
import EditStudentModal from './EditStudentModal';
import '../css/SyncPreview.css';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'diff', label: 'С различиями' },
  { value: 'new', label: 'Только в ССО' },
];

const SyncPreview = ({ showNotification }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch.get('/epvo-sso/sync-preview');
      setData(res.data);
    } catch (err) {
      showNotification?.(`Не удалось загрузить предпросмотр: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const handleSaveToTemp = async () => {
    if (!data?.items?.length) {
      showNotification?.('Нет данных для сохранения', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = data.items.map(i => i.data);
      const res = await authFetch.post('/epvo-sso/save-to-temp', payload);
      const json = res.data;
      showNotification?.(`Сохранено в TEMP: ${json.count ?? json.message ?? 'OK'}`, 'success');
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
      const res = await authFetch.post('/epvo-sso/send-temp-to-epvo');
      const json = res.data;
      showNotification?.(
        `Отправлено в ЕПВО. Успешно: ${json.success}, ошибок: ${json.errors}`,
        json.errors > 0 ? 'warning' : 'success'
      );
    } catch (err) {
      showNotification?.(`Ошибка отправки: ${err.response?.data?.message ?? err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      // Сразу сохраняем в STUDENT_TEMP
      await authFetch.post('/epvo-sso/update-temp-student', updatedItem.data);

      const d = updatedItem.data;
      const fullName = `${d.lastName || ''} ${d.firstName || ''} ${d.patronymic || ''}`.trim();
      const paymentType = d.paymentFormId === 2 ? 'Стипендия'
                        : d.paymentFormId === 1 ? 'Платник'
                        : updatedItem.paymentType;
      const grantType = d.grantType === -4 ? 'Государственный грант'
                      : d.grantType === -7 ? 'Из собственных средств'
                      : d.grantType === -6 ? 'Трехсторонняя форма обучения'
                      : updatedItem.grantType;

      const enrichedItem = {
        ...updatedItem,
        fullName: fullName || updatedItem.fullName,
        courseNumber: d.courseNumber ?? updatedItem.courseNumber,
        paymentType,
        grantType,
      };

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i => i.studentId === enrichedItem.studentId ? enrichedItem : i)
        };
      });
      setEditItem(null);
      showNotification?.('Изменения сохранены в STUDENT_TEMP', 'success');
    } catch (err) {
      showNotification?.(`Ошибка сохранения: ${err.response?.data?.message ?? err.message}`, 'error');
    }
  };

  const displayedItems = data?.items?.filter(item => {
    if (filter === 'diff') return !item.isNew;
    if (filter === 'new') return item.isNew;
    return true;
  }) ?? [];

  const toggleExpand = (studentId) => {
    setExpandedId(prev => prev === studentId ? null : studentId);
  };

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
            disabled={saving || loading || !data?.items?.length}
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
                <th>Факультет</th>
                <th>Специальность</th>
                <th>Тип оплаты</th>
                <th>Тип гранта</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="sp-table__empty">Нет записей</td>
                </tr>
              )}
              {displayedItems.map((item, idx) => (
                <React.Fragment key={item.studentId}>
                  <tr className={item.isNew ? 'sp-row--new' : 'sp-row--diff'}>
                    <td>{idx + 1}</td>
                    <td className="sp-monospace">{item.iinPlt ?? '—'}</td>
                    <td>{item.fullName || '—'}</td>
                    <td>{item.courseNumber ?? '—'}</td>
                    <td>{item.facultyName || '—'}</td>
                    <td>{item.professionName || '—'}</td>
                    <td>{item.paymentType ?? '—'}</td>
                    <td>{item.grantType ?? '—'}</td>
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
                          onClick={() => setEditItem(item)}
                        >
                          <MdEdit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.studentId && item.fieldDiffs?.length > 0 && (
                    <tr className="sp-row--detail">
                      <td colSpan={10}>
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
        </div>
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
