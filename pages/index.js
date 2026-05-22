import { useState, useEffect, useMemo } from 'react'

// Icons as inline SVG components
const IconTotal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconBarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconExternal = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function StatusDot({ status }) {
  const colors = {
    'analisado': '#3b82f6',
    'construindo': '#eab308',
    'construido': '#22c55e',
    'abandonado': '#ef4444',
  }
  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: colors[status] || '#6b7280',
      marginRight: 4,
    }} />
  )
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ opacity: 0.5 }}>{icon}</span>
        {label}
      </div>
      <div className={`value ${color}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function BarChart({ data, colorMap, maxCount }) {
  return (
    <div className="chart-bars">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div
              className={`bar-fill ${colorMap[item.label] || 'gray'}`}
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            >
              {item.count}
            </div>
          </div>
          <span className="bar-count">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/projetos')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setProjetos(json.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats = useMemo(() => {
    if (!projetos.length) return null

    const total = projetos.length
    const porViabilidade = {}
    const porDificuldade = {}
    const porStatus = {}
    const datas = []

    for (const p of projetos) {
      const v = p.viabilidade || 'N/A'
      porViabilidade[v] = (porViabilidade[v] || 0) + 1

      const d = p.dificuldade || 'N/A'
      porDificuldade[d] = (porDificuldade[d] || 0) + 1

      const s = p.status || 'N/A'
      porStatus[s] = (porStatus[s] || 0) + 1

      if (p.data_analise) datas.push(p.data_analise)
    }

    datas.sort()
    const altaCount = Object.entries(porViabilidade)
      .filter(([k]) => k.includes('Alta') || k.includes('✅'))
      .reduce((acc, [, v]) => acc + v, 0)

    return {
      total,
      porViabilidade: Object.entries(porViabilidade).map(([label, count]) => ({ label, count })),
      porDificuldade: Object.entries(porDificuldade).map(([label, count]) => ({ label, count })),
      porStatus: Object.entries(porStatus).map(([label, count]) => ({ label, count })),
      altaCount,
      dataInicio: datas.length ? formatDate(datas[0]) : '-',
      dataFim: datas.length ? formatDate(datas[datas.length - 1]) : '-',
    }
  }, [projetos])

  const sortedProjetos = useMemo(() => {
    let filtered = [...projetos]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p =>
        (p.nome || '').toLowerCase().includes(q) ||
        (p.fundador || '').toLowerCase().includes(q) ||
        (p.problema || '').toLowerCase().includes(q) ||
        (p.stack || '').toLowerCase().includes(q) ||
        (p.cliente_br || '').toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (sortField === 'id' || sortField === 'created_at') {
        aVal = a[sortField] || 0
        bVal = b[sortField] || 0
      }
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
      return sortDir === 'asc' ? cmp : -cmp
    })

    return filtered
  }, [projetos, search, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function SortArrow({ field }) {
    if (sortField !== field) return <span style={{ color: 'var(--text-muted)', marginLeft: 4, opacity: 0.3 }}>↕</span>
    return <span style={{ marginLeft: 4, color: 'var(--accent-blue)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
          <p>Carregando projetos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Erro ao carregar dados</h2>
          <p>{error}</p>
          <p style={{ marginTop: 8, fontSize: '0.85rem' }}>
            Verifique se a API key do Supabase está configurada nas env vars do Vercel.
          </p>
        </div>
      </div>
    )
  }

  const viabilidadeColors = {
    '✅ Alta': 'green',
    '🔄 Média': 'yellow',
    '❌ Baixa': 'red',
    'N/A': 'gray',
  }

  const dificuldadeColors = {
    '🟢 Fácil': 'green',
    '🟡 Médio': 'yellow',
    '🔴 Difícil': 'red',
    'N/A': 'gray',
  }

  const statusColors = {
    'analisado': 'blue',
    'construindo': 'yellow',
    'construido': 'green',
    'abandonado': 'red',
    'N/A': 'gray',
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📊 Indie Hacker Dashboard</h1>
        <p>Análise semanal de projetos SaaS — dados salvos no Supabase via cron job</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<IconTotal />}
          label="Total de Projetos"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<IconCheck />}
          label="Alta Viabilidade"
          value={stats.altaCount}
          color="green"
          sub={`de ${stats.total} projetos analisados`}
        />
        <StatCard
          icon={<IconBarChart />}
          label="Dificuldade"
          value={(() => {
            const facil = stats.porDificuldade.find(d => d.label.includes('Fácil'))
            return facil ? `${facil.count} Fácil` : '-'
          })()}
          color="purple"
          sub={(() => {
            const medio = stats.porDificuldade.find(d => d.label.includes('Médio'))
            return medio ? `${medio.count} Médio` : ''
          })()}
        />
        <StatCard
          icon={<IconCalendar />}
          label="Última Análise"
          value={stats.dataFim}
          color="yellow"
          sub={`desde ${stats.dataInicio}`}
        />
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>🎯 Por Viabilidade</h3>
          {stats.porViabilidade.length > 0 ? (
            <BarChart
              data={stats.porViabilidade}
              colorMap={viabilidadeColors}
              maxCount={Math.max(...stats.porViabilidade.map(d => d.count))}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum dado</p>
          )}
        </div>
        <div className="chart-card">
          <h3>📈 Por Dificuldade</h3>
          {stats.porDificuldade.length > 0 ? (
            <BarChart
              data={stats.porDificuldade}
              colorMap={dificuldadeColors}
              maxCount={Math.max(...stats.porDificuldade.map(d => d.count))}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum dado</p>
          )}
        </div>
      </div>

      {/* Projects Table */}
      <div className="table-section">
        <div className="table-header">
          <h3>📋 Projetos Analisados</h3>
          <div className="table-controls">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar projetos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('nome')}>Projeto <SortArrow field="nome" /></th>
                <th onClick={() => toggleSort('viabilidade')}>Viabilidade <SortArrow field="viabilidade" /></th>
                <th onClick={() => toggleSort('dificuldade')}>Dificuldade <SortArrow field="dificuldade" /></th>
                <th onClick={() => toggleSort('status')}>Status <SortArrow field="status" /></th>
                <th onClick={() => toggleSort('fundador')}>Fundador <SortArrow field="fundador" /></th>
                <th>Problema</th>
                <th onClick={() => toggleSort('stack')}>Stack <SortArrow field="stack" /></th>
                <th onClick={() => toggleSort('data_analise')}>Data <SortArrow field="data_analise" /></th>
              </tr>
            </thead>
            <tbody>
              {sortedProjetos.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {search ? 'Nenhum projeto encontrado para esta busca.' : 'Nenhum projeto cadastrado.'}
                  </td>
                </tr>
              ) : (
                sortedProjetos.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="project-name">{p.nome}</div>
                      {p.url && (
                        <a className="project-url" href={p.url} target="_blank" rel="noopener noreferrer">
                          {new URL(p.url).hostname} <IconExternal />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${viabilidadeColors[p.viabilidade] || 'gray'}`}>
                        {p.viabilidade || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${dificuldadeColors[p.dificuldade] || 'gray'}`}>
                        {p.dificuldade || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${statusColors[p.status] || 'gray'}`}>
                        <StatusDot status={p.status} />
                        {p.status || '-'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {p.fundador || '-'}
                    </td>
                    <td className="cell-problema">
                      {p.problema || '-'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 120 }}>
                      {p.stack || '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatDate(p.data_analise)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination info */}
      <div style={{
        marginTop: '0.75rem',
        textAlign: 'right',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        Mostrando {sortedProjetos.length} de {projetos.length} projetos
      </div>

      {/* Footer */}
      <div className="footer">
        Indie Hacker Dashboard · Dados salvos no Supabase · Atualizado via cron job semanal
      </div>
    </div>
  )
}