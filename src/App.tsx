import { useEffect } from 'react'
import { ToastContainer } from './components/feedback/ToastContainer'
import { AppLayout } from './components/layout/AppLayout'
import { ServerState } from './components/shared/ServerState'
import { CoursesPage } from './pages/CoursesPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { StaffPage } from './pages/StaffPage'
import { StudentsPage } from './pages/StudentsPage'
import { useAppStore } from './store/useAppStore'
import { useDataStore } from './store/useDataStore'
import { useToastStore } from './store/useToastStore'

function App() {
  const activePage = useAppStore((state) => state.activePage)
  const { loadAll, isLoading, isLoaded, error } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (error) {
      showToast({
        type: 'error',
        title: 'Không thể tải dữ liệu',
        message: `${error} Hãy kiểm tra JSON Server.`,
      })
    }
  }, [error, showToast])

  const renderPage = () => {
    if (!isLoaded || error) {
      return <ServerState loading={isLoading} error={error} onRetry={loadAll} />
    }

    switch (activePage) {
      case 'courses':
        return <CoursesPage />
      case 'staff':
        return <StaffPage />
      case 'students':
        return <StudentsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <>
      <AppLayout>{renderPage()}</AppLayout>
      <ToastContainer />
    </>
  )
}

export default App
