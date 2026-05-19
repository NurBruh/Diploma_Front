import React, { useMemo } from 'react';

const percent = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const RoleStats = ({ students, filteredStudents, groupKey = 'department', groupLabel = 'Кафедры' }) => {
  const stats = useMemo(() => {
    const total = students.length;
    const shown = filteredStudents.length;
    const scholarship = students.filter(s => s.payment_type === 'Стипендия').length;
    const paid = students.filter(s => s.payment_type === 'Платник').length;

    const groups = new Map();
    students.forEach(student => {
      const name = student[groupKey] || 'Не указано';
      const current = groups.get(name) || { total: 0, scholarship: 0, paid: 0 };
      current.total += 1;
      if (student.payment_type === 'Стипендия') current.scholarship += 1;
      if (student.payment_type === 'Платник') current.paid += 1;
      groups.set(name, current);
    });

    const breakdown = Array.from(groups.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return { total, shown, scholarship, paid, breakdown };
  }, [students, filteredStudents, groupKey]);

  return (
    <section className="role-stats" aria-label="Статистика">
      <div className="role-stat-card">
        <span>Всего студентов</span>
        <strong>{stats.total}</strong>
      </div>
      <div className="role-stat-card">
        <span>Показано</span>
        <strong>{stats.shown}</strong>
      </div>
      <div className="role-stat-card">
        <span>Грантники</span>
        <strong>{stats.scholarship}</strong>
        <small>{percent(stats.scholarship, stats.total)}%</small>
      </div>
      <div className="role-stat-card">
        <span>Платники</span>
        <strong>{stats.paid}</strong>
        <small>{percent(stats.paid, stats.total)}%</small>
      </div>

      <div className="role-breakdown">
        <div className="role-breakdown__title">{groupLabel}</div>
        {stats.breakdown.length === 0 && <div className="role-breakdown__empty">Нет данных</div>}
        {stats.breakdown.map(item => (
          <div className="role-breakdown__row" key={item.name}>
            <div className="role-breakdown__label">
              <span>{item.name}</span>
              <strong>{item.total}</strong>
            </div>
            <div className="role-breakdown__bar">
              <span style={{ width: `${percent(item.total, stats.total)}%` }} />
            </div>
            <div className="role-breakdown__meta">
              <span>Грант {percent(item.scholarship, item.total)}%</span>
              <span>Платник {percent(item.paid, item.total)}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RoleStats;
