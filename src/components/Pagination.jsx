import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, className = '', infoText }) => {
  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className={`pagination-row ${className}`.trim()}>
      <button
        className="page-btn"
        onClick={() => onPageChange(1)}
        disabled={safePage === 1}
      >«</button>
      <button
        className="page-btn"
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage === 1}
      >‹</button>
      <span className="page-info">
        {infoText || `Стр. ${safePage} / ${totalPages}`}
      </span>
      <button
        className="page-btn"
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage === totalPages}
      >›</button>
      <button
        className="page-btn"
        onClick={() => onPageChange(totalPages)}
        disabled={safePage === totalPages}
      >»</button>
    </div>
  );
};

export default Pagination;
