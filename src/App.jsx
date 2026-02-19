import { useState, useEffect } from 'react'
import { API_BASE_URL } from './services/api'
import Header from './components/Header'
import SearchFilters from './components/SearchFilters'
import ExportTools from './components/ExportTools'
import StudentsTable from './components/StudentsTable'
import Login from './components/Login'
import Register from './components/Register'
import SsoEpvoComparison from './components/SsoEpvoComparison'
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
  bank_account: '',
  iban: student.iban || '',
  deprivation_reasons: '',
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
  const [currentPage, setCurrentPage] = useState('main') // 'main' | 'comparison'
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
      iban: 'IBAN',
      deprivation_reasons: 'Причины лишения',
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
        showNotification('❌ Сессия истекла, войдите заново', 'error')
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
        showNotification('✅ Первичная загрузка данных', 'info')
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
              status: 'pending',
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
        showNotification(`✅ Данные обновлены! Обнаружено изменений: ${totalChanges}`, 'success')
      } else {
        showNotification('✅ Данные актуальны, изменений не обнаружено', 'info')
      }

    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
      showNotification('❌ Ошибка при загрузке данных с сервера', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Применить SSO изменения → синхронизировать в ЕПВО и отметить запись
  const handleApplySsoChange = async (studentId, recordId) => {
    await handleSyncToEpvo()
    const updated = { ...changeHistory }
    if (updated[studentId]) {
      updated[studentId] = updated[studentId].map(r =>
        r.id === recordId ? { ...r, status: 'applied' } : r
      )
      setChangeHistory(updated)
      localStorage.setItem('studentChangeHistory', JSON.stringify(updated))
    }
  }

  // Отложить SSO изменения — сохранить в истории для ручной синхронизации
  const handleRejectSsoChange = (studentId, recordId) => {
    const updated = { ...changeHistory }
    if (updated[studentId]) {
      updated[studentId] = updated[studentId].map(r =>
        r.id === recordId ? { ...r, status: 'deferred' } : r
      )
      setChangeHistory(updated)
      localStorage.setItem('studentChangeHistory', JSON.stringify(updated))
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
        showNotification('❌ Сессия истекла, войдите заново', 'error')
        return
      }

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`)
      }

      const data = await response.json()
      showNotification(`✅ ${data.message}`, 'success')
    } catch (error) {
      console.error('Ошибка синхронизации в ЕПВО:', error)
      showNotification('❌ Ошибка при синхронизации данных в ЕПВО', 'error')
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
    showNotification(`✅ Добро пожаловать, ${userData.username}!`, 'success')

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
    showNotification(`✅ Регистрация успешна! Добро пожаловать, ${userData.username}!`, 'success')

    fetchStudents()
  }

  // Обработчик выхода
  const handleLogout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    setStudents([])
    setFilteredStudents([])
    showNotification('✅ Вы вышли из системы', 'info')
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
          ) : (
            <>
              <SearchFilters
                filters={filters}
                setFilters={setFilters}
                onSearch={handleSearch}
                changeHistory={changeHistory}
                students={students}
                changesCount={getTotalChangesCount()}
                onApplySsoChange={handleApplySsoChange}
                onRejectSsoChange={handleRejectSsoChange}
              />
              <ExportTools />
              <StudentsTable
                students={filteredStudents}
                loading={loading}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
