'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Pokédex AI Chatbot
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ask me anything about Pokémon and I'll help you with real-time streaming responses!
          </p>
        </div>
        <ChatInterface />
      </div>
    </main>
  )
}