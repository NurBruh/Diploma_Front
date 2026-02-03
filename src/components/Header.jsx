import React from 'react';
import './Header.css';

const Header = ({ onRefresh, onClearHistory }) => {
  return (
    <header className="header">
      <div className="header-content">
        <nav className="breadcrumb">
          <button className="nav-btn home-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 8v10h5v-6h6v6h5V8l-8-6z" fill="currentColor"/>
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
              <path d="M4 10a6 6 0 1 1 6 6v-2a4 4 0 1 0-4-4H4zm0 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Актуализировать
          </button>

          <button className="icon-btn clear-history-btn" title="Очистить историю" onClick={onClearHistory}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M8 6V4h4v2m-5 3v6m4-6v6M5 6l1 11h8l1-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
            <span className="profile-name">Менеджер ОР</span>
            <button className="profile-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor"/>
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
