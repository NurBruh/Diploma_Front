import React, { useState } from 'react';
import ChangeHistory from './ChangeHistory';
import './SearchFilters.css';

const SearchFilters = ({ filters, setFilters, onSearch, changeHistory, students, changesCount }) => {
  const [showHistory, setShowHistory] = useState(false);
  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="filters-container">
      <h2 className="filters-title">Обучающиеся на гранте</h2>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label>ФИО студента</label>
          <input
            type="text"
            placeholder="Поиск..."
            value={filters.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>ИИН студента</label>
          <input
            type="text"
            placeholder="Поиск..."
            value={filters.iin}
            onChange={(e) => handleInputChange('iin', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Курс</label>
          <select
            value={filters.course}
            onChange={(e) => handleInputChange('course', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Форма обучения</label>
          <select
            value={filters.studyForm}
            onChange={(e) => handleInputChange('studyForm', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="Очная">Очная</option>
            <option value="Заочная">Заочная</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Институт</label>
          <select
            value={filters.institute}
            onChange={(e) => handleInputChange('institute', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="ИИиС">ИИиС</option>
            <option value="ИАиИТ">ИАиИТ</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Кафедра</label>
          <select
            value={filters.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="Программная инженерия">Программная инженерия (*)
            </option>
            <option value="Компьютерные системы">Компьютерные системы и информационные технологии (*)</option>
            <option value="Архитектура">Архитектура</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Тип гранта</label>
          <select
            value={filters.grantType}
            onChange={(e) => handleInputChange('grantType', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="Государственный">Государственный</option>
            <option value="Академический">Академический</option>
            <option value="Ректорский">Ректорский</option>
            <option value="Лицей">Лицей</option>
          </select>
        </div>

        <div className="filter-group filter-button-group">
          <button onClick={onSearch} className="search-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            ОТОБРАЗИТЬ
          </button>
          
          <button onClick={() => setShowHistory(true)} className="history-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-.5 2v3.5l3 1.5.5-1-2.5-1.25V5h-1z" fill="currentColor"/>
            </svg>
            ИСТОРИЯ ИЗМЕНЕНИЙ
            {changesCount > 0 && (
              <span className="changes-badge">{changesCount}</span>
            )}
          </button>
        </div>
      </div>

      {showHistory && (
        <ChangeHistory 
          changeHistory={changeHistory}
          students={students}
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
};

export default SearchFilters;
