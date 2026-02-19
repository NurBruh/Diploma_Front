import React from 'react';
import './ChangeHistory.css';

const ChangeHistory = ({ changeHistory, students, onClose, onApplySsoChange, onRejectSsoChange }) => {

  const allChanges = []
  
  Object.entries(changeHistory).forEach(([studentId, history]) => {
    const student = students.find(s => s.id.toString() === studentId)
    if (student && history.length > 0) {
      history.forEach(record => {
        allChanges.push({
          ...record,
          studentId,
          student: student
        })
      })
    }
  })
  

  allChanges.sort((a, b) => {
    const dateA = new Date(a.date.split(', ').reverse().join(' '))
    const dateB = new Date(b.date.split(', ').reverse().join(' '))
    return dateB - dateA
  })

  const isSsoRecord = (record) => record.editor === 'Система (SSO)'
  const isPending = (record) => !record.status || record.status === 'pending'

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
          <div className="stat-item">
            <span className="stat-label">Ожидают решения:</span>
            <span className="stat-value sso-pending-count">
              {allChanges.filter(r => isSsoRecord(r) && isPending(r)).length}
            </span>
          </div>
        </div>

        <div className="history-list">
          {allChanges.map((record, index) => (
            <div
              key={`${record.id}-${index}`}
              className={`history-item${isSsoRecord(record) ? ' sso-change' : ''}${record.status === 'applied' ? ' applied' : ''}${record.status === 'deferred' ? ' deferred' : ''}`}
            >
              <div className="student-header">
                <h3 className="student-name">
                  {record.student.last_name} {record.student.first_name} {record.student.patronymic}
                </h3>
                <div className="student-header-right">
                  <span className="student-course">Курс {record.student.course}</span>
                  {isSsoRecord(record) && (
                    <span className="sso-badge">ССО</span>
                  )}
                </div>
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

              {isSsoRecord(record) && (
                <div className="sso-actions">
                  {isPending(record) ? (
                    <>
                      <span className="sso-action-label">Изменения из ССО — применить в ЕПВО?</span>
                      <div className="sso-action-buttons">
                        <button
                          className="btn-apply"
                          onClick={() => onApplySsoChange && onApplySsoChange(record.studentId, record.id)}
                        >
                          ✓ Применить изменения
                        </button>
                        <button
                          className="btn-defer"
                          onClick={() => onRejectSsoChange && onRejectSsoChange(record.studentId, record.id)}
                        >
                          ✗ Нет, позже
                        </button>
                      </div>
                    </>
                  ) : record.status === 'applied' ? (
                    <span className="status-applied">✓ Применено в ЕПВО</span>
                  ) : (
                    <span className="status-deferred">Отложено — применить вручную через «Синхр. в ЕПВО»</span>
                  )}
                </div>
              )}
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
