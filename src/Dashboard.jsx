
import { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import './Dashboard.css'

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Other'
]

const DEFAULT_CATEGORY_BUDGETS = {
  Food: 2000,
  Travel: 1000,
  Shopping: 500,
  Education: 1500,
  Entertainment: 500,
  Other: 500
}

const COLORS = [
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#64748b'
]

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  })
}

function getSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function Dashboard() {
  const [transactions, setTransactions] = useState(() => {
    const saved = getSavedData('spendwise_transactions', null)

    if (Array.isArray(saved)) return saved

    const today = new Date().toISOString().slice(0, 10)

    return [
      {
        id: 1,
        title: 'Lunch',
        category: 'Food',
        amount: 150,
        type: 'expense',
        date: today
      },
      {
        id: 2,
        title: 'Bus pass',
        category: 'Travel',
        amount: 500,
        type: 'expense',
        date: today
      },
      {
        id: 3,
        title: 'Pocket money',
        category: 'Income',
        amount: 3000,
        type: 'income',
        date: today
      }
    ]
  })

  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    getSavedData('spendwise_monthly_budget', 5000)
  )

  const [categoryBudgets, setCategoryBudgets] = useState(() => ({
    ...DEFAULT_CATEGORY_BUDGETS,
    ...getSavedData('spendwise_category_budgets', {})
  }))

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [type, setType] = useState('expense')
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [showNotifications, setShowNotifications] = useState(false)

  // Parent contact details
  const [parentName, setParentName] = useState(() =>
    localStorage.getItem('spendwise_parent_name') || ''
  )

  const [parentEmail, setParentEmail] = useState(() =>
    localStorage.getItem('spendwise_parent_email') || ''
  )

  const [parentPhone, setParentPhone] = useState(() =>
    localStorage.getItem('spendwise_parent_phone') || ''
  )

  const [parentDetailsSaved, setParentDetailsSaved] = useState(() =>
    localStorage.getItem('spendwise_parent_saved') === 'true'
  )

  // Parent alert history
  const [parentAlerts, setParentAlerts] = useState(() =>
    getSavedData('spendwise_parent_alerts', [])
  )

  // Save application data
  useEffect(() => {
    localStorage.setItem(
      'spendwise_transactions',
      JSON.stringify(transactions)
    )
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(
      'spendwise_monthly_budget',
      JSON.stringify(Number(monthlyBudget) || 0)
    )
  }, [monthlyBudget])

  useEffect(() => {
    localStorage.setItem(
      'spendwise_category_budgets',
      JSON.stringify(categoryBudgets)
    )
  }, [categoryBudgets])

  useEffect(() => {
    localStorage.setItem(
      'spendwise_parent_alerts',
      JSON.stringify(parentAlerts)
    )
  }, [parentAlerts])

  // Current-month transactions
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyTransactions = transactions.filter((transaction) => {
    if (!transaction.date) return false

    const transactionDate = new Date(
      transaction.date + 'T00:00:00'
    )

    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    )
  })

  const income = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    )

  const expenses = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    )

  const balance = income - expenses
  const overallBudget = Number(monthlyBudget) || 0
  const monthlyBudgetLeft = overallBudget - expenses

  // Calculate spending in each category
  const categorySpending = {}

  CATEGORIES.forEach((categoryName) => {
    categorySpending[categoryName] = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.category === categoryName
      )
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount || 0),
        0
      )
  })

  // Student dashboard notifications
  const notifications = []

  if (overallBudget > 0 && expenses >= overallBudget) {
    notifications.push({
      id: 'monthly-budget',
      type: 'danger',
      message: `Monthly budget exceeded! You spent ${formatMoney(
        expenses
      )} out of ${formatMoney(overallBudget)}.`
    })
  } else if (
    overallBudget > 0 &&
    expenses >= overallBudget * 0.8
  ) {
    notifications.push({
      id: 'monthly-budget',
      type: 'warning',
      message: `Monthly budget warning! You have used ${Math.round(
        (expenses / overallBudget) * 100
      )}% of your monthly budget.`
    })
  }

  CATEGORIES.forEach((categoryName) => {
    const spent = categorySpending[categoryName] || 0
    const budget = Number(categoryBudgets[categoryName]) || 0

    if (budget > 0 && spent >= budget) {
      notifications.push({
        id: `category-${categoryName}`,
        type: 'danger',
        message: `${categoryName} budget exceeded! You spent ${formatMoney(
          spent
        )} out of ${formatMoney(budget)}.`
      })
    } else if (budget > 0 && spent >= budget * 0.8) {
      notifications.push({
        id: `category-${categoryName}`,
        type: 'warning',
        message: `${categoryName} budget warning! You have used ${Math.round(
          (spent / budget) * 100
        )}% of your budget.`
      })
    }
  })

  // Create parent alert records for new budget alerts.
  // These are stored in this browser; this does not send emails.
  useEffect(() => {
    if (!parentDetailsSaved || !parentEmail.trim()) return

    setParentAlerts((previous) => {
      const updated = [...previous]
      let changed = false

      notifications.forEach((notification) => {
        const existingIndex = updated.findIndex(
          (alert) =>
            alert.id === notification.id &&
            alert.month === `${currentYear}-${currentMonth}`
        )

        if (existingIndex === -1) {
          updated.unshift({
            id: notification.id,
            month: `${currentYear}-${currentMonth}`,
            type: notification.type,
            message: notification.message,
            createdAt: new Date().toISOString(),
            parentEmail: parentEmail.trim()
          })
          changed = true
        } else {
          // Keep the existing alert but update its current spending details.
          const existing = updated[existingIndex]

          if (existing.message !== notification.message) {
            updated[existingIndex] = {
              ...existing,
              message: notification.message
            }
            changed = true
          }
        }
      })

      return changed ? updated.slice(0, 50) : previous
    })
  }, [
    parentDetailsSaved,
    parentEmail,
    notifications.map((item) => `${item.id}:${item.message}`).join('|'),
    currentMonth,
    currentYear
  ])

  const pieData = CATEGORIES
    .map((categoryName) => ({
      name: categoryName,
      value: categorySpending[categoryName] || 0
    }))
    .filter((item) => item.value > 0)

  const barData = CATEGORIES.map((categoryName) => ({
    category: categoryName,
    spent: categorySpending[categoryName] || 0,
    budget: Number(categoryBudgets[categoryName]) || 0
  }))

  function saveParentDetails(event) {
    event.preventDefault()

    const cleanedName = parentName.trim()
    const cleanedEmail = parentEmail.trim()
    const cleanedPhone = parentPhone.trim()

    if (!cleanedName || !cleanedEmail) {
      alert('Please enter the parent name and email address.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(cleanedEmail)) {
      alert('Please enter a valid parent email address.')
      return
    }

    localStorage.setItem('spendwise_parent_name', cleanedName)
    localStorage.setItem('spendwise_parent_email', cleanedEmail)
    localStorage.setItem('spendwise_parent_phone', cleanedPhone)
    localStorage.setItem('spendwise_parent_saved', 'true')

    setParentName(cleanedName)
    setParentEmail(cleanedEmail)
    setParentPhone(cleanedPhone)
    setParentDetailsSaved(true)

    alert('Parent details saved successfully!')
  }

  function handleAddTransaction(event) {
    event.preventDefault()

    const numericAmount = Number(amount)

    if (
      !title.trim() ||
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !date
    ) {
      alert('Please enter a valid description, amount, and date.')
      return
    }

    setTransactions((previous) => [
      {
        id: Date.now(),
        title: title.trim(),
        category: type === 'income' ? 'Income' : category,
        amount: numericAmount,
        type,
        date
      },
      ...previous
    ])

    setTitle('')
    setAmount('')
    setCategory('Food')
    setType('expense')
    setDate(new Date().toISOString().slice(0, 10))
  }

  function handleDeleteTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return

    setTransactions((previous) =>
      previous.filter((transaction) => transaction.id !== id)
    )
  }

  function handleMonthlyBudgetChange(value) {
    if (value === '') {
      setMonthlyBudget('')
      return
    }

    const numericValue = Number(value)

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      setMonthlyBudget(numericValue)
    }
  }

  function updateCategoryBudget(categoryName, value) {
    if (value === '') {
      setCategoryBudgets((previous) => ({
        ...previous,
        [categoryName]: ''
      }))
      return
    }

    const numericValue = Number(value)

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      setCategoryBudgets((previous) => ({
        ...previous,
        [categoryName]: numericValue
      }))
    }
  }

  function clearParentAlerts() {
    if (!window.confirm('Clear all saved parent alerts?')) return
    setParentAlerts([])
  }

  function handleSignOut() {
    window.location.href = '/'
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-icon">₹</div>
          <div>
            <h2>SpendWise</h2>
            <p>Smart Student Expense Management</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="notification-button"
            type="button"
            onClick={() =>
              setShowNotifications((previous) => !previous)
            }
          >
            ♧ Notifications
            {notifications.length > 0 && (
              <span className="notification-count">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            className="signout-button"
            type="button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      {showNotifications && (
        <section className="notification-panel">
          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>
              <p>Your budget alerts</p>
            </div>

            <button
              type="button"
              className="close-notifications"
              onClick={() => setShowNotifications(false)}
            >
              ×
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <span>✓</span>
              <p>You're all caught up!</p>
              <small>No budget alerts right now.</small>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  className={`notification-item ${notification.type}`}
                  key={notification.id}
                >
                  <span className="notification-symbol">
                    {notification.type === 'danger' ? '⚠' : 'ⓘ'}
                  </span>
                  <p>{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <main className="dashboard-main">
        <section className="welcome-section">
          <div>
            <h1>Student Dashboard</h1>
            <p>Track your money. Build better spending habits.</p>
          </div>

          <span className="today-date">
            {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </section>

        <section className="summary-grid">
          <div className="summary-card income-card">
            <p>Total Income</p>
            <h2>{formatMoney(income)}</h2>
            <span>Money received this month</span>
          </div>

          <div className="summary-card expense-card">
            <p>Total Expenses</p>
            <h2>{formatMoney(expenses)}</h2>
            <span>Money spent this month</span>
          </div>

          <div className="summary-card balance-card">
            <p>Available Balance</p>
            <h2>{formatMoney(balance)}</h2>
            <span>Income minus expenses</span>
          </div>

          <div className="summary-card budget-card">
            <p>Monthly Budget Left</p>
            <h2>{formatMoney(monthlyBudgetLeft)}</h2>
            <span>
              {monthlyBudgetLeft < 0
                ? 'You are over your monthly budget'
                : 'Remaining spending limit'}
            </span>
          </div>
        </section>

        <section className="dashboard-card monthly-budget-section">
          <div className="section-heading">
            <div>
              <h2>Monthly Budget</h2>
              <p>Set your overall spending limit for this month.</p>
            </div>
          </div>

          <label htmlFor="monthly-budget-input">
            Monthly budget (₹)
          </label>
          <input
            id="monthly-budget-input"
            type="number"
            min="0"
            value={monthlyBudget}
            onChange={(event) =>
              handleMonthlyBudgetChange(event.target.value)
            }
          />

          <div className="budget-progress-info">
            <span>Spent: {formatMoney(expenses)}</span>
            <span>Budget: {formatMoney(overallBudget)}</span>
          </div>

          <div className="progress-track">
            <div
              className={`progress-fill ${
                overallBudget > 0 && expenses >= overallBudget
                  ? 'progress-danger'
                  : ''
              }`}
              style={{
                width: `${
                  overallBudget > 0
                    ? Math.min((expenses / overallBudget) * 100, 100)
                    : 0
                }%`
              }}
            />
          </div>

          <p className="budget-status">
            {overallBudget <= 0
              ? 'Set a monthly budget to track spending.'
              : expenses >= overallBudget
                ? 'Monthly budget exceeded!'
                : expenses >= overallBudget * 0.8
                  ? 'Warning: you have used at least 80% of your budget.'
                  : 'You are within your monthly budget.'}
          </p>
        </section>

        <section className="dashboard-card category-budget-section">
          <div className="section-heading">
            <div>
              <h2>Category Budgets</h2>
              <p>Set separate spending limits for each category.</p>
            </div>
          </div>

          <div className="category-budget-grid">
            {CATEGORIES.map((categoryName) => {
              const spent = categorySpending[categoryName] || 0
              const budget =
                Number(categoryBudgets[categoryName]) || 0
              const exceeded = budget > 0 && spent >= budget
              const warning =
                budget > 0 && spent >= budget * 0.8 && !exceeded

              return (
                <div className="category-budget-card" key={categoryName}>
                  <div className="category-budget-heading">
                    <h3>{categoryName}</h3>
                    <span
                      className={`budget-badge ${
                        exceeded
                          ? 'badge-danger'
                          : warning
                            ? 'badge-warning'
                            : 'badge-normal'
                      }`}
                    >
                      {exceeded
                        ? 'Exceeded'
                        : warning
                          ? 'Near limit'
                          : 'On track'}
                    </span>
                  </div>

                  <label>
                    Budget (₹)
                    <input
                      type="number"
                      min="0"
                      value={categoryBudgets[categoryName] ?? ''}
                      onChange={(event) =>
                        updateCategoryBudget(
                          categoryName,
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <div className="budget-progress-info">
                    <span>Spent: {formatMoney(spent)}</span>
                    <span>Limit: {formatMoney(budget)}</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${
                        exceeded ? 'progress-danger' : ''
                      }`}
                      style={{
                        width: `${
                          budget > 0
                            ? Math.min((spent / budget) * 100, 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Parent contact details */}
        <section className="dashboard-card parent-section">
          <div className="section-heading">
            <div>
              <h2>Parent Notifications</h2>
              <p>
                Add a parent or guardian contact for budget alerts.
              </p>
            </div>
          </div>

          <form className="transaction-form" onSubmit={saveParentDetails}>
            <div className="form-field">
              <label htmlFor="parent-name">Parent / Guardian Name</label>
              <input
                id="parent-name"
                type="text"
                placeholder="Enter parent's name"
                value={parentName}
                onChange={(event) => {
                  setParentName(event.target.value)
                  setParentDetailsSaved(false)
                }}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="parent-email">Parent Email Address</label>
              <input
                id="parent-email"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(event) => {
                  setParentEmail(event.target.value)
                  setParentDetailsSaved(false)
                }}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="parent-phone">
                Parent Phone (optional)
              </label>
              <input
                id="parent-phone"
                type="tel"
                placeholder="Enter phone number"
                value={parentPhone}
                onChange={(event) => {
                  setParentPhone(event.target.value)
                  setParentDetailsSaved(false)
                }}
              />
            </div>

            <button className="add-transaction-button" type="submit">
              Save Parent Details
            </button>
          </form>

          <p className="budget-status">
            {parentDetailsSaved
              ? `Parent contact saved for ${parentName}. Budget alerts can be recorded below.`
              : 'Save the parent details to enable parent alert recording.'}
          </p>

          <p className="parent-delivery-note">
            Demo mode: alerts are saved in this browser only. Email or SMS
            delivery is not active yet.
          </p>
        </section>

        {/* Parent alert records */}
        <section className="dashboard-card parent-alerts-section">
          <div className="section-heading">
            <div>
              <h2>Parent Alert History</h2>
              <p>Budget alerts prepared for the saved parent contact.</p>
            </div>

            {parentAlerts.length > 0 && (
              <button
                className="delete-transaction-button"
                type="button"
                onClick={clearParentAlerts}
              >
                Clear History
              </button>
            )}
          </div>

          {!parentDetailsSaved ? (
            <div className="transactions-empty">
              Save the parent details above to start recording alerts.
            </div>
          ) : parentAlerts.length === 0 ? (
            <div className="transactions-empty">
              No parent alerts recorded yet. An alert will appear here when
              a budget warning or limit is reached.
            </div>
          ) : (
            <div className="notification-list">
              {parentAlerts.map((alert, index) => (
                <div
                  className={`notification-item ${alert.type}`}
                  key={`${alert.month}-${alert.id}-${index}`}
                >
                  <span className="notification-symbol">
                    {alert.type === 'danger' ? '⚠' : 'ⓘ'}
                  </span>

                  <div>
                    <p>{alert.message}</p>
                    <small>
                      For {alert.parentEmail} ·{' '}
                      {new Date(alert.createdAt).toLocaleString('en-IN')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Charts */}
        <section className="charts-grid">
          <div className="dashboard-card chart-card">
            <div className="section-heading">
              <div>
                <h2>Expense Breakdown</h2>
                <p>See where your money goes this month.</p>
              </div>
            </div>

            {pieData.length === 0 ? (
              <div className="chart-empty">
                No expenses recorded this month yet.
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label
                    >
                      {pieData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatMoney(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="dashboard-card chart-card">
            <div className="section-heading">
              <div>
                <h2>Spending vs Budget</h2>
                <p>Compare category budgets with actual spending.</p>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-25}
                    textAnchor="end"
                    height={65}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill="#6366f1"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="budget"
                    name="Budget"
                    fill="#cbd5e1"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Add transaction */}
        <section className="dashboard-card add-transaction-section">
          <div className="section-heading">
            <div>
              <h2>Add Transaction</h2>
              <p>Record money you receive or spend.</p>
            </div>
          </div>

          <form className="transaction-form" onSubmit={handleAddTransaction}>
            <div className="form-field">
              <label htmlFor="transaction-title">Description</label>
              <input
                id="transaction-title"
                type="text"
                placeholder="e.g. Lunch or Pocket money"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="transaction-amount">Amount (₹)</label>
              <input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="transaction-type">Type</label>
              <select
                id="transaction-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            {type === 'expense' && (
              <div className="form-field">
                <label htmlFor="transaction-category">Category</label>
                <select
                  id="transaction-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="transaction-date">Date</label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <button className="add-transaction-button" type="submit">
              + Add Transaction
            </button>
          </form>
        </section>

        {/* Recent transactions */}
        <section className="dashboard-card transactions-section">
          <div className="section-heading">
            <div>
              <h2>Recent Transactions</h2>
              <p>Your recorded income and expenses.</p>
            </div>
            <span className="transaction-count">
              {monthlyTransactions.length} this month
            </span>
          </div>

          {monthlyTransactions.length === 0 ? (
            <div className="transactions-empty">
              No transactions this month. Add one above to get started.
            </div>
          ) : (
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.title}</td>
                      <td>{transaction.category}</td>
                      <td>
                        {new Date(
                          transaction.date + 'T00:00:00'
                        ).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <span
                          className={`transaction-type ${
                            transaction.type === 'income'
                              ? 'type-income'
                              : 'type-expense'
                          }`}
                        >
                          {transaction.type === 'income'
                            ? 'Income'
                            : 'Expense'}
                        </span>
                      </td>
                      <td
                        className={
                          transaction.type === 'income'
                            ? 'amount-income'
                            : 'amount-expense'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatMoney(transaction.amount)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-transaction-button"
                          onClick={() =>
                            handleDeleteTransaction(transaction.id)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>
          SpendWise © {new Date().getFullYear()} · Spend smart, live better.
        </p>
      </footer>
    </div>
  )
}

export default Dashboard
