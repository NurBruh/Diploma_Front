import React from 'react';
import { MdHome, MdRefresh, MdSync, MdVisibility, MdPerson, MdExitToApp } from 'react-icons/md';
import './Header.css';

const Header = ({ onRefresh, onClearHistory, onLogout, onSyncToEpvo, syncLoading, currentUser }) => {
  return (
    <header className="header">
      <div className="header-content">
        <nav className="breadcrumb">
          <button className="nav-btn home-btn">
            <MdHome size={20} />
          </button>
          <span className="separator">›</span>
          <button className="nav-btn">Cтипендии ЕПВО</button>
          {/* <span className="separator">›</span>
          <button className="nav-btn active">Студенты</button> */}
        </nav>

        <div className="header-actions">
          <button className="icon-btn refresh-btn" title="Обновить данные" onClick={onRefresh}>
            <MdRefresh size={20} />
            Актуализировать
          </button>

          <button
            className={`icon-btn sync-epvo-btn${syncLoading ? ' syncing' : ''}`}
            title="Синхронизировать данные в ЕПВО"
            onClick={onSyncToEpvo}
            disabled={syncLoading}
          >
            <MdSync size={20} className={syncLoading ? 'spin' : ''} />
            {syncLoading ? 'Синхронизация...' : 'Синхр. в ЕПВО'}
          </button>

          {/* <button className="icon-btn clear-history-btn" title="Очистить историю" onClick={onClearHistory}>
            <MdDeleteSweep size={20} />
            Очистить историю
          </button> */}

          <button className="icon-btn" title="Версия для слабовидящих">
            <MdVisibility size={20} />
            Версия для слабовидящих
          </button>

          <div className="lang-selector">
            <button className="lang-btn active">Қаз</button>
            <button className="lang-btn">Рус</button>
            <button className="lang-btn">Eng</button>
          </div>

          <div className="profile">
            <div className="profile-info">
              <span className="profile-name">{currentUser?.username || 'Менеджер ОР'}</span>
              <span className="profile-role">{currentUser?.role || 'Пользователь'}</span>
            </div>
            <div className="profile-dropdown">
              <button className="profile-btn">
                <MdPerson size={24} />
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
