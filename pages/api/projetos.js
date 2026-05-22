// API route: /api/projetos
// Proxies Supabase queries using service_role key (server-side only)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rgfjukpanadfmwzyvqyz.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'Service key not configured' })
  }

  try {
    const { sort, order, limit, offset, status, viabilidade, dificuldade } = req.query

    // Build Supabase query
    let url = `${SUPABASE_URL}/rest/v1/projetos`

    // Filters
    const filters = []
    if (status) filters.push(`status=eq.${status}`)
    if (viabilidade) filters.push(`viabilidade=eq.${encodeURIComponent(viabilidade)}`)
    if (dificuldade) filters.push(`dificuldade=eq.${encodeURIComponent(dificuldade)}`)

    // Sorting
    const sortField = sort || 'created_at'
    const sortOrder = order || 'desc'
    filters.push(`order=${sortField}.${sortOrder}`)

    // Pagination
    if (limit) filters.push(`limit=${limit}`)
    if (offset) filters.push(`offset=${offset}`)

    if (filters.length > 0) {
      url += '?' + filters.join('&')
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Get count
    const countUrl = `${SUPABASE_URL}/rest/v1/projetos?select=count`
    const countResponse = await fetch(countUrl, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept': 'application/json',
      },
    })
    const countData = await countResponse.json()

    return res.status(200).json({
      data,
      total: countData[0]?.count || data.length,
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Also provide a stats endpoint at /api/stats
export const config = {
  api: {
    bodyParser: false,
  },
}