import React from 'react';
import SearchFilters from '../../../components/SearchFilters';
import StudentsTable from '../../../components/StudentsTable';
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
  showDepartment = true,
  showBankColumns
}) => {
  return (
    <div className="role-dashboard">
      <header className="role-dashboard__header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <SearchFilters
        filters={filters}
        setFilters={setFilters}
        onSearch={onSearch}
        students={students}
        currentUser={currentUser}
        referenceData={referenceData}
        showDepartment={showDepartment}
      />

      <StudentsTable
        students={filteredStudents}
        loading={loading}
        onUpdateIban={null}
        onSendSelectedToEpvo={null}
        syncLoading={false}
        selectionKey={selectionKey}
        readOnly
        showDepartment={showDepartment}
        showBankColumns={showBankColumns}
      />
    </div>
  );
};

export default RoleDashboardView;
