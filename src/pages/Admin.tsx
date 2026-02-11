import { Link } from 'react-router-dom'
import { AdminDashboard } from '@/components/AdminDashboard'
import { Button } from '@/components/ui/button'

function AdminPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Admin Dashboard</h1>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
      <div className="p-8">
        <AdminDashboard />
      </div>
    </div>
  )
}

export default AdminPage
