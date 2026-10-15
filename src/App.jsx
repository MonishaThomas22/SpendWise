
import { useState } from 'react'
import Dashboard from './Dashboard'
import './App.css'

function App() {
  // Open the dashboard when the URL is /dashboard
  if (window.location.pathname === '/dashboard') {
    return <Dashboard />
  }

  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!email || !password || (!isLogin && !name)) {
      alert('Please fill in all required fields.')
      return
    }

    if (isLogin) {
      window.location.href = '/dashboard'
    } else {
      alert('Account registration will be added later.')
    }
  }

  return (
    <main className="page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">₹</div>
          <span>
            Spend<span className="brand-highlight">Wise</span>
          </span>
        </div>

        <div className="illustration">
          <div className="chart-label">YOUR MONEY, YOUR CONTROL</div>
          <h2>Make every rupee count.</h2>
          <p>Build smarter spending habits, one day at a time.</p>

          <div className="chart">
            <div className="chart-grid">
              <span>₹5,000</span>
              <span>₹3,000</span>
              <span>₹1,000</span>
            </div>

            <svg viewBox="0 0 400 150" role="img" aria-label="Spending trend chart">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38e0b2" stopOpacity=".35" />
                  <stop offset="100%" stopColor="#38e0b2" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M0 120 L55 92 L105 105 L160 58 L215 76 L270 35 L325 53 L400 12 L400 150 L0 150 Z"
                fill="url(#chartFill)"
              />

              <path
                d="M0 120 L55 92 L105 105 L160 58 L215 76 L270 35 L325 53 L400 12"
                fill="none"
                stroke="#38e0b2"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <circle cx="270" cy="35" r="6" fill="#38e0b2" />
              <circle cx="400" cy="12" r="6" fill="#38e0b2" />
            </svg>
          </div>

          <div className="chart-footer">
            <span>Track your expenses</span>
            <span className="trend">↗ Spend smarter</span>
          </div>
        </div>

        <div className="form-area">
          <div className="welcome">
            <h1>{isLogin ? 'Welcome back!' : 'Create your account'}</h1>
            <p>
              {isLogin
                ? 'Sign in to continue to your SpendWise account.'
                : 'Start your journey towards smarter spending.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <div className="password-heading">
                <label htmlFor="password">Password</label>

                {isLogin && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      alert('Password reset will be added later.')
                    }
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-button">
              {isLogin ? 'Sign in' : 'Create account'}
              <span>→</span>
            </button>
          </form>

          <div className="separator">
            <span>OR CONTINUE WITH</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={() => alert('Google sign-in will be connected later.')}
          >
            <span className="google-g">G</span>
            Continue with Google
          </button>

          <p className="switch-text">
            {isLogin
              ? "Don't have an account?"
              : 'Already have an account?'}

            <button
              type="button"
              className="text-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? ' Create account' : ' Sign in'}
            </button>
          </p>
        </div>
      </section>

      <footer className="page-footer">
        <span>© 2026 SpendWise</span>
        <span>Build better money habits.</span>
      </footer>
    </main>
  )
}

export default App
