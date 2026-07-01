
import { useState, useEffect } from 'react'
import api from '../lib/api'
import StepsSolver from '../components/stepsolver'
//import SolutionGraph from '../components/graphview'
import SymbolBar from '../components/SymbolBar'



export default function Dashboard({ user, setUser }) {
  const [sessions, setSessions] = useState([])
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    api.get('/api/history')
      .then(res => setSessions(res.data))
      .catch(() => {})
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    }
  }
 const handleSolve = async () => {
  if (!input.trim() && !file) return
  setLoading(true)
  setError(null)
  setResult(null)
  try {
    const formData = new FormData()
    if (input.trim()) formData.append('message', input)
    if (file) formData.append('file', file)

      
    const res = await api.post('/api/solve', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data && res.data.error) {
      setError(res.data.error)
      setLoading(false)
      return
    }
    setResult(res.data)
    setFile(null)
    setFileName('')
  } catch (err) {
    setError(err.response?.data?.error || 'Something went wrong')
  } finally {
    setLoading(false)
  }
}


  const handleLogout = async () => {
    await api.post('/api/auth/logout')
    setUser(null)
  }

  const handleInsertSymbol = (symbol) => {
    setInput(prev => prev + symbol)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="container-card">
        <div className="page-header">
          <h1 className="page-title">Math<span className="accent">GPT</span></h1>
          <div className="user-info">
            <img src={user?.avatar} alt={user?.name} />
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          </div>
        </div>

        {/* Symbol Bar */}
        <SymbolBar onInsert={handleInsertSymbol} />

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSolve()
              }
            }}
            placeholder="Ex: solve 2x + 5 = 15, or ∫x² dx, or calculate mean of 12, 15, 18..."
            className="input-area"
          />
        </div>

        {/* File Upload */}
        <div className="dashboard-file-upload">
          <label className="upload-label">
            📎 Joindre une image / PDF
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={handleFileChange}
            />
          </label>
          {fileName && (
            <span className="upload-filename">
              {fileName} ✓
            </span>
          )}
        </div>
       
        {/* Solve Button */}
        <button
          onClick={handleSolve}
          disabled={loading || (!input.trim() && !file)}
          className="btn-primary full"
          style={{ marginBottom: '32px' }}
        >
          {loading ? ' Solving...' : ' Solve'}
        </button>

        {/* Error */}
        {error && (
          <div className="error-box">{error}</div>
        )}

        {/* Results */}
        {result && (
          <>
            <StepsSolver result={result} />
            
          </>
        )}
      </div>
    </div>
  )
}
