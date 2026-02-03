import React from 'react';
import './ExportTools.css';

const ExportTools = () => {
  const handleImport = () => {
    alert('Функция импорта из Excel будет реализована');
  };

  const handleExport = (format) => {
    alert(`Экспорт в формате ${format} будет реализован`);
  };

  return (
    <div className="export-tools">
      <button className="import-btn" onClick={handleImport}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v8m0 0l3-3m-3 3L5 7m9 7H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Импорт из Excel
      </button>

      <div className="export-group">
        <label>Формат экспорта</label>
        <div className="export-buttons">
          <select className="export-select">
            <option>Выберите формат</option>
            <option>Excel (.xlsx)</option>
            <option>PDF</option>
            <option>CSV</option>
          </select>
          <button className="export-btn" onClick={() => handleExport('выбранном')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14V6m0 0L5 9m3-3l3 3M2 2h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Экспорт
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportTools;
