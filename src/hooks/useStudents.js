import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../services/api'
import AuthService from '../services/AuthService'
import { mapStudentFromBackend } from '../utils/studentMapper'

export const useStudents = ({ showNotification, currentUser, onUnauthorized }) => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [referenceData, setReferenceData] = useState(null)
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

  // Для директора института — предустанавливаем фильтр по его институту
  useEffect(() => {
    if (currentUser?.role === 'institute_director' && currentUser?.scopeName) {
      setFilters(prev => ({ ...prev, institute: currentUser.scopeName }))
    }
  }, [currentUser])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const token = AuthService.getToken()
      const response = await fetch(`${API_BASE_URL}/Epvo/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        onUnauthorized?.()
        return
      }

      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`)

      const backendData = await response.json()
      const mapped = backendData.map(mapStudentFromBackend)
      setStudents(mapped)
      setFilteredStudents(mapped)
      showNotification('Данные загружены', 'info')
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
      showNotification('Ошибка при загрузке данных с сервера', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchReferenceData = async () => {
    try {
      const token = AuthService.getToken()
      const response = await fetch(`${API_BASE_URL}/ReferenceData`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setReferenceData(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки справочных данных:', error)
    }
  }

  const handleSearch = () => {
    let filtered = [...students]

    if (filters.fullName) {
      filtered = filtered.filter(student => {
        const fullName = `${student.last_name} ${student.first_name} ${student.patronymic}`.toLowerCase()
        return fullName.includes(filters.fullName.toLowerCase())
      })
    }

    if (filters.iin) {
      filtered = filtered.filter(student =>
        (student.iin || student.id || '').toString().includes(filters.iin)
      )
    }

    if (filters.course) {
      filtered = filtered.filter(student =>
        student.course?.toString() === filters.course
      )
    }

    if (filters.studyForm) {
      filtered = filtered.filter(student =>
        student.study_form === filters.studyForm
      )
    }

    if (filters.institute) {
      filtered = filtered.filter(student =>
        student.institute?.includes(filters.institute)
      )
    }

    if (filters.department && referenceData?.specialities) {
      const specsInDept = referenceData.specialities
        .filter(s => s.departmentName === filters.department)
        .map(s => s.specialityName.toLowerCase())
      filtered = filtered.filter(student => {
        const spec = (student.curriculum_specialty || '').toLowerCase()
        return specsInDept.some(s => spec.includes(s) || s.includes(spec))
      })
    }

    if (filters.grantType) {
      filtered = filtered.filter(student =>
        student.grant_type === filters.grantType
      )
    }

    setFilteredStudents(filtered)
    setSelectionKey(prev => prev + 1)
  }

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
      onUnauthorized?.()
      throw new Error('Сессия истекла')
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `Ошибка сервера: ${response.status}`)
    }

    const updateList = (list) =>
      list.map(s => s.iin === iin ? { ...s, bank_account: newIban } : s)

    setStudents(prev => updateList(prev))
    setFilteredStudents(prev => updateList(prev))
    showNotification('✅ Расчётный счёт обновлён в ССО. Актуализируйте данные в «ССО vs ЕПВО»', 'info')
  }

  const clearStudents = () => {
    setStudents([])
    setFilteredStudents([])
  }

  return {
    students,
    filteredStudents,
    loading,
    filters,
    setFilters,
    referenceData,
    selectionKey,
    fetchStudents,
    fetchReferenceData,
    handleSearch,
    handleUpdateIban,
    clearStudents
  }
}
