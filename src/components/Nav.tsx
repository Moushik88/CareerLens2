import { NavLink } from 'react-router-dom'

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">CL</span>
          CareerLens
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/analyze">Analyze</NavLink>
          <NavLink to="/results">Results</NavLink>
          <NavLink to="/dashboard">Progress</NavLink>
          <NavLink to="/interview">Interview</NavLink>
          <NavLink to="/placement">Placement Cell</NavLink>
        </nav>
        <NavLink to="/analyze" className="btn btn-primary">
          Start analysis
        </NavLink>
      </div>
    </header>
  )
}
