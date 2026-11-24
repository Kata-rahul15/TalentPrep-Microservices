import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] shadow-sm py-5 px-5 sm:py-6 sm:px-7 rounded-xl">
      {children}
    </div>
  )
}
