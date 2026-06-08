import React from 'react';
import { MdSearch } from 'react-icons/md';
import '../css/SearchFilters.css';

const SearchFilters = ({ filters, setFilters, onSearch, referenceData, currentUser, showDepartment = true }) => {
  const role = currentUser?.role;
  const isDepartmentHead = role === 'department_head';
  const isInstituteDirector = role === 'institute_director';
  const courseOptions = referenceData?.courses?.length
    ? referenceData.courses.map((c) => c.courseNumber ?? c.id ?? c)
    : [1, 2, 3, 4, 5];
  const grantTypeOptions = referenceData?.grantTypes?.length
    ? referenceData.grantTypes.map((g) => g.grantTypeName ?? g.name ?? g)
    : ['Государственный грант', 'Из собственных средств', 'Трехсторонняя форма обучения'];

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Заголовок в зависимости от роли
  const getTitle = () => {
    if (isDepartmentHead && currentUser?.scopeName)
      return `Обучающиеся — ${currentUser.scopeName}`;
    if (isInstituteDirector && currentUser?.scopeName)
      return `Обучающиеся — ${currentUser.scopeName}`;
    return 'Обучающиеся';
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
            {courseOptions.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
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

        {/* Институт: для директора и зав.кафедры область уже выбрана ролью */}
        {!isDepartmentHead && !isInstituteDirector && (
          <div className="filter-group">
            <label>Институт</label>
            <select
              value={filters.institute}
              onChange={(e) => {
                handleInputChange('institute', e.target.value);
                handleInputChange('department', '');
                handleInputChange('profession', '');
              }}
              className="filter-select"
            >
              <option value="">Все</option>
              {referenceData?.institutes?.map(inst => (
                <option key={inst.id} value={inst.instituteName}>{inst.instituteName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Кафедра: скрыта для зав.кафедры, показана для директора/эдвайзера */}
        {showDepartment && !isDepartmentHead && (
          <div className="filter-group">
            <label>Кафедра</label>
            <select
              value={filters.department}
              onChange={(e) => {
                handleInputChange('department', e.target.value);
                handleInputChange('profession', '');
              }}
              className="filter-select"
            >
              <option value="">Все</option>
              {referenceData?.departments?.map(dep => (
                <option key={dep.id} value={dep.departmentName}>{dep.departmentName}</option>
              ))}
            </select>
          </div>
        )}

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

        <div className="filter-group">
          <label>Тип гранта</label>
          <select
            value={filters.grantType}
            onChange={(e) => handleInputChange('grantType', e.target.value)}
            className="filter-select"
          >
            <option value="">Все</option>
            {grantTypeOptions.map((grantType) => (
              <option key={grantType} value={grantType}>{grantType}</option>
            ))}
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
