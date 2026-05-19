import React, { useMemo } from 'react';
import '../../../css/RoleDashboard.css';

const labelOrEmpty = (value) => value || 'Не указано';

const percent = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const buildSpecialities = (students) => {
  const map = new Map();

  students.forEach((student) => {
    const name = labelOrEmpty(student.specialization || student.profession);
    const item = map.get(name) || { name, students: [] };
    item.students.push(student);
    map.set(name, item);
  });

  return Array.from(map.values()).sort((a, b) => b.students.length - a.students.length);
};

const buildDepartments = (students) => {
  const map = new Map();

  students.forEach((student) => {
    const name = labelOrEmpty(student.department);
    const item = map.get(name) || { name, students: [] };
    item.students.push(student);
    map.set(name, item);
  });

  return Array.from(map.values())
    .map((department) => ({
      ...department,
      specialities: buildSpecialities(department.students)
    }))
    .sort((a, b) => b.students.length - a.students.length);
};

const PaymentSplit = ({ students }) => {
  const scholarship = students.filter((student) => student.payment_type === 'Стипендия').length;
  const paid = students.filter((student) => student.payment_type === 'Платник').length;

  return (
    <div className="analytics-split">
      <span>Грант {percent(scholarship, students.length)}%</span>
      <span>Платник {percent(paid, students.length)}%</span>
    </div>
  );
};

const StudentsMiniTable = ({ students }) => (
  <div className="analytics-students">
    <table>
      <thead>
        <tr>
          <th>ФИО</th>
          <th>ИИН</th>
          <th>Курс</th>
          <th>Тип оплаты</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td>{student.full_name || '—'}</td>
            <td className="analytics-mono">{student.iin || '—'}</td>
            <td>{student.course || '—'}</td>
            <td>{student.payment_type || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SpecialityBlock = ({ speciality, total }) => {
  const share = percent(speciality.students.length, total);

  return (
    <details className="analytics-speciality">
      <summary>
        <div>
          <strong>{speciality.name}</strong>
          <span>{speciality.students.length} студентов · {share}%</span>
        </div>
        <div className="analytics-bar" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </div>
      </summary>
      <PaymentSplit students={speciality.students} />
      <StudentsMiniTable students={speciality.students} />
    </details>
  );
};

const DepartmentBlock = ({ department, total }) => {
  const share = percent(department.students.length, total);

  return (
    <details className="analytics-department" open>
      <summary>
        <div>
          <strong>{department.name}</strong>
          <span>{department.students.length} студентов · {share}% от института</span>
        </div>
        <div className="analytics-bar" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </div>
      </summary>
      <PaymentSplit students={department.students} />
      <div className="analytics-specialities">
        {department.specialities.map((speciality) => (
          <SpecialityBlock
            key={speciality.name}
            speciality={speciality}
            total={department.students.length}
          />
        ))}
      </div>
    </details>
  );
};

const RoleAnalyticsDashboard = ({ currentUser, students, mode }) => {
  const data = useMemo(() => {
    if (mode === 'department') {
      return { specialities: buildSpecialities(students) };
    }

    return { departments: buildDepartments(students) };
  }, [mode, students]);

  const title = mode === 'department' ? 'Дашборд кафедры' : 'Дашборд института';
  const subtitle = currentUser?.scopeName || currentUser?.fullName;

  return (
    <div className="role-dashboard analytics-page">
      <header className="role-dashboard__header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <section className="analytics-summary">
        <div className="role-stat-card">
          <span>Всего студентов</span>
          <strong>{students.length}</strong>
        </div>
        <div className="role-stat-card">
          <span>Грантники</span>
          <strong>{students.filter((student) => student.payment_type === 'Стипендия').length}</strong>
        </div>
        <div className="role-stat-card">
          <span>Платники</span>
          <strong>{students.filter((student) => student.payment_type === 'Платник').length}</strong>
        </div>
      </section>

      {students.length === 0 && (
        <div className="analytics-empty">Нет студентов для отображения</div>
      )}

      {mode === 'department' ? (
        <section className="analytics-list">
          {data.specialities.map((speciality) => (
            <SpecialityBlock
              key={speciality.name}
              speciality={speciality}
              total={students.length}
            />
          ))}
        </section>
      ) : (
        <section className="analytics-list">
          {data.departments.map((department) => (
            <DepartmentBlock
              key={department.name}
              department={department}
              total={students.length}
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default RoleAnalyticsDashboard;
