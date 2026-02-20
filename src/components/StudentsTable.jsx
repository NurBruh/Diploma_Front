import React, { useState } from 'react';
import { BsFillPencilFill } from 'react-icons/bs';
import EditBankAccountModal from './EditBankAccountModal';
import './StudentsTable.css';

const StudentsTable = ({ students, loading, onUpdateIban }) => {
  const [editingStudent, setEditingStudent] = useState(null);
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

  const sortedStudents = [...students].sort((a, b) => {
    const nameA = (a.last_name || '').trim();
    const nameB = (b.last_name || '').trim();
    return nameA.localeCompare(nameB, ['kk', 'ru'], { sensitivity: 'base' });
  });

   // Извлекаем кафедру из строки curriculum_specialty
  const extractDepartment = (curriculum) => {
    if (!curriculum) return 'Не указано';
    if (curriculum.includes('Компьютер')) return 'Кафедра "Компьютерные"';
    if (curriculum.includes('Инженер')) return 'Программная инженерия (*)';
    if (curriculum.includes('Архитектур')) return 'Архитектура';
    return 'Не указано';
  };

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
              <th>Институт</th>
              <th>Кафедра</th>
              <th>Тип гранта</th>
              <th>Статус стипендии</th>
              <th>Расчетный счёт</th>
              <th>Причины лишения</th>
              {/* Нужно придумать что то для того чтобы разделить этот колонку для чекбокса */}
              {/* <th>Выбрать все</th> */}
              <th>
                <input type="checkbox" name="selectAll" />
              </th>
              
             
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => (
              <tr key={student.id}>
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
                    <button
                      className="edit-iban-btn"
                      title="Редактировать расчётный счёт"
                      onClick={() => setEditingStudent(student)}
                    >
                      <BsFillPencilFill size={14} />
                    </button>
                  </div>
                </td>
                <td className="deprivation-reasons">
                  {student.deprivation_reasons || 'Нет'}
                </td>
                <td><input type="checkbox" name="selectAll" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <p>Всего студентов: <strong>{students.length}</strong></p>
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
