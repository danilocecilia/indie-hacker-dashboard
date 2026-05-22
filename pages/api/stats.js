// API route: /api/stats - Aggregated statistics from projetos table

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rgfjukpanadfmwzyvqyz.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const headers = {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/json',
    }

    // Fetch all records for client-side aggregation
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projetos?order=created_at.desc`, { headers })
    const projetos = await response.json()

    // Compute stats
    const stats = {
      total: projetos.length,
      por_viabilidade: {},
      por_dificuldade: {},
      por_status: {},
      datas: [],
      primeiros_projetos: projetos.slice(0, 5),
    }

    for (const p of projetos) {
      const v = p.viabilidade || 'N/A'
      stats.por_viabilidade[v] = (stats.por_viabilidade[v] || 0) + 1

      const d = p.dificuldade || 'N/A'
      stats.por_dificuldade[d] = (stats.por_dificuldade[d] || 0) + 1

      const s = p.status || 'N/A'
      stats.por_status[s] = (stats.por_status[s] || 0) + 1

      if (p.data_analise) stats.datas.push(p.data_analise)
    }

    if (stats.datas.length > 0) {
      stats.datas.sort()
      stats.data_range = { min: stats.datas[0], max: stats.datas[stats.datas.length - 1] }
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return res.status(500).json({ error: error.message })
  }
}