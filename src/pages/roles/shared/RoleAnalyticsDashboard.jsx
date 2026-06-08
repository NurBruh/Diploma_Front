import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../../utils/authFetch';
import '../../../css/RoleDashboard.css';

const labelOrEmpty = (value) => value || 'Не указано';
const emptyDashboard = {
  totalStudents: 0,
  grantStudents: 0,
  paidStudents: 0,
  departments: [],
  specialities: []
};

const percent = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const getDashboardPath = (user) => {
  if (user?.role === 'institute_director') return `/Auth/director/${user.userId}/dashboard`;
  if (user?.role === 'department_head') return `/Auth/department-head/${user.userId}/dashboard`;
  return null;
};

const buildSpecialities = (students) => {
  const map = new Map();

  students.forEach((student) => {
    const name = labelOrEmpty(student.specialization || student.profession);
    const item = map.get(name) || {
      name,
      totalStudents: 0,
      grantStudents: 0,
      paidStudents: 0,
      students: []
    };
    item.totalStudents += 1;
    if (student.payment_type === 'Стипендия') item.grantStudents += 1;
    else item.paidStudents += 1;
    item.students.push(student);
    map.set(name, item);
  });

  return Array.from(map.values()).sort((a, b) => b.totalStudents - a.totalStudents);
};

const buildDepartments = (students) => {
  const map = new Map();

  students.forEach((student) => {
    const name = labelOrEmpty(student.department);
    const item = map.get(name) || {
      name,
      totalStudents: 0,
      grantStudents: 0,
      paidStudents: 0,
      sourceStudents: []
    };
    item.totalStudents += 1;
    if (student.payment_type === 'Стипендия') item.grantStudents += 1;
    else item.paidStudents += 1;
    item.sourceStudents.push(student);
    map.set(name, item);
  });

  return Array.from(map.values())
    .map((department) => ({
      ...department,
      specialities: buildSpecialities(department.sourceStudents),
      sourceStudents: undefined
    }))
    .sort((a, b) => b.totalStudents - a.totalStudents);
};

const buildDashboardFromStudents = (students, mode) => {
  const totalStudents = students.length;
  const grantStudents = students.filter((student) => student.payment_type === 'Стипендия').length;
  const base = {
    totalStudents,
    grantStudents,
    paidStudents: Math.max(0, totalStudents - grantStudents),
    departments: [],
    specialities: []
  };

  if (mode === 'department') {
    return { ...base, specialities: buildSpecialities(students) };
  }

  return { ...base, departments: buildDepartments(students) };
};

const PaymentSplit = ({ grantStudents, paidStudents, totalStudents }) => (
  <div className="analytics-split">
    <span>Грант {percent(grantStudents, totalStudents)}%</span>
    <span>Платное {percent(paidStudents, totalStudents)}%</span>
  </div>
);

const getStudentValue = (student, camelKey, snakeKey) => student?.[camelKey] ?? student?.[snakeKey];

const DashboardStudentRows = ({ students }) => {
  const safeStudents = students || [];

  if (safeStudents.length === 0) {
    return <div className="analytics-empty analytics-empty--compact">Нет студентов для отображения</div>;
  }

  return (
    <div className="analytics-students">
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>ФИО</th>
            <th>Курс</th>
            <th>Институт</th>
            <th>Кафедра</th>
            <th>Специальность</th>
            <th>Тип обучения</th>
            <th>Тип оплаты</th>
            <th>Тип гранта</th>
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>
          {safeStudents.map((student, index) => (
            <tr key={getStudentValue(student, 'studentId', 'id') || `${getStudentValue(student, 'iinPlt', 'iin')}-${index}`}>
              <td>{index + 1}</td>
              <td>{getStudentValue(student, 'fullName', 'full_name') || '-'}</td>
              <td>{getStudentValue(student, 'courseNumber', 'course') || '-'}</td>
              <td>{getStudentValue(student, 'facultyName', 'faculty') || '-'}</td>
              <td>{getStudentValue(student, 'departmentName', 'department') || '-'}</td>
              <td>
                {getStudentValue(student, 'specialization', 'specialization')
                  || getStudentValue(student, 'professionName', 'profession')
                  || '-'}
              </td>
              <td>{getStudentValue(student, 'studyForm', 'study_form') || '-'}</td>
              <td>{getStudentValue(student, 'paymentType', 'payment_type') || '-'}</td>
              <td>{getStudentValue(student, 'grantType', 'grant_type') || '-'}</td>
              <td>{getStudentValue(student, 'gpa', 'gpa') ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SpecialityBlock = ({ speciality, total }) => {
  const share = percent(speciality.totalStudents, total);

  return (
    <details className="analytics-speciality">
      <summary>
        <div>
          <strong>{speciality.name}</strong>
          <span>{speciality.totalStudents} студентов · {share}%</span>
        </div>
        <div className="analytics-bar" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </div>
      </summary>
      <PaymentSplit
        grantStudents={speciality.grantStudents}
        paidStudents={speciality.paidStudents}
        totalStudents={speciality.totalStudents}
      />
      <DashboardStudentRows students={speciality.students} />
    </details>
  );
};

const DepartmentBlock = ({ department, total }) => {
  const share = percent(department.totalStudents, total);

  return (
    <details className="analytics-department" open>
      <summary>
        <div>
          <strong>{department.name}</strong>
          <span>{department.totalStudents} студентов · {share}% от института</span>
        </div>
        <div className="analytics-bar" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </div>
      </summary>
      <PaymentSplit
        grantStudents={department.grantStudents}
        paidStudents={department.paidStudents}
        totalStudents={department.totalStudents}
      />
      <div className="analytics-specialities">
        {department.specialities.map((speciality) => (
          <SpecialityBlock
            key={speciality.name}
            speciality={speciality}
            total={department.totalStudents}
          />
        ))}
      </div>
    </details>
  );
};

const RoleAnalyticsDashboard = ({
  currentUser,
  students,
  mode
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Основной источник dashboard - быстрый агрегированный API.
  // Fallback нужен только если API временно не ответил: тогда строим картину из уже загруженной таблицы.
  const fallbackDashboard = useMemo(
    () => buildDashboardFromStudents(students || [], mode),
    [students, mode]
  );

  useEffect(() => {
    const path = getDashboardPath(currentUser);
    if (!path) {
      setDashboardData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    authFetch.get(path)
      .then((response) => {
        if (cancelled) return;
        setDashboardData(response.data || emptyDashboard);
      })
      .catch((error) => {
        console.error('Ошибка загрузки dashboard:', error);
        if (!cancelled) setDashboardData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const data = dashboardData || fallbackDashboard;

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
          <strong>{loading ? '...' : data.totalStudents}</strong>
        </div>
        <div className="role-stat-card">
          <span>Грантники</span>
          <strong>{loading ? '...' : data.grantStudents}</strong>
        </div>
        <div className="role-stat-card">
          <span>Платное</span>
          <strong>{loading ? '...' : data.paidStudents}</strong>
        </div>
      </section>

      {data.totalStudents === 0 && !loading && (
        <div className="analytics-empty">Нет студентов для отображения</div>
      )}

      {mode === 'department' ? (
        <section className="analytics-list">
          {data.specialities.map((speciality) => (
            <SpecialityBlock
              key={speciality.name}
              speciality={speciality}
              total={data.totalStudents}
            />
          ))}
        </section>
      ) : (
        <section className="analytics-list">
          {data.departments.map((department) => (
            <DepartmentBlock
              key={department.name}
              department={department}
              total={data.totalStudents}
            />
          ))}
        </section>
      )}

    </div>
  );
};

export default RoleAnalyticsDashboard;
