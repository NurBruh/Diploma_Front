import React, { useState } from 'react';
import { MdSearch, MdHistory } from 'react-icons/md';
import { BsFillPencilFill } from "react-icons/bs";
import ChangeHistory from './ChangeHistory';
import './SearchFilters.css';

const SearchFilters = ({ filters, setFilters, onSearch, changeHistory, students, changesCount, onApplySsoChange, onRejectSsoChange }) => {
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
            <option value="Онлайн">Онлайн</option>
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
            <option value="Школа транспортной инженерии и логистики имени М. Тынышпаева">Школа транспортной инженерии и логистики имени М. Тынышпаева</option>
            <option value="Горно-металлургический институт имени О.А. Байконурова">Горно-металлургический институт имени О.А. Байконурова</option>
            <option value="Институт геологии и нефтегазового дела имени К.Т. Турысова">Институт геологии и нефтегазового дела имени К.Т. Турысова</option>
            <option value="ИАиИТ">ИАиИТ</option>
            <option value="Институт управления проектами имени Е. Туркебаева">Институт управления проектами имени Е. Туркебаева</option>
            <option value="Институт архитектуры и строительства имени Т.К. Басенова">Институт архитектуры и строительства имени Т.К. Басенова</option>
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
            <option value="Программная инженерия">Программная инженерия
            </option>
            <option value="Компьютерные системы">Компьютерные системы и информационные технологии</option>
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
            <option value="Ректорский">Ректорский</option>
          </select>
        </div>

        <div className="filter-group filter-button-group">
          <button onClick={onSearch} className="search-button">
            <MdSearch size={16} />
            ОТОБРАЗИТЬ
          </button>
          
          <button onClick={() => setShowHistory(true)} className="history-button">
            <MdHistory size={16} />
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
          onApplySsoChange={onApplySsoChange}
          onRejectSsoChange={onRejectSsoChange}
        />
      )}
    </div>
  );
};

export default SearchFilters;
