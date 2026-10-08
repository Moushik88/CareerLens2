import { Navigate, Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Analyze } from './pages/Analyze'
import { Dashboard } from './pages/Dashboard'
import { Interview } from './pages/Interview'
import { Landing } from './pages/Landing'
import { Placement } from './pages/Placement'
import { Results } from './pages/Results'

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        <div className="container footer-inner">
          <span>CareerLens · DataQuest 3.0 · DQWL</span>
          <span>Evidence-based employability analysis</span>
        </div>
      </footer>
    </div>
  )
}
