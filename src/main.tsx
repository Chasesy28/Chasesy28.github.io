import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import Admin from './pages/Admin.tsx'
import AdminAuth from './pages/AdminAuth.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/vite" element={<Home />} />
          <Route path="/vite.html" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
