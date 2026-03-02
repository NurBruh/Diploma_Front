import React, { useState, useRef, useEffect } from 'react';
import { BsFillPencilFill } from 'react-icons/bs';
import { MdSend } from 'react-icons/md';
import EditBankAccountModal from './EditBankAccountModal';
import './StudentsTable.css';

const StudentsTable = ({ students, loading, onUpdateIban, onSendSelectedToEpvo, syncLoading, selectionKey, referenceData, currentUser }) => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectAllRef = useRef(null);
  const isManager = currentUser?.role === 'manager_or';

  // Сбрасываем чекбоксы при фильтрации
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectionKey]);

  const sortedStudents = (!students || students.length === 0) ? [] : [...students].sort((a, b) => {
    const nameA = (a.last_name || '').trim();
    const nameB = (b.last_name || '').trim();
    return nameA.localeCompare(nameB, ['kk', 'ru'], { sensitivity: 'base' });
  });

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

  // Определяем кафедру по названию специальности через справочные данные
  const extractDepartment = (curriculum) => {
    if (!curriculum) return 'Не указано';
    if (referenceData?.specialities) {
      const spec = referenceData.specialities.find(s =>
        curriculum.toLowerCase().includes(s.specialityName.toLowerCase()) ||
        s.specialityName.toLowerCase().includes(curriculum.toLowerCase())
      );
      if (spec) return spec.departmentName;
    }
    return curriculum;
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

  return (
    <div className="table-container">
      <div className="table-header-section">
        <h2 className="table-title">Список студентов</h2>
        <div className="student-count-badge">
          Всего: <strong>{students.length}</strong>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>№</th>
              <th>ФИО</th>
              <th>ИИН</th>
              <th>Курс</th>
              <th>Форма обучения</th>
              <th>Институт</th>
              <th>Кафедра</th>
              <th>Тип гранта</th>
              <th>Статус стипендии</th>
              <th>Расчетный счёт</th>
              <th>Примечания</th>
              {isManager && (
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
            {sortedStudents.map((student, index) => (
              <tr key={student.id} className={selectedIds.has(student.id) ? 'row-selected' : ''}>
                <td>{index + 1}</td>
                <td className="full-name">
                  {student.last_name} {student.first_name} {student.patronymic}
                </td>
                <td className="iin-cell">{student.iin || student.id || 'Не указан'}</td>
                <td>{student.course}</td>
                <td>{student.study_form}</td>
                <td>{student.institute}</td>
                <td>{extractDepartment(student.curriculum_specialty)}</td>
                <td>
                  <span className={`grant-badge ${student.grant_type === 'Государственный' ? 'state' : student.grant_type === 'Ректорский' ? 'rector' : 'lyceum'}`}>
                    {student.grant_type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${student.scholarship_status === 'Активна' ? 'active' : 'inactive'}`}>
                    {student.has_scholarship === 'Да' ? 'Назначено' : student.has_scholarship === 'Нет' ? 'Не назначено' : 'Не указано'}
                  </span>
                </td>
                <td className="bank-account">
                  <div className="bank-account-cell">
                    <span className="bank-account-text">{student.bank_account || 'Не указан'}</span>
                    {isManager && (
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
                <td className="deprivation-reasons">
                  {student.notes || 'Нет'}
                </td>
                {isManager && (
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
        {isManager && selectedIds.size > 0 && (
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

      </div>

      {editingStudent && (
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
