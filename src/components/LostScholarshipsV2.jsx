import React, { useState, useEffect } from 'react';
import { MdRefresh, MdCheckCircle, MdAdd } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import AuthService from '../services/AuthService';
import './LostScholarships.css';

/**
 * Вариант 2 — Лишённые стипендии из отдельной таблицы ScholarshipLossRecords
 * Данные берутся из /Epvo/loss-records
 */
const LostScholarshipsV2 = ({ showNotification }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        iin: '',
        lostDate: '',
        orderNumber: '',
        orderDate: '',
        reason: '',
        scholarshipName: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = AuthService.getToken();
            const response = await fetch(`${API_BASE_URL}/Epvo/loss-records`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            const json = await response.json();
            setData(json);
        } catch (e) {
            showNotification && showNotification('Ошибка при загрузке лишённых (В2)', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName || !form.iin || !form.lostDate) {
            showNotification && showNotification('Заполните обязательные поля: Фамилия, Имя, ИИН, Дата лишения', 'error');
            return;
        }

        setSaving(true);
        try {
            const token = AuthService.getToken();
            const payload = {
                ...form,
                lostDate: new Date(form.lostDate).toISOString(),
                orderDate: form.orderDate ? new Date(form.orderDate).toISOString() : null,
                middleName: form.middleName || null,
                orderNumber: form.orderNumber || null,
                reason: form.reason || null,
                scholarshipName: form.scholarshipName || null,
            };

            const response = await fetch(`${API_BASE_URL}/Epvo/loss-records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            showNotification && showNotification('Запись о лишении добавлена', 'success');
            setShowForm(false);
            setForm({
                firstName: '', lastName: '', middleName: '', iin: '',
                lostDate: '', orderNumber: '', orderDate: '', reason: '', scholarshipName: '',
            });
            await fetchData();
        } catch (e) {
            showNotification && showNotification('Ошибка при добавлении записи', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="lost-scholarships-page">
            <div className="lost-scholarships-header">
                <h2 className="lost-scholarships-title">Лишенные стипендии (Вариант 2)</h2>
                <p className="lost-scholarships-subtitle">
                    Отдельная таблица: ФИО, дата лишения, приказ, дата приказа, причина
                </p>
                <div className="lost-scholarships-actions">
                    <button className="icon-btn-sm" onClick={fetchData} disabled={loading}>
                        <MdRefresh size={18} />
                        Обновить
                    </button>
                    <button className="add-record-toggle" onClick={() => setShowForm(!showForm)}>
                        <MdAdd size={18} />
                        {showForm ? 'Скрыть форму' : 'Добавить запись'}
                    </button>
                    <div className="lost-count-badge">
                        Всего: <strong>{data.length}</strong>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="add-record-section">
                    <form className="add-record-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Фамилия *</label>
                            <input value={form.lastName} onChange={e => handleFieldChange('lastName', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Имя *</label>
                            <input value={form.firstName} onChange={e => handleFieldChange('firstName', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Отчество</label>
                            <input value={form.middleName} onChange={e => handleFieldChange('middleName', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>ИИН *</label>
                            <input value={form.iin} onChange={e => handleFieldChange('iin', e.target.value)} maxLength={12} required />
                        </div>
                        <div className="form-group">
                            <label>Дата лишения *</label>
                            <input type="date" value={form.lostDate} onChange={e => handleFieldChange('lostDate', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Номер приказа</label>
                            <input value={form.orderNumber} onChange={e => handleFieldChange('orderNumber', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Дата приказа</label>
                            <input type="date" value={form.orderDate} onChange={e => handleFieldChange('orderDate', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Стипендия</label>
                            <input value={form.scholarshipName} onChange={e => handleFieldChange('scholarshipName', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Причина лишения</label>
                            <textarea value={form.reason} onChange={e => handleFieldChange('reason', e.target.value)} />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="lost-loading">Загрузка данных...</div>
            ) : data.length === 0 ? (
                <div className="lost-empty">
                    <MdCheckCircle size={48} color="#22c55e" />
                    <p>Нет записей о лишении стипендии</p>
                </div>
            ) : (
                <div className="lost-table-wrapper">
                    <table className="lost-table">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>ФИО</th>
                                <th>ИИН</th>
                                <th>Стипендия</th>
                                <th>Дата лишения</th>
                                <th>Номер приказа</th>
                                <th>Дата приказа</th>
                                <th>Причина</th>
                                <th>Дата записи</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.lastName} {item.firstName} {item.middleName || ''}</td>
                                    <td>{item.iin}</td>
                                    <td>{item.scholarshipName || '—'}</td>
                                    <td>
                                        <span className="lost-badge danger">{formatDate(item.lostDate)}</span>
                                    </td>
                                    <td>{item.orderNumber || '—'}</td>
                                    <td>{formatDate(item.orderDate)}</td>
                                    <td className="reason-cell">{item.reason || '—'}</td>
                                    <td>{formatDate(item.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LostScholarshipsV2;
