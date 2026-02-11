import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-slate-900 dark:text-slate-50">
          Welcome to Vite + React + TypeScript + shadcn/ui
        </h1>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Counter Demo</CardTitle>
              <CardDescription>
                A simple counter to demonstrate React state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <p className="text-2xl font-semibold">Count: {count}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setCount(count + 1)}>
                    Increment
                  </Button>
                  <Button variant="outline" onClick={() => setCount(count - 1)}>
                    Decrement
                  </Button>
                  <Button variant="destructive" onClick={() => setCount(0)}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
              <CardDescription>
                Modern development tools configured and ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Vite - Lightning fast build tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>TypeScript - Type-safe development</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>React - Modern UI library</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Tailwind CSS - Utility-first styling</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>shadcn/ui - Beautiful components</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Start building your application with these commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Development Server:</p>
                <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block">npm run dev</code>
              </div>
              <div>
                <p className="font-semibold mb-2">Build for Production:</p>
                <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block">npm run build</code>
              </div>
              <div>
                <p className="font-semibold mb-2">Preview Production Build:</p>
                <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block">npm run preview</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin" className="text-blue-600 hover:underline dark:text-blue-400">
              Admin Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home
