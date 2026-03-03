import { useState } from 'react'
import { API_BASE_URL } from '../services/api'
import AuthService from '../services/AuthService'

export const useSync = ({ showNotification, onUnauthorized, fetchStudents }) => {
  const [syncLoading, setSyncLoading] = useState(false)

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
        onUnauthorized?.()
        return
      }

      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`)

      const data = await response.json()
      showNotification(`${data.message}`, 'success')
    } catch (error) {
      console.error('Ошибка синхронизации в ЕПВО:', error)
      showNotification('Ошибка при синхронизации данных в ЕПВО', 'error')
    } finally {
      setSyncLoading(false)
    }
  }

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
        onUnauthorized?.()
        return
      }

      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`)

      const data = await response.json()
      showNotification(`${data.message || `Отправлено ${data.syncedCount} студентов в ЕПВО`}`, 'success')
      await fetchStudents()
    } catch (error) {
      console.error('Ошибка отправки в ЕПВО:', error)
      showNotification('Ошибка при отправке выбранных студентов в ЕПВО', 'error')
    } finally {
      setSyncLoading(false)
    }
  }

  return { syncLoading, handleSyncToEpvo, handleSendSelectedToEpvo }
}
