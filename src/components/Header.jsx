import React from 'react';
import { MdHome, MdVisibility, MdPerson, MdExitToApp, MdFactCheck, MdPreview, MdHistory } from 'react-icons/md';
import { NavLink, Link } from 'react-router-dom';
import '../css/Header.css';

const Header = ({ onRefresh, onLogout, onSyncToEpvo, syncLoading, currentUser }) => {
  const role = currentUser?.role;
  const isRegistrar = role === 'registrar';
  const isAdvisor = role === 'advisor';

  const getRoleLabel = () => {
    return currentUser?.roleDisplayName || role || 'Пользователь';
  };

  return (
    <header className="header">
      <div className="header-content">
        <nav className="breadcrumb">
          <Link className="nav-btn home-btn" to="/">
            <MdHome size={20} />
          </Link>
          <span className="separator">›</span>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
          >
            {isAdvisor ? 'Мои студенты' : isRegistrar ? 'Стипендии ЕПВО' : 'Студенты института'}
          </NavLink>
        </nav>

        <div className="header-actions">
          {isRegistrar && (
            <NavLink
              to="/data-comparison"
              className={({ isActive }) => `icon-btn compare-btn${isActive ? ' active-page' : ''}`}
              title="Сравнение данных ССО ↔ ЕПВО"
            >
              <MdFactCheck size={20} />
              Сравнение данных
            </NavLink>
          )}

          {isRegistrar && (
            <NavLink
              to="/sync-preview"
              className={({ isActive }) => `icon-btn compare-btn${isActive ? ' active-page' : ''}`}
              title="Предпросмотр синхронизации"
            >
              <MdPreview size={20} />
              Предпросмотр
            </NavLink>
          )}

          {isRegistrar && (
            <NavLink
              to="/sync-history"
              className={({ isActive }) => `icon-btn compare-btn${isActive ? ' active-page' : ''}`}
              title="История синхронизации"
            >
              <MdHistory size={20} />
              История синхронизации
            </NavLink>
          )}

          {isRegistrar && (
            <NavLink
              to="/change-history"
              className={({ isActive }) => `icon-btn compare-btn${isActive ? ' active-page' : ''}`}
              title="История изменений полей"
            >
              <MdHistory size={20} />
              История изменений
            </NavLink>
          )}

          <button
            className="icon-btn"
            title="Версия для слабовидящих"
            onClick={() => {
              const icon = document.querySelector('._access-icon');
              if (icon) icon.click();
            }}
          >
            <MdVisibility size={20} />
            Версия для слабовидящих
          </button>

          <div className="profile">
            <div className="profile-info">
              <span className="profile-name">{currentUser?.fullName || 'Пользователь'}</span>
              <span className="profile-role">{getRoleLabel()}</span>
              {currentUser?.scopeName && (
                <span className="profile-scope" style={{ fontSize: '0.7rem', color: '#6b7280' }}>{currentUser.scopeName}</span>
              )}
            </div>
            <div className="profile-dropdown">
              <button className="profile-btn">
                <MdPerson size={24} />
              </button>
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-username">{currentUser?.fullName}</div>
                    <div className="dropdown-email">{getRoleLabel()}</div>
                    {currentUser?.scopeName && (
                      <div className="dropdown-scope" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{currentUser.scopeName}</div>
                    )}
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={onLogout}>
                  <MdExitToApp size={18} />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
