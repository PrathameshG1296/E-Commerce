import React from 'react'
import { Wrench, ShoppingBag } from 'lucide-react'

export const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-rose-50 text-stone-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <div className="inline-flex bg-gradient-to-tr from-amber-500 to-orange-600 p-4 rounded-2xl shadow-xl shadow-amber-500/20 mb-6">
          <Wrench className="w-10 h-10 text-stone-900" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-rose-300" />
          <span className="font-display font-bold text-xl text-stone-900">NovaCart</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-stone-900">We&apos;ll be back soon</h1>
        <p className="mt-4 text-sm text-stone-500 leading-relaxed">
          NovaCart is undergoing scheduled maintenance to improve your shopping experience. Please check back shortly.
        </p>
        <p className="mt-6 text-xs text-stone-500 font-mono">
          Maintenance mode: VITE_MAINTENANCE_MODE=true
        </p>
      </div>
    </div>
  )
}
