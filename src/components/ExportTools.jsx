import React from 'react';
import { MdFileDownload, MdFileUpload } from 'react-icons/md';
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
        <MdFileDownload size={16} />
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
            <MdFileUpload size={16} />
            Экспорт
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportTools;
