import { useState, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';

const mapStudentFromBackend = (student) => ({
  id: student.studentId,
  full_name: student.fullName || '',
  iin: student.iinPlt || '',
  course: student.courseNumber,
  study_form: student.studyForm || '',
  faculty: student.facultyName || '',
  department: student.departmentName || '',
  profession: student.professionName || '',
  specialization: student.specialization || '',
  payment_type: student.paymentType || '',
  has_scholarship: student.paymentType === 'Стипендия' ? 'Да' : 'Нет',
  gpa: student.gpa ?? null,
  study_language: student.studyLanguage || '',
  sex: student.sex || '',
  grant_type: student.grantType || '',
  bank_account: student.iic || '',
  update_date: student.updateDate || '',
  university_id: student.universityId,
});

const isValidKazakhstanIin = (iin) => /^\d{12}$/.test((iin || '').trim());

const isSupportedGrantStudent = (student) => (
  student.payment_type === 'Стипендия'
  && isValidKazakhstanIin(student.iin)
);

const FIELDS_TO_CHECK = {
  full_name: 'ФИО',
  iin: 'ИИН',
  course: 'Курс',
  study_form: 'Форма обучения',
  faculty: 'Факультет',
  department: 'Кафедра',
  profession: 'Профессия',
  specialization: 'Специализация',
  payment_type: 'Тип оплаты',
  grant_type: 'Тип гранта',
  bank_account: 'Расчетный счёт',
  study_language: 'Язык обучения'
};
const FIELDS_KEYS = Object.keys(FIELDS_TO_CHECK);
const REGISTRAR_PAGE_SIZE = 50;

const emptyPagination = {
  enabled: false,
  page: 1,
  pageSize: REGISTRAR_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1
};

export const useStudents = (showNotification, currentUser) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentPagination, setStudentPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [changeHistory, setChangeHistory] = useState({});
  const [selectionKey, setSelectionKey] = useState(0);
  const [filters, setFilters] = useState({
    fullName: '',
    iin: '',
    course: '',
    studyForm: '',
    institute: '',
    department: '',
    profession: '',
    grantType: ''
  });

  const loadHistoryFromStorage = useCallback(() => {
    const savedHistory = localStorage.getItem('studentChangeHistory');
    if (savedHistory) setChangeHistory(JSON.parse(savedHistory));
  }, []);

  const detectChanges = (oldData, newData) => {
    const changes = [];
    for (let i = 0; i < FIELDS_KEYS.length; i++) {
      const key = FIELDS_KEYS[i];
      if (String(oldData[key] || '') !== String(newData[key] || '')) {
        changes.push({
          field: FIELDS_TO_CHECK[key],
          oldValue: oldData[key] || 'Не указано',
          newValue: newData[key] || 'Не указано'
        });
      }
    }
    return changes;
  };

  const fetchStudents = async (user = currentUser, options = {}) => {
    if (!user) return;
    setLoading(true);
    try {
      const savedData = localStorage.getItem('previousStudentData');
      let localDataArray = savedData ? JSON.parse(savedData) : [];

      let path;
      let requestConfig;
      const isRegistrar = user.role === 'registrar';
      if (user.role === 'advisor') {
        path = `/Auth/advisor/${user.userId}/students`;
      } else if (user.role === 'institute_director') {
        path = `/Auth/director/${user.userId}/students`;
      } else if (user.role === 'department_head') {
        path = `/Auth/department-head/${user.userId}/students`;
      } else {
        path = '/Epvo/students';
        requestConfig = {
          params: {
            page: options.page ?? studentPagination.page ?? 1,
            pageSize: REGISTRAR_PAGE_SIZE,
            fullName: filters.fullName || undefined,
            iin: filters.iin || undefined,
            course: filters.course || undefined,
            studyForm: filters.studyForm || undefined,
            institute: filters.institute || undefined,
            department: filters.department || undefined,
            profession: filters.profession || undefined,
            grantType: filters.grantType || undefined
          }
        };
      }

      const response = await authFetch.get(path, requestConfig);

      const backendData = response.data;
      const backendItems = Array.isArray(backendData)
        ? backendData
        : (backendData?.items ?? []);

      const ssoDataArray = backendItems
        .map(mapStudentFromBackend)
        .filter(isSupportedGrantStudent);

      if (isRegistrar && !Array.isArray(backendData)) {
        setStudentPagination({
          enabled: true,
          page: backendData.page || 1,
          pageSize: backendData.pageSize || REGISTRAR_PAGE_SIZE,
          totalItems: backendData.totalItems || 0,
          totalPages: backendData.totalPages || 1
        });
      } else {
        setStudentPagination(emptyPagination);
      }

      if (localDataArray.length === 0) {
        try { localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray)); } catch { /* localStorage may be unavailable */ }
        setStudents(ssoDataArray);
        setFilteredStudents(ssoDataArray);
        if (showNotification) showNotification('Первичная загрузка данных', 'info');
        return;
      }

      const localDataMap = {};
      localDataArray.forEach(st => localDataMap[st.id] = st);

      const updatedHistory = { ...changeHistory };
      let totalChanges = 0;

      ssoDataArray.forEach(student => {
        const studentId = student.id;
        if (localDataMap[studentId]) {
          const changes = detectChanges(localDataMap[studentId], student);
          if (changes.length > 0) {
            totalChanges++;
            if (!updatedHistory[studentId]) updatedHistory[studentId] = [];
            updatedHistory[studentId].unshift({
              id: Date.now(),
              date: new Date().toLocaleString('ru-RU'),
              editor: 'Система (SSO)',
              changes: changes
            });
            if (updatedHistory[studentId].length > 10) {
              updatedHistory[studentId] = updatedHistory[studentId].slice(0, 10);
            }
          }
        }
      });

      setChangeHistory(updatedHistory);
      try { localStorage.setItem('studentChangeHistory', JSON.stringify(updatedHistory)); } catch { /* localStorage may be unavailable */ }
      try { localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray)); } catch { /* localStorage may be unavailable */ }

      setStudents(ssoDataArray);
      setFilteredStudents(ssoDataArray);

      if (showNotification) {
        if (totalChanges > 0) {
          showNotification(`Данные обновлены! Обнаружено изменений: ${totalChanges}`, 'success');
        } else {
          showNotification('Данные актуальны, изменений не обнаружено', 'info');
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (showNotification) showNotification('Ошибка при загрузке данных с сервера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (currentUser?.role === 'registrar') {
      fetchStudents(currentUser, { page: 1 });
      setSelectionKey(prev => prev + 1);
      return;
    }

    let filtered = [...students];
    if (filters.fullName) {
      filtered = filtered.filter(student => (student.full_name || '').toLowerCase().includes(filters.fullName.toLowerCase()));
    }
    if (filters.iin) {
      filtered = filtered.filter(student => (student.iin || '').toString().includes(filters.iin));
    }
    if (filters.course) {
      filtered = filtered.filter(student => student.course?.toString() === filters.course);
    }
    if (filters.studyForm) {
      filtered = filtered.filter(student => student.study_form === filters.studyForm);
    }
    if (filters.institute) {
      filtered = filtered.filter(student => student.faculty?.includes(filters.institute));
    }
    if (filters.department) {
      filtered = filtered.filter(student => (student.department || '').includes(filters.department));
    }
    if (filters.profession) {
      filtered = filtered.filter(student => (student.profession || '').includes(filters.profession));
    }
    if (filters.grantType) {
      filtered = filtered.filter(student => student.grant_type === filters.grantType);
    }
    setFilteredStudents(filtered);
    setSelectionKey(prev => prev + 1);
  };

  const clearStudents = () => {
    setStudents([]);
    setFilteredStudents([]);
    setStudentPagination(emptyPagination);
  };

  const handleStudentPageChange = (page) => {
    if (currentUser?.role === 'registrar') {
      fetchStudents(currentUser, { page });
    }
  };

  const handleSyncToEpvo = async () => {
    setSyncLoading(true);
    try {
      const res = await authFetch.post('/Epvo/sync-to-epvo');
      if (showNotification) showNotification(`${res.data.message}`, 'success');
    } catch (error) {
      console.error('Ошибка синхронизации в ЕПВО:', error);
      if (showNotification) showNotification('Ошибка при синхронизации данных в ЕПВО', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Очистить всю историю изменений? Это действие нельзя отменить.')) {
      setChangeHistory({});
      localStorage.removeItem('studentChangeHistory');
      localStorage.removeItem('previousStudentData');
      alert('История изменений очищена. Нажмите «Актуализировать» для сохранения текущих данных как базовых.');
    }
  };

  const getTotalChangesCount = () => {
    let total = 0;
    Object.values(changeHistory).forEach(studentHistory => { total += studentHistory.length; });
    return total;
  };

  const handleSendSelectedToEpvo = async (selectedIINs) => {
    if (!selectedIINs || selectedIINs.length === 0) {
      if (showNotification) showNotification('Выберите хотя бы одного студента', 'error');
      return;
    }
    setSyncLoading(true);
    try {
      const res = await authFetch.post('/Epvo/sync-batch', { iinS: selectedIINs });
      const data = res.data;
      if (showNotification) showNotification(`${data.message || `Отправлено ${data.syncedCount} студентов в ЕПВО`}`, 'success');
      await fetchStudents(currentUser);
    } catch (error) {
      console.error('Ошибка отправки в ЕПВО:', error);
      if (showNotification) showNotification('Ошибка при отправке выбранных студентов в ЕПВО', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleUpdateIban = async (iin, newIban) => {
    await authFetch.patch(`/Epvo/students/${iin}/iban`, { newIban });
    const updateList = (list) => list.map(s => s.iin === iin ? { ...s, bank_account: newIban } : s);
    setStudents(prev => updateList(prev));
    setFilteredStudents(prev => updateList(prev));
    if (showNotification) showNotification('Расчётный счёт сохранён в STUDENT_TEMP. Для отправки используйте предпросмотр синхронизации.', 'info');
  };

  return {
    students,
    filteredStudents,
    loading,
    syncLoading,
    changeHistory,
    selectionKey,
    studentPagination,
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
  };
};
