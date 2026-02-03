import React from 'react';
import './ChangeHistory.css';

const ChangeHistory = ({ changeHistory, students, onClose }) => {
  // Создаем массив всех изменений со студентами
  const allChanges = []
  
  Object.entries(changeHistory).forEach(([studentId, history]) => {
    const student = students.find(s => s.id.toString() === studentId)
    if (student && history.length > 0) {
      history.forEach(record => {
        allChanges.push({
          ...record,
          student: student
        })
      })
    }
  })
  
  // Сортируем по дате (новые сверху)
  allChanges.sort((a, b) => {
    const dateA = new Date(a.date.split(', ').reverse().join(' '))
    const dateB = new Date(b.date.split(', ').reverse().join(' '))
    return dateB - dateA
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>История всех изменений</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="history-stats">
          <div className="stat-item">
            <span className="stat-label">Всего изменений:</span>
            <span className="stat-value">{allChanges.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Студентов затронуто:</span>
            <span className="stat-value">{Object.keys(changeHistory).length}</span>
          </div>
        </div>

        <div className="history-list">
          {allChanges.map((record, index) => (
            <div key={`${record.id}-${index}`} className="history-item">
              <div className="student-header">
                <h3 className="student-name">
                  {record.student.last_name} {record.student.first_name} {record.student.patronymic}
                </h3>
                <span className="student-course">Курс {record.student.course}</span>
              </div>
              
              <div className="history-header">
                <div className="history-meta">
                  <span className="history-date">{record.date}</span>
                  <span className="history-editor">{record.editor}</span>
                </div>
              </div>

              <div className="changes-list">
                {record.changes.map((change, idx) => (
                  <div key={idx} className="change-item">
                    <div className="change-field">{change.field}:</div>
                    <div className="change-values">
                      <div className="old-value">
                        <span className="value-label">Было:</span>
                        <span className="value">{change.oldValue}</span>
                      </div>
                      <div className="arrow">→</div>
                      <div className="new-value">
                        <span className="value-label">Стало:</span>
                        <span className="value">{change.newValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allChanges.length === 0 && (
          <div className="no-history">
            <p>История изменений пуста</p>
            <p className="no-history-hint">Изменения появятся после актуализации данных</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeHistory;
