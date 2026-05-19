import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import '../css/TableScrollSync.css';

const TableScrollSync = ({ children, className = '', bodyClassName = '' }) => {
  const topRef = useRef(null);
  const bodyRef = useRef(null);
  const topSpacerRef = useRef(null);
  const syncingRef = useRef(false);

  const updateSpacerWidth = useCallback(() => {
    if (!bodyRef.current) return;

    const width = `${bodyRef.current.scrollWidth}px`;
    if (topSpacerRef.current) topSpacerRef.current.style.width = width;
  }, []);

  useLayoutEffect(() => {
    updateSpacerWidth();
  }, [children, updateSpacerWidth]);

  useEffect(() => {
    updateSpacerWidth();

    const table = bodyRef.current?.querySelector('table');
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSpacerWidth) : null;
    if (observer && table) observer.observe(table);

    window.addEventListener('resize', updateSpacerWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSpacerWidth);
    };
  }, [updateSpacerWidth]);

  const syncScroll = (sourceRef) => {
    if (!sourceRef.current || syncingRef.current) return;

    syncingRef.current = true;
    const scrollLeft = sourceRef.current.scrollLeft;

    [topRef, bodyRef].forEach((targetRef) => {
      if (targetRef !== sourceRef && targetRef.current) {
        targetRef.current.scrollLeft = scrollLeft;
      }
    });

    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  return (
    <div className={`table-scroll-sync ${className}`.trim()}>
      <div
        className="table-scroll-sync__top"
        ref={topRef}
        onScroll={() => syncScroll(topRef)}
      >
        <div className="table-scroll-sync__spacer" ref={topSpacerRef} />
      </div>
      <div
        className={`table-scroll-sync__body ${bodyClassName}`.trim()}
        ref={bodyRef}
        onScroll={() => syncScroll(bodyRef)}
      >
        {children}
      </div>
    </div>
  );
};

export default TableScrollSync;
