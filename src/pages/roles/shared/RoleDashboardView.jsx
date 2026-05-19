import React from 'react';
import SearchFilters from '../../../components/SearchFilters';
import StudentsTable from '../../../components/StudentsTable';
import RoleStats from './RoleStats';
import '../../../css/RoleDashboard.css';

const RoleDashboardView = ({
  title,
  subtitle,
  currentUser,
  students,
  filteredStudents,
  loading,
  filters,
  setFilters,
  onSearch,
  referenceData,
  selectionKey,
  showBankColumns,
  groupKey,
  groupLabel
}) => {
  return (
    <div className="role-dashboard">
      <header className="role-dashboard__header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <RoleStats
        students={students}
        filteredStudents={filteredStudents}
        groupKey={groupKey}
        groupLabel={groupLabel}
      />

      <SearchFilters
        filters={filters}
        setFilters={setFilters}
        onSearch={onSearch}
        students={students}
        currentUser={currentUser}
        referenceData={referenceData}
      />

      <StudentsTable
        students={filteredStudents}
        loading={loading}
        onUpdateIban={null}
        onSendSelectedToEpvo={null}
        syncLoading={false}
        selectionKey={selectionKey}
        readOnly
        showBankColumns={showBankColumns}
      />
    </div>
  );
};

export default RoleDashboardView;
