import { Outlet } from 'react-router-dom'
import { AnnouncementBar } from '@/components/AnnouncementBar'

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <AnnouncementBar />
      <Outlet />
    </div>
  )
}

export default App
