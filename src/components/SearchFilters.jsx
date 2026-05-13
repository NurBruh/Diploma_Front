import React from 'react';
import { MdSearch } from 'react-icons/md';
import '../css/SearchFilters.css';

const SearchFilters = ({ filters, setFilters, onSearch, referenceData, currentUser }) => {
  const role = currentUser?.role;
  const isDepartmentHead = role === 'department_head';
  const isInstituteDirector = role === 'institute_director';

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Заголовок в зависимости от роли
  const getTitle = () => {
    if (isDepartmentHead && currentUser?.scopeName)
      return `Обучающиеся на гранте — ${currentUser.scopeName}`;
    if (isInstituteDirector && currentUser?.scopeName)
      return `Обучающиеся на гранте — ${currentUser.scopeName}`;
    return 'Обучающиеся на гранте';
  };

  return (
    <div className="filters-container">
      <h2 className="filters-title">{getTitle()}</h2>
      
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
            <option value="5">5</option>
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
            {referenceData?.studyForms?.map(sf => (
              <option key={sf.id} value={sf.studyFormName}>{sf.studyFormName}</option>
            ))}
          </select>
        </div>

        {/* Институт: скрыт для зав.кафедры, зафиксирован для директора, свободен для менеджера */}
        {!isDepartmentHead && (
          <div className="filter-group">
            <label>Институт</label>
            <select
              value={filters.institute}
              onChange={(e) => {
                handleInputChange('institute', e.target.value);
                handleInputChange('department', '');
              }}
              className="filter-select"
              disabled={isInstituteDirector}
            >
              <option value="">Все</option>
              {referenceData?.institutes?.map(inst => (
                <option key={inst.id} value={inst.instituteName}>{inst.instituteName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Кафедра: скрыта для зав.кафедры, показана для директора и менеджера */}
        {!isDepartmentHead && (
  <div className="filter-group">
    <label>Профессия</label>
    <select
      value={filters.profession}
      onChange={(e) => handleInputChange('profession', e.target.value)}
      className="filter-select"
    >
      <option value="">Все</option>
      {referenceData?.professions?.map(p => (
        <option key={p.id} value={p.professionName}>{p.professionName}</option>
      ))}
    </select>
  </div>
)}

        <div className="filter-group">
          <label>Тип гранта</label>
          <select
            value={filters.grantType}
            onChange={(e) => handleInputChange('grantType', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            <option value="Государственный грант">Государственный грант</option>
            <option value="Из собственных средств">Из собственных средств</option>
            <option value="Трехсторонняя форма обучения">Трехсторонняя форма обучения</option>
          </select>
        </div>

        <div className="filter-group filter-button-group">
          <button onClick={onSearch} className="search-button">
            <MdSearch size={16} />
            ОТОБРАЗИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
