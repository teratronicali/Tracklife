'use client'

import { Toaster } from 'react-hot-toast'

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#151b26',
          color: '#f5f7fb',
          border: '1px solid #1e2733',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#2f6bff', secondary: '#f5f7fb' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#f5f7fb' } },
      }}
    />
  )
}
