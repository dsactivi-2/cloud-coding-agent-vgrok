'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  repo: string
  createdAt: string
}

interface HealthStatus {
  status: string
  name: string
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    // Check API health
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', name: 'VGrok Agent' }))
  }, [])

  const createTask = async () => {
    if (!newTask.trim()) return

    const res = await fetch('http://localhost:3001/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newTask })
    })

    const task = await res.json()
    setTasks([...tasks, { ...task, type: 'custom', status: 'pending', repo: 'local', createdAt: new Date().toISOString() }])
    setNewTask('')
  }

  return (
    <main className="min-h-screen p-8" data-testid="dashboard_main">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8" data-testid="dashboard_header">
          <h1 className="text-3xl font-bold mb-2">VGrok Agent Dashboard</h1>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
              data-testid="dashboard_status_indicator"
            />
            <span className="text-sm text-gray-500">
              {health?.status === 'ok' ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </header>

        {/* Create Task */}
        <section className="mb-8 p-4 border rounded-lg" data-testid="dashboard_create_task">
          <h2 className="text-xl font-semibold mb-4">Neuen Task erstellen</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task-Beschreibung eingeben..."
              className="flex-1 px-4 py-2 border rounded-lg"
              data-testid="dashboard_input_task"
            />
            <button
              onClick={createTask}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="dashboard_button_create"
            >
              Erstellen
            </button>
          </div>
        </section>

        {/* Tasks List */}
        <section data-testid="dashboard_tasks_section">
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500" data-testid="dashboard_no_tasks">Keine Tasks vorhanden</p>
          ) : (
            <ul className="space-y-2" data-testid="dashboard_tasks_list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="p-4 border rounded-lg flex justify-between items-center"
                  data-testid={`dashboard_task_${task.id}`}
                >
                  <div>
                    <span className="font-medium">{task.id}</span>
                    <span className="text-sm text-gray-500 ml-2">{task.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
