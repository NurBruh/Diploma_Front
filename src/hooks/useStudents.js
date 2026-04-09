import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../services';

const mapStudentFromBackend = (student) => ({
  id: student.studentId,
  full_name: student.fullName || '',
  iin: student.iinPlt || '',
  course: student.courseNumber,
  study_form: student.studyForm || '',
  faculty: student.facultyName || '',
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

export const useStudents = (showNotification, currentUser) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [previousData, setPreviousData] = useState({});
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
    const savedPreviousData = localStorage.getItem('previousStudentData');
    if (savedHistory) setChangeHistory(JSON.parse(savedHistory));
    if (savedPreviousData) setPreviousData(JSON.parse(savedPreviousData));
  }, []);

  const detectChanges = (oldData, newData) => {
    const changes = [];
    const fieldsToCheck = {
      full_name: 'ФИО',
      iin: 'ИИН',
      course: 'Курс',
      study_form: 'Форма обучения',
      faculty: 'Факультет',
      profession: 'Профессия',
      specialization: 'Специализация',
      payment_type: 'Тип оплаты',
      grant_type: 'Тип гранта',
      bank_account: 'Расчетный счёт',
      study_language: 'Язык обучения'
    };

    for (const [key, label] of Object.entries(fieldsToCheck)) {
      if (String(oldData[key] || '') !== String(newData[key] || '')) {
        changes.push({
          field: label,
          oldValue: oldData[key] || 'Не указано',
          newValue: newData[key] || 'Не указано'
        });
      }
    }
    return changes;
  };

  const fetchStudents = async (user = currentUser) => {
    if (!user) return;
    setLoading(true);
    try {
      const savedData = localStorage.getItem('previousStudentData');
      let localDataArray = savedData ? JSON.parse(savedData) : [];

      let url;
      if (user.role === 'advisor') {
        url = `${API_BASE_URL}/Auth/advisor/${user.userId}/students`;
      } else if (user.role === 'institute_director') {
        url = `${API_BASE_URL}/Auth/director/${user.userId}/students`;
      } else {
        url = `${API_BASE_URL}/Epvo/students`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

      const backendData = await response.json();
      const ssoDataArray = backendData.map(mapStudentFromBackend);

      if (localDataArray.length === 0) {
        localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray));
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
      localStorage.setItem('studentChangeHistory', JSON.stringify(updatedHistory));
      localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray));

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
  };

  const handleSyncToEpvo = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Epvo/sync-to-epvo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const data = await response.json();
      if (showNotification) showNotification(`${data.message}`, 'success');
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
      setPreviousData({});
      localStorage.removeItem('studentChangeHistory');
      localStorage.removeItem('previousStudentData');
      alert('История изменений очищена. Нажмите "Актуализировать" для сохранения текущих данных как базовых.');
    }
  };

  const getTotalChangesCount = () => {
    let total = 0;
    Object.values(changeHistory).forEach(studentHistory => { total += studentHistory.length; });
    return total;
  };

  const handleSendSelectedToEpvo = async (selectedIINs) => {
    if (!selectedIINs || selectedIINs.length === 0) {
      if (showNotification) showNotification(' Выберите хотя бы одного студента', 'error');
      return;
    }
    setSyncLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Epvo/sync-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iinS: selectedIINs })
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/Epvo/students/${iin}/iban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newIban })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Ошибка сервера: ${response.status}`);
    }
    const updateList = (list) => list.map(s => s.iin === iin ? { ...s, bank_account: newIban } : s);
    setStudents(prev => updateList(prev));
    setFilteredStudents(prev => updateList(prev));
    if (showNotification) showNotification('✅ Расчётный счёт обновлён в ССО. Актуализируйте данные в «ССО vs ЕПВО»', 'info');
  };

  return {
    students,
    filteredStudents,
    loading,
    syncLoading,
    changeHistory,
    previousData,
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
  };
};
