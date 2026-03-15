import { createBrowserRouter, Navigate } from 'react-router'
import { Layout } from './components/Layout'
import { Dashboard } from './screens/Dashboard'
import { Forecast } from './screens/Forecast'
import { Transactions } from './screens/Transactions'
import { WhatIf } from './screens/WhatIf'
import { Chat } from './screens/Chat'
import { Settings } from './screens/Settings'
import { Login } from './screens/Login'
import { Landing } from './screens/Landing'
import { useAuth } from '../contexts/AuthContext'
import { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/landing" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/landing',
    Component: Landing,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: 'forecast', Component: Forecast },
      { path: 'transactions', Component: Transactions },
      { path: 'what-if', Component: WhatIf },
      { path: 'chat', Component: Chat },
      { path: 'settings', Component: Settings },
    ],
  },
])
