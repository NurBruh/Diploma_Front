import React, { useState, useEffect } from 'react';
import { MdRefresh, MdCheckCircle } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import AuthService from '../services/AuthService';
import './LostScholarships.css';

/**
 * Вариант 1 — Лишённые стипендии из полей EPVO
 * Данные берутся из /Epvo/lost-scholarships (ScholarshipLostDate, ScholarshipNotes)
 */
const LostScholarshipsV1 = ({ showNotification }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = AuthService.getToken();
            const response = await fetch(`${API_BASE_URL}/Epvo/lost-scholarships`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            const json = await response.json();
            setData(json);
        } catch (e) {
            showNotification && showNotification('Ошибка при загрузке лишённых (В1)', 'error');
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

    return (
        <div className="lost-scholarships-page">
            <div className="lost-scholarships-header">
                <h2 className="lost-scholarships-title">Лишенные стипендии (Вариант 1)</h2>
                <p className="lost-scholarships-subtitle">
                    Данные из полей стипендии в ЕПВО (LostDate, OrderLostDate, Notes)
                </p>
                <div className="lost-scholarships-actions">
                    <button className="icon-btn-sm" onClick={fetchData} disabled={loading}>
                        <MdRefresh size={18} />
                        Обновить
                    </button>
                    <div className="lost-count-badge">
                        Всего: <strong>{data.length}</strong>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="lost-loading">Загрузка данных...</div>
            ) : data.length === 0 ? (
                <div className="lost-empty">
                    <MdCheckCircle size={48} color="#22c55e" />
                    <p>Нет лишённых стипендии</p>
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
                                <th>Дата приказа о лишении</th>
                                <th>Дата приказа о кандидате</th>
                                <th>Институт</th>
                                <th>Курс</th>
                                <th>Примечания</th>
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
                                        {item.scholarshipLostDate ? (
                                            <span className="lost-badge danger">{formatDate(item.scholarshipLostDate)}</span>
                                        ) : '—'}
                                    </td>
                                    <td>{formatDate(item.scholarshipOrderLostDate)}</td>
                                    <td>{formatDate(item.scholarshipOrderCandidateDate)}</td>
                                    <td>{item.faculty || '—'}</td>
                                    <td>{item.course}</td>
                                    <td className="notes-cell">{item.scholarshipNotes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LostScholarshipsV1;
