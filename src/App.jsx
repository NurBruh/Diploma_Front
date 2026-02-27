import { useState, useEffect } from 'react'
import { API_BASE_URL } from './services/api'
import Header from './components/Header'
import SearchFilters from './components/SearchFilters'
import ExportTools from './components/ExportTools'
import StudentsTable from './components/StudentsTable'
import SsoEpvoComparison from './components/SsoEpvoComparison'
import LostScholarshipsV1 from './components/LostScholarshipsV1'
import LostScholarshipsV2 from './components/LostScholarshipsV2'
import Login from './components/Login'
import Register from './components/Register'
import AuthService from './services/AuthService'
import './App.css'

// Маппинг данных из бэкенда (camelCase) в формат фронтенда (snake_case)
const mapStudentFromBackend = (student) => ({
  id: student.id,
  first_name: student.firstName || '',
  last_name: student.lastName || '',
  patronymic: student.middleName || '',
  iin: student.iin || '',
  course: student.course,
  study_form: student.educationForm || '',        // будет пустым из EPVO
  institute: student.faculty || '',
  grant_type: student.grantName || '',            // раньше было grants[0].name
  has_scholarship: student.hasScholarship ? 'Да' : 'Нет',
  scholarship_status: student.hasScholarship ? 'Активна' : 'Неактивна',
  bank_account: student.iban || '',
  notes: student.scholarshipNotes || '',
  curriculum_specialty: student.speciality || ''
})

function App() {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [previousData, setPreviousData] = useState({})
  const [changeHistory, setChangeHistory] = useState({})
  const [notification, setNotification] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState('main')
  const [selectionKey, setSelectionKey] = useState(0)
  const [filters, setFilters] = useState({
    fullName: '',
    iin: '',
    course: '',
    studyForm: '',
    institute: '',
    department: '',
    grantType: ''
  })

  // Проверка авторизации при монтировании
  useEffect(() => {
    const authenticated = AuthService.isAuthenticated()
    setIsAuthenticated(authenticated)

    if (authenticated) {
      const user = AuthService.getCurrentUser()
      setCurrentUser(user)

      // Загрузка данных только для авторизованных пользователей
      const savedHistory = localStorage.getItem('studentChangeHistory')
      const savedPreviousData = localStorage.getItem('previousStudentData')

      if (savedHistory) {
        setChangeHistory(JSON.parse(savedHistory))
      }
      if (savedPreviousData) {
        setPreviousData(JSON.parse(savedPreviousData))
      }

      fetchStudents()
    }
  }, [])

  const detectChanges = (oldData, newData) => {
    const changes = []
    const fieldsToCheck = {
      first_name: 'Имя',
      last_name: 'Фамилия',
      patronymic: 'Отчество',
      course: 'Курс',
      study_form: 'Форма обучения',
      institute: 'Институт',
      grant_type: 'Тип гранта',
      has_scholarship: 'Стипендия',
      scholarship_status: 'Статус стипендии',
      bank_account: 'Расчетный счёт',
      notes: 'Примечания',
      curriculum_specialty: 'Специальность'
    }

    for (const [key, label] of Object.entries(fieldsToCheck)) {
      if (String(oldData[key] || '') !== String(newData[key] || '')) {
        changes.push({
          field: label,
          oldValue: oldData[key] || 'Не указано',
          newValue: newData[key] || 'Не указано'
        })
      }
    }

    return changes
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // 1. Получаем сохраненные данные из localStorage (предыдущее состояние)
      const savedData = localStorage.getItem('previousStudentData')
      let localDataArray = savedData ? JSON.parse(savedData) : []

      // 2. Получаем актуальные данные из бэкенда
      const token = AuthService.getToken()
      const response = await fetch(`${API_BASE_URL}/Epvo/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        // Токен истёк — разлогиниваем
        AuthService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        showNotification('Сессия истекла, войдите заново', 'error')
        return
      }

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`)
      }

      const backendData = await response.json()

      // Маппим данные из формата бэкенда в формат фронтенда
      const ssoDataArray = backendData.map(mapStudentFromBackend)

      // ============================================================
      // ЗАКОММЕНТИРОВАННЫЙ КОД: получение данных из mokky.dev (мок-API)
      // В дальнейшем может понадобиться — оставляем как справку
      // ============================================================
      // const ssoResponse = await axios.get('https://84ec8b151116fab6.mokky.dev/front')
      // const ssoDataArray = ssoResponse.data
      // ============================================================

      // Если это первая загрузка, сохраняем данные как базовые
      if (localDataArray.length === 0) {
        localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray))
        setStudents(ssoDataArray)
        setFilteredStudents(ssoDataArray)
        showNotification('Первичная загрузка данных', 'info')
        return
      }

      // Создаем мапу старых данных для быстрого поиска
      const localDataMap = {}
      localDataArray.forEach(st => localDataMap[st.id] = st)

      // Проверяем изменения
      const updatedHistory = { ...changeHistory }
      let totalChanges = 0

      ssoDataArray.forEach(student => {
        const studentId = student.id

        // Сравниваем с предыдущим состоянием
        if (localDataMap[studentId]) {
          const changes = detectChanges(localDataMap[studentId], student)

          if (changes.length > 0) {
            totalChanges++

            if (!updatedHistory[studentId]) {
              updatedHistory[studentId] = []
            }

            // Добавляем новую запись в историю
            updatedHistory[studentId].unshift({
              id: Date.now(),
              date: new Date().toLocaleString('ru-RU'),
              editor: 'Система (SSO)',
              changes: changes
            })

            if (updatedHistory[studentId].length > 10) {
              updatedHistory[studentId] = updatedHistory[studentId].slice(0, 10)
            }
          }
        }
      })

      // Сохраняем историю и обновляем базовые данные
      setChangeHistory(updatedHistory)
      localStorage.setItem('studentChangeHistory', JSON.stringify(updatedHistory))
      localStorage.setItem('previousStudentData', JSON.stringify(ssoDataArray))

      // В таблице показываем актуальные данные
      setStudents(ssoDataArray)
      setFilteredStudents(ssoDataArray)

      if (totalChanges > 0) {
        showNotification(`Данные обновлены! Обнаружено изменений: ${totalChanges}`, 'success')
      } else {
        showNotification('Данные актуальны, изменений не обнаружено', 'info')
      }

    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
      showNotification('Ошибка при загрузке данных с сервера', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    let filtered = [...students]

    // Фильтрация по ФИО
    if (filters.fullName) {
      filtered = filtered.filter(student => {
        const fullName = `${student.last_name} ${student.first_name} ${student.patronymic}`.toLowerCase()
        return fullName.includes(filters.fullName.toLowerCase())
      })
    }

    // Фильтрация по ИИН
    if (filters.iin) {
      filtered = filtered.filter(student => {
        const iin = student.iin || student.id || ''
        return iin.toString().includes(filters.iin)
      })
    }

    // Фильтрация по курсу
    if (filters.course) {
      filtered = filtered.filter(student =>
        student.course?.toString() === filters.course
      )
    }

    // Фильтрация по форме обучения
    if (filters.studyForm) {
      filtered = filtered.filter(student =>
        student.study_form === filters.studyForm
      )
    }

    // Фильтрация по институту
    if (filters.institute) {
      filtered = filtered.filter(student =>
        student.institute?.includes(filters.institute)
      )
    }

    // Фильтрация по типу гранта
    if (filters.grantType) {
      filtered = filtered.filter(student =>
        student.grant_type === filters.grantType
      )
    }

    setFilteredStudents(filtered)
    setSelectionKey(prev => prev + 1)  // сбрасываем чекбоксы
  }

  const handleRefresh = () => {
    fetchStudents()
  }

  // Синхронизация данных SSO → ЕПВО
  const handleSyncToEpvo = async () => {
    setSyncLoading(true)
    try {
      const token = AuthService.getToken()
      const response = await fetch(`${API_BASE_URL}/Epvo/sync-to-epvo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        AuthService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        showNotification(' Сессия истекла, войдите заново', 'error')
        return
      }

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`)
      }

      const data = await response.json()
      showNotification(`${data.message}`, 'success')
    } catch (error) {
      console.error('Ошибка синхронизации в ЕПВО:', error)
      showNotification('Ошибка при синхронизации данных в ЕПВО', 'error')
    } finally {
      setSyncLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Очистить всю историю изменений? Это действие нельзя отменить.')) {
      setChangeHistory({})
      setPreviousData({})
      localStorage.removeItem('studentChangeHistory')
      localStorage.removeItem('previousStudentData')
      alert('История изменений очищена. Нажмите "Актуализировать" для сохранения текущих данных как базовых.')
    }
  }

  const getTotalChangesCount = () => {
    let total = 0
    Object.values(changeHistory).forEach(studentHistory => {
      total += studentHistory.length
    })
    return total
  }

  // Обработчик успешной авторизации
  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setCurrentUser(userData)
    setShowRegister(false)
    showNotification(`Добро пожаловать, ${userData.username}!`, 'success')

    // Загружаем данные после авторизации
    const savedHistory = localStorage.getItem('studentChangeHistory')
    const savedPreviousData = localStorage.getItem('previousStudentData')

    if (savedHistory) {
      setChangeHistory(JSON.parse(savedHistory))
    }
    if (savedPreviousData) {
      setPreviousData(JSON.parse(savedPreviousData))
    }

    fetchStudents()
  }

  // Обработчик успешной регистрации
  const handleRegister = (userData) => {
    setIsAuthenticated(true)
    setCurrentUser(userData)
    setShowRegister(false)
    showNotification(`Регистрация успешна! Добро пожаловать, ${userData.username}!`, 'success')

    fetchStudents()
  }

  // Обработчик выхода
  const handleLogout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    setStudents([])
    setFilteredStudents([])
    showNotification('Вы вышли из системы', 'info')
  }

  // Отправка выбранных студентов (чекбокс) в ЕПВО как массив
  const handleSendSelectedToEpvo = async (selectedIINs) => {
    if (!selectedIINs || selectedIINs.length === 0) {
      showNotification(' Выберите хотя бы одного студента', 'error')
      return
    }
    setSyncLoading(true)
    try {
      const token = AuthService.getToken()
      const response = await fetch(`${API_BASE_URL}/Epvo/sync-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ iinS: selectedIINs })
      })

      if (response.status === 401) {
        AuthService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        showNotification('Сессия истекла, войдите заново', 'error')
        return
      }

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`)
      }

      const data = await response.json()
      showNotification(`${data.message || `Отправлено ${data.syncedCount} студентов в ЕПВО`}`, 'success')
      // Перезагружаем таблицу чтобы увидеть обновлённые данные
      await fetchStudents()
    } catch (error) {
      console.error('Ошибка отправки в ЕПВО:', error)
      showNotification('Ошибка при отправке выбранных студентов в ЕПВО', 'error')
    } finally {
      setSyncLoading(false)
    }
  }

  // Обновление расчётного счёта (IBAN) студента в ЕПВО
  const handleUpdateIban = async (iin, newIban) => {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/Epvo/students/${iin}/iban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newIban })
    })

    if (response.status === 401) {
      AuthService.logout()
      setIsAuthenticated(false)
      setCurrentUser(null)
      showNotification('Сессия истекла, войдите заново', 'error')
      throw new Error('Сессия истекла')
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `Ошибка сервера: ${response.status}`)
    }

    // Обновляем локальные данные
    const updateList = (list) =>
      list.map(s => s.iin === iin ? { ...s, bank_account: newIban } : s)

    setStudents(prev => updateList(prev))
    setFilteredStudents(prev => updateList(prev))
    showNotification('✅ Расчётный счёт обновлён в ССО. Актуализируйте данные в «ССО vs ЕПВО»', 'info')
  }

  // Если пользователь не авторизован, показываем форму авторизации/регистрации
  if (!isAuthenticated) {
    return (
      <>
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}
        {showRegister ? (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </>
    )
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
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="main-content">
        <div className="container">
          {currentPage === 'comparison' ? (
            <SsoEpvoComparison
              onSyncToEpvo={handleSyncToEpvo}
              syncLoading={syncLoading}
              showNotification={showNotification}
            />
          ) : currentPage === 'lost-v1' ? (
            <LostScholarshipsV1 showNotification={showNotification} />
          ) : currentPage === 'lost-v2' ? (
            <LostScholarshipsV2 showNotification={showNotification} />
          ) : (
            <>
              <SearchFilters
                filters={filters}
                setFilters={setFilters}
                onSearch={handleSearch}
                changeHistory={changeHistory}
                students={students}
                changesCount={getTotalChangesCount()}
              />
              <ExportTools />
              <div style={{
                display: 'flex', gap: '10px', margin: '0 0 12px 0'
              }}>
                <button
                  onClick={() => setCurrentPage(currentPage === 'lost-v1' ? 'main' : 'lost-v1')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 18px', borderRadius: '8px', border: '1px solid #d1d5db',
                    background: currentPage === 'lost-v1' ? '#dc2626' : '#fff',
                    color: currentPage === 'lost-v1' ? '#fff' : '#374151',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Лишённые (В1)
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage === 'lost-v2' ? 'main' : 'lost-v2')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 18px', borderRadius: '8px', border: '1px solid #d1d5db',
                    background: currentPage === 'lost-v2' ? '#dc2626' : '#fff',
                    color: currentPage === 'lost-v2' ? '#fff' : '#374151',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Лишённые (В2)
                </button>
              </div>
              <StudentsTable
                students={filteredStudents}
                loading={loading}
                onUpdateIban={handleUpdateIban}
                onSendSelectedToEpvo={handleSendSelectedToEpvo}
                syncLoading={syncLoading}
                selectionKey={selectionKey}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
