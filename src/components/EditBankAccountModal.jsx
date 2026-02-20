import React, { useState } from 'react';
import './EditBankAccountModal.css';

const EditBankAccountModal = ({ student, onClose, onSave }) => {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'edit'
  const [newIban, setNewIban] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fullName = `${student.last_name} ${student.first_name} ${student.patronymic || ''}`.trim();

  const handleContinue = () => {
    setStep('edit');
  };

  const handleSave = async () => {
    if (!newIban.trim()) {
      setError('Введите новый расчётный счёт');
      return;
    }

    if (newIban.trim() === (student.bank_account || '')) {
      setError('Новый расчётный счёт совпадает с текущим');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(student.iin, newIban.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {step === 'confirm' && (
          <>
            <div className="modal-header">
              <h3>Редактирование расчётного счёта</h3>
              <button className="modal-close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-question">
                Вы хотите редактировать расчётный счёт студента:
              </p>
              <p className="modal-student-name">{fullName}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                Отмена
              </button>
              <button className="modal-btn modal-btn-continue" onClick={handleContinue}>
                Продолжить
              </button>
            </div>
          </>
        )}

        {step === 'edit' && (
          <>
            <div className="modal-header">
              <h3>Изменение расчётного счёта</h3>
              <button className="modal-close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-student-name-small">{fullName}</p>

              <div className="modal-field">
                <label className="modal-label">Текущий расчётный счёт:</label>
                <div className="modal-current-value">
                  {student.bank_account || 'Не указан'}
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="newIban">Новый расчётный счёт:</label>
                <input
                  id="newIban"
                  type="text"
                  className="modal-input"
                  placeholder="Введите новый расчётный счёт"
                  value={newIban}
                  onChange={(e) => {
                    setNewIban(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>

              {error && <p className="modal-error">{error}</p>}
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="modal-btn modal-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditBankAccountModal;
