import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import StudentsTable from './components/StudentsTable';
import StudentComparison from './components/StudentComparison';
import SyncPreview from './components/SyncPreview';
import SyncHistory from './components/SyncHistory';
import ChangeHistory from './components/ChangeHistory';
import Login from './components/Login';
import AdvisorDashboard from './pages/roles/advisor/AdvisorDashboard';
import InstituteDirectorDashboard from './pages/roles/instituteDirector/InstituteDirectorDashboard';
import DepartmentHeadDashboard from './pages/roles/departmentHead/DepartmentHeadDashboard';
import RoleAnalyticsDashboard from './pages/roles/shared/RoleAnalyticsDashboard';

import { useNotification } from './hooks/useNotification';
import { useAuth } from './hooks/useAuth';
import { useStudents } from './hooks/useStudents';

import './css/App.css';

function App() {
  const { notification, showNotification } = useNotification();
  const {
    isAuthenticated,
    currentUser,
    handleLogin: authLogin,
    handleLogout: authLogout
  } = useAuth(showNotification);

  const {
    students,
    filteredStudents,
    loading,
    syncLoading,
    changeHistory,
    selectionKey,
    studentPagination,
    filterOptions,
    filters,
    setFilters,
    loadHistoryFromStorage,
    fetchStudents,
    handleSearch,
    handleSyncToEpvo,
    handleClearHistory,
    handleStudentPageChange,
    getTotalChangesCount,
    handleSendSelectedToEpvo,
    handleUpdateIban,
    clearStudents
  } = useStudents(showNotification, currentUser);

  // Загружаем студентов после успешной авторизации или при загрузке, если уже авторизованы
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadHistoryFromStorage();
      fetchStudents(currentUser);
    }
  }, [isAuthenticated, currentUser]);

  const handleLogin = (userData) => {
    authLogin(userData);
    loadHistoryFromStorage();
  };

  const handleLogout = () => {
    authLogout();
    clearStudents();
  };

  const handleRefresh = () => {
    fetchStudents(currentUser, { page: isRegistrar ? studentPagination.page : 1 });
  };

  const isRegistrar = currentUser?.role === 'registrar';
  const isReadOnly = !isRegistrar;
  const canViewRoleDashboard = currentUser?.role === 'institute_director'
    || currentUser?.role === 'department_head';

  const fallbackReferenceData = useMemo(() => {
    const studyFormsSet = new Set();
    const institutesSet = new Set();
    const departmentsSet = new Set();
    const professionsSet = new Set();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (s.study_form) studyFormsSet.add(s.study_form);
      if (s.faculty) institutesSet.add(s.faculty);
      if (s.department) departmentsSet.add(s.department);
      if (s.profession) professionsSet.add(s.profession);
    }

    return {
      studyForms: Array.from(studyFormsSet).map((sf, i) => ({ id: i, studyFormName: sf })),
      institutes: Array.from(institutesSet).map((f, i) => ({ id: i, instituteName: f })),
      departments: Array.from(departmentsSet).map((d, i) => ({ id: i, departmentName: d })),
      professions: Array.from(professionsSet).map((p, i) => ({ id: i, professionName: p })),
    };
  }, [students]);

  const referenceData = filterOptions || fallbackReferenceData;

  const rolePageProps = {
    currentUser,
    students,
    filteredStudents,
    loading,
    filters,
    setFilters,
    onSearch: handleSearch,
    referenceData,
    selectionKey,
    studentPagination,
    onPageChange: handleStudentPageChange
  };

  const renderHome = () => {
    if (currentUser?.role === 'advisor') {
      return <AdvisorDashboard {...rolePageProps} />;
    }

    if (currentUser?.role === 'institute_director') {
      return <InstituteDirectorDashboard {...rolePageProps} />;
    }

    if (currentUser?.role === 'department_head') {
      return <DepartmentHeadDashboard {...rolePageProps} />;
    }

    return (
      <>
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          changeHistory={changeHistory}
          students={students}
          changesCount={getTotalChangesCount()}
          currentUser={currentUser}
          referenceData={referenceData}
          showDepartment={false}
        />

        <StudentsTable
          students={filteredStudents}
          loading={loading}
          onUpdateIban={isReadOnly ? null : handleUpdateIban}
          onSendSelectedToEpvo={isReadOnly ? null : handleSendSelectedToEpvo}
          syncLoading={syncLoading}
          selectionKey={selectionKey}
          serverPagination={studentPagination}
          onPageChange={handleStudentPageChange}
          readOnly={isReadOnly}
          showDepartment={false}
          showBankColumns
        />
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <>
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="app">
      <Header
        onRefresh={handleRefresh}
        onClearHistory={handleClearHistory}
        onLogout={handleLogout}
        onSyncToEpvo={handleSyncToEpvo}
        syncLoading={syncLoading}
        currentUser={currentUser}
      />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={renderHome()} />

            {canViewRoleDashboard && (
              <Route
                path="/dashboard"
                element={
                  <RoleAnalyticsDashboard
                    currentUser={currentUser}
                    students={students}
                    mode={currentUser?.role === 'department_head' ? 'department' : 'institute'}
                  />
                }
              />
            )}
            
            {isRegistrar && (
              <>
                <Route path="/data-comparison" element={
                  <StudentComparison
                    showNotification={showNotification}
                  />
                } />
                <Route path="/sync-preview" element={
                  <SyncPreview showNotification={showNotification} />
                } />
                <Route path="/sync-history" element={
                  <SyncHistory showNotification={showNotification} />
                } />
                <Route path="/change-history" element={
                  <ChangeHistory showNotification={showNotification} />
                } />
              </>
            )}

            {/* Запасной роут (если URL не найден или нет прав) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
