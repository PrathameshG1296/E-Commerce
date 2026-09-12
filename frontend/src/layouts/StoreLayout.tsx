import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const StoreLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-rose-50 text-stone-900 flex flex-col font-sans relative selection:bg-rose-400 selection:text-white">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-pink-400/5 rounded-full blur-[120px] pointer-events-none" />

      <Header />

      <div className="flex-grow relative z-10 w-full">
        <Outlet />
      </div>

      <Footer />
    </div>
  )
}
