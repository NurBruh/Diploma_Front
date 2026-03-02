import React from 'react';
import { MdHome, MdRefresh, MdSync, MdVisibility, MdPerson, MdExitToApp, MdCompareArrows } from 'react-icons/md';
import './Header.css';

const Header = ({ onRefresh, onLogout, onSyncToEpvo, syncLoading, currentUser, currentPage, onNavigate }) => {
  const role = currentUser?.role;
  const isManager = role === 'manager_or';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'manager_or': return 'Менеджер ОР';
      case 'department_head': return 'Заведующий кафедры';
      case 'institute_director': return 'Директор института';
      default: return role || 'Пользователь';
    }
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
            Стипендии ЕПВО
          </button>
        </nav>

        <div className="header-actions">
          {isManager && (
            <button
              className={`icon-btn sync-epvo-btn${syncLoading ? ' syncing' : ''}`}
              title="Синхронизировать данные в ЕПВО"
              onClick={onSyncToEpvo}
              disabled={syncLoading}
            >
              <MdSync size={20} className={syncLoading ? 'spin' : ''} />
              {syncLoading ? 'Синхронизация...' : 'Синхр. в ЕПВО'}
            </button>
          )}

          {isManager && (
            <button
              className={`icon-btn compare-btn${currentPage === 'comparison' ? ' active-page' : ''}`}
              title="Сравнение ССО и ЕПВО"
              onClick={() => onNavigate && onNavigate(currentPage === 'comparison' ? 'main' : 'comparison')}
            >
              <MdCompareArrows size={20} />
              SSO vs ЕПВО
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
              <span className="profile-name">{currentUser?.username || 'Пользователь'}</span>
              <span className="profile-role">{getRoleLabel(currentUser?.role)}</span>
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
                    <div className="dropdown-username">{currentUser?.username}</div>
                    <div className="dropdown-email">{getRoleLabel(currentUser?.role)}</div>
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
