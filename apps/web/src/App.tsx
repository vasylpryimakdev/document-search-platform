import './App.css'
import { AuthCard } from './components/AuthCard'
import { DocumentsPage } from './components/DocumentsPage'
import { useAuthStore } from './stores/auth-store'

function App() {
  const userEmail = useAuthStore((state) => state.userEmail)

  if (!userEmail) {
    return <AuthCard />
  }

  return <DocumentsPage />
}

export default App
