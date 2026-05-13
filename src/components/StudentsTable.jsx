import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BsFillPencilFill } from 'react-icons/bs';
import { MdSend } from 'react-icons/md';
import EditBankAccountModal from './EditBankAccountModal';
import '../css/StudentsTable.css';

const PAGE_SIZE = 50;

const StudentsTable = ({ students, loading, onUpdateIban, onSendSelectedToEpvo, syncLoading, selectionKey, readOnly }) => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const selectAllRef = useRef(null);

  // Сбрасываем чекбоксы и страницу при фильтрации
  useEffect(() => {
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [selectionKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const sortedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    return [...students].sort((a, b) => {
      const nameA = (a.full_name || '').trim();
      const nameB = (b.full_name || '').trim();
      return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
    });
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageStudents = sortedStudents.slice(pageStart, pageStart + PAGE_SIZE);

  const allIds = sortedStudents.map((s) => s.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id)) && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="no-data">
        <p>Нет данных для отображения. Используйте фильтры для поиска студентов.</p>
      </div>
    );
  }

  // Таблица колонок под новый DTO (StudentSsoDetailDto)
  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>№</th>
              <th>ФИО</th>
              <th>ИИН</th>
              <th>Курс</th>
              <th>Форма обучения</th>
              <th>Факультет</th>
              <th>Профессия</th>
              <th>Тип оплаты</th>
              <th>Тип гранта</th>
              <th>Расчетный счёт</th>
              <th>Дата обновления</th>
              {!readOnly && (
                <th className="th-select">
                  Все
                  <label className="checkbox-label">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="custom-checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                    />
                    
                  </label>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageStudents.map((student, index) => (
              <tr key={student.id} className={selectedIds.has(student.id) ? 'row-selected' : ''}>
                <td>{pageStart + index + 1}</td>
                <td className="full-name">{student.full_name || '—'}</td>
                <td className="iin-cell">{student.iin || '—'}</td>
                <td>{student.course || '—'}</td>
                <td>{student.study_form || '—'}</td>
                <td>{student.faculty || '—'}</td>
                <td>{student.profession || '—'}</td>
                <td>
                  <span className={`status-badge ${student.payment_type === 'Стипендия' ? 'active' : 'inactive'}`}>
                    {student.payment_type || '—'}
                  </span>
                </td>
                <td>
                  <span className={`grant-badge ${student.grant_type === 'Государственный грант' ? 'state' : student.grant_type === 'Из собственных средств' ? 'rector' : 'lyceum'}`}>
                    {student.grant_type || '—'}
                  </span>
                </td>
                <td className="bank-account">
                  <div className="bank-account-cell">
                    <span className="bank-account-text">{student.bank_account || '—'}</span>
                    {!readOnly && (
                      <button
                        className="edit-iban-btn"
                        title="Редактировать расчётный счёт"
                        onClick={() => setEditingStudent(student)}
                      >
                        <BsFillPencilFill size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="update-date">{student.update_date || '—'}</td>
                {!readOnly && (
                  <td className="td-select">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => handleSelectRow(student.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        {!readOnly && selectedIds.size > 0 && (
          <div className="selected-actions">
            <span className="selected-count">Выбрано: <strong>{selectedIds.size}</strong></span>
            <button
              className="send-selected-btn"
              disabled={syncLoading}
              onClick={() => {
                const selectedStudents = sortedStudents.filter(s => selectedIds.has(s.id));
                const iins = selectedStudents.map(s => s.iin).filter(Boolean);
                if (iins.length === 0) {
                  alert('У выбранных студентов нет ИИН');
                  return;
                }
                onSendSelectedToEpvo(iins);
              }}
            >
              <MdSend size={16} />
              {syncLoading ? 'Отправка...' : `Актуализировать выбранных (${selectedIds.size})`}
            </button>
          </div>
        )}
        <div className="pagination-row">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(1)}
            disabled={safePage === 1}
          >«</button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >‹</button>
          <span className="page-info">Стр. {safePage} / {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >›</button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
          >»</button>
        </div>
        <p>Всего студентов: <strong>{students.length}</strong></p>
      </div>

      {!readOnly && editingStudent && (
        <EditBankAccountModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={async (iin, newIban) => {
            await onUpdateIban(iin, newIban);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentsTable;
