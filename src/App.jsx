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
    filters,
    setFilters,
    loadHistoryFromStorage,
    fetchStudents,
    handleSearch,
    handleSyncToEpvo,
    handleClearHistory,
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
    fetchStudents(currentUser);
  };

  const isRegistrar = currentUser?.role === 'registrar';
  const isReadOnly = !isRegistrar;

  const referenceData = useMemo(() => ({
    studyForms: [...new Set(students.map(s => s.study_form).filter(Boolean))].map((sf, i) => ({ id: i, studyFormName: sf })),
    institutes: [...new Set(students.map(s => s.faculty).filter(Boolean))].map((f, i) => ({ id: i, instituteName: f })),
    professions: [...new Set(students.map(s => s.profession).filter(Boolean))].map((p, i) => ({ id: i, professionName: p })),
  }), [students]);

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
            <Route path="/" element={
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
                />

                <StudentsTable
                  students={filteredStudents}
                  loading={loading}
                  onUpdateIban={isReadOnly ? null : handleUpdateIban}
                  onSendSelectedToEpvo={isReadOnly ? null : handleSendSelectedToEpvo}
                  syncLoading={syncLoading}
                  selectionKey={selectionKey}
                  readOnly={isReadOnly}
                />
              </>
            } />
            
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
