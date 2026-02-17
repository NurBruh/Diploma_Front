import React from 'react';
import './Header.css';

const Header = ({ onRefresh, onClearHistory, onLogout, onSyncToEpvo, syncLoading, currentUser }) => {
  return (
    <header className="header">
      <div className="header-content">
        <nav className="breadcrumb">
          <button className="nav-btn home-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 8v10h5v-6h6v6h5V8l-8-6z" fill="currentColor" />
            </svg>
          </button>
          <span className="separator">›</span>
          <button className="nav-btn">Страница Менеджера ОР</button>
          <span className="separator">›</span>
          <button className="nav-btn active">Студенты</button>
        </nav>

        <div className="header-actions">
          <button className="icon-btn refresh-btn" title="Обновить данные" onClick={onRefresh}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10a6 6 0 1 1 6 6v-2a4 4 0 1 0-4-4H4zm0 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Актуализировать
          </button>

          <button
            className={`icon-btn sync-epvo-btn${syncLoading ? ' syncing' : ''}`}
            title="Синхронизировать данные в ЕПВО"
            onClick={onSyncToEpvo}
            disabled={syncLoading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={syncLoading ? 'spin' : ''}>
              <path d="M3 10a7 7 0 0 1 12.45-4.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 10a7 7 0 0 1-12.45 4.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 2l1.45 3.64L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 18l-1.45-3.64L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {syncLoading ? 'Синхронизация...' : 'Синхр. в ЕПВО'}
          </button>

          <button className="icon-btn clear-history-btn" title="Очистить историю" onClick={onClearHistory}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M8 6V4h4v2m-5 3v6m4-6v6M5 6l1 11h8l1-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Очистить историю
          </button>

          <button className="icon-btn" title="Версия для слабовидящих">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeJoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Версия для слабовидящих
          </button>

          <div className="lang-selector">
            <button className="lang-btn active">Қаз</button>
            <button className="lang-btn">Рус</button>
            <button className="lang-btn">Eng</button>
          </div>

          <div className="profile">
            <span className="profile-name">{currentUser?.username || 'Менеджер ОР'}</span>
            <div className="profile-dropdown">
              <button className="profile-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="currentColor" />
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-username">{currentUser?.username}</div>
                    <div className="dropdown-email">{currentUser?.role || 'Пользователь'}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={onLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
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
