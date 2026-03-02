import React from 'react';
import { MdSearch } from 'react-icons/md';
import './SearchFilters.css';

const SearchFilters = ({ filters, setFilters, onSearch, students, referenceData, currentUser }) => {
  const role = currentUser?.role;
  const isDepartmentHead = role === 'department_head';
  const isInstituteDirector = role === 'institute_director';

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Кафедры показываем ТОЛЬКО если выбран институт
  const filteredDepartments = filters.institute
    ? (referenceData?.departments?.filter(d => d.instituteName === filters.institute) || [])
    : [];

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
            <label>Кафедра</label>
            <select
              value={filters.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="filter-select"
              disabled={!filters.institute}
            >
              <option value="">{filters.institute ? 'Все кафедры' : 'Сначала выберите институт'}</option>
              {filteredDepartments.map(d => (
                <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
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
            <option value="Государственный образовательный грант">Государственный</option>
            <option value="Грант акимата">Грант акимата</option>
            <option value="Целевой грант">Целевой грант</option>
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
