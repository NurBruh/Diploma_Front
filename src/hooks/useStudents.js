import { useState, useCallback, useEffect } from 'react';
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

const getRoleStudentsPath = (user) => {
  if (!user) return null;
  if (user.role === 'advisor') return `/Auth/advisor/${user.userId}/students`;
  if (user.role === 'institute_director') return `/Auth/director/${user.userId}/students`;
  if (user.role === 'department_head') return `/Auth/department-head/${user.userId}/students`;
  return '/Epvo/students';
};

const getRoleFilterPath = (user) => {
  if (!user) return null;
  if (user.role === 'advisor') return `/Auth/advisor/${user.userId}/students/filters`;
  if (user.role === 'institute_director') return `/Auth/director/${user.userId}/students/filters`;
  if (user.role === 'department_head') return `/Auth/department-head/${user.userId}/students/filters`;
  if (user.role === 'registrar') return '/Epvo/students/filters';
  return null;
};

export const useStudents = (showNotification, currentUser) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentPagination, setStudentPagination] = useState(emptyPagination);
  const [filterOptions, setFilterOptions] = useState(null);
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

  const buildStudentQueryParams = (user, options = {}) => {
    const params = {
      page: options.page ?? studentPagination.page ?? 1,
      pageSize: options.pageSize ?? REGISTRAR_PAGE_SIZE,
      fullName: filters.fullName || undefined,
      iin: filters.iin || undefined,
      course: filters.course || undefined,
      studyForm: filters.studyForm || undefined,
      institute: user?.role === 'institute_director' || user?.role === 'department_head'
        ? undefined
        : (filters.institute || undefined),
      department: user?.role === 'department_head'
        ? undefined
        : (filters.department || undefined),
      profession: filters.profession || undefined,
      grantType: filters.grantType || undefined
    };

    return params;
  };

  const fetchFilterOptions = useCallback(async (user = currentUser) => {
    const path = getRoleFilterPath(user);
    if (!path) {
      setFilterOptions(null);
      return;
    }

    try {
      const response = await authFetch.get(path, {
        params: {
          institute: user?.role === 'advisor' || user?.role === 'registrar'
            ? (filters.institute || undefined)
            : undefined,
          department: user?.role !== 'department_head' ? (filters.department || undefined) : undefined
        }
      });
      setFilterOptions(response.data || null);
    } catch (error) {
      console.error('Ошибка при загрузке фильтров:', error);
      setFilterOptions(null);
    }
  }, [currentUser, filters.institute, filters.department]);

  useEffect(() => {
    if (!currentUser) {
      setFilterOptions(null);
      return;
    }

    fetchFilterOptions(currentUser);
  }, [currentUser, filters.institute, filters.department, fetchFilterOptions]);

  const fetchStudents = async (user = currentUser, options = {}) => {
    if (!user) return;
    setLoading(true);
    try {
      const savedData = localStorage.getItem('previousStudentData');
      let localDataArray = savedData ? JSON.parse(savedData) : [];

      const path = getRoleStudentsPath(user);
      let requestConfig;
      const isRegistrar = user.role === 'registrar';
      const usesServerPagination = user.role === 'registrar'
        || user.role === 'advisor'
        || user.role === 'institute_director'
        || user.role === 'department_head';

      if (usesServerPagination) {
        requestConfig = {
          params: buildStudentQueryParams(user, options)
        };
      }

      const response = await authFetch.get(path, requestConfig);

      const backendData = response.data;
      const backendItems = Array.isArray(backendData)
        ? backendData
        : (backendData?.items ?? []);

      const mappedData = backendItems.map(mapStudentFromBackend);
      const ssoDataArray = isRegistrar
        ? mappedData.filter(isSupportedGrantStudent)
        : mappedData;

      if (usesServerPagination && !Array.isArray(backendData)) {
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
    fetchStudents(currentUser, { page: 1 });
    setSelectionKey(prev => prev + 1);
  };

  const clearStudents = () => {
    setStudents([]);
    setFilteredStudents([]);
    setStudentPagination(emptyPagination);
    setFilterOptions(null);
  };

  const handleStudentPageChange = (page) => {
    fetchStudents(currentUser, { page });
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
  };
};
