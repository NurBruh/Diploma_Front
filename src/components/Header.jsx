import React from 'react';
import { MdHome, MdVisibility, MdPerson, MdExitToApp, MdFactCheck } from 'react-icons/md';
import './Header.css';

const Header = ({ onRefresh, onLogout, onSyncToEpvo, syncLoading, currentUser, currentPage, onNavigate }) => {
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
          <button className="nav-btn home-btn" onClick={() => onNavigate && onNavigate('main')}>
            <MdHome size={20} />
          </button>
          <span className="separator">›</span>
          <button
            className={`nav-btn${currentPage !== 'comparison' ? ' active' : ''}`}
            onClick={() => onNavigate && onNavigate('main')}
          >
            {isAdvisor ? 'Мои студенты' : isRegistrar ? 'Стипендии ЕПВО' : 'Студенты института'}
          </button>
        </nav>

        <div className="header-actions">
          {isRegistrar && (
            <button
              className={`icon-btn compare-btn${currentPage === 'data-comparison' ? ' active-page' : ''}`}
              title="Сравнение данных ССО ↔ ЕПВО"
              onClick={() => onNavigate && onNavigate(currentPage === 'data-comparison' ? 'main' : 'data-comparison')}
            >
              <MdFactCheck size={20} />
              Сравнение данных
            </button>
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
