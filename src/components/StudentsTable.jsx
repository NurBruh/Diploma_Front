import React from 'react';
import './StudentsTable.css';

const StudentsTable = ({ students, loading }) => {
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
            {students.map((student, index) => (
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
                <td className="bank-account">{student.bank_account || 'Не указан'}</td>
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
    </div>
  );
};

export default StudentsTable;
