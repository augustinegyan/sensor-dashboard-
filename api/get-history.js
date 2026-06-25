import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 5000);

    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to match the format expected by the dashboard
    const rows = (data || []).reverse().map(row => ({
      id: row.id,
      topic: row.topic,
      value: row.raw,
      raw: row.raw,
      timestamp: row.created_at,
      temperature: row.temperature,
      humidity: row.humidity,
      pressure: row.pressure,
      flow: row.flow,
      vibration: row.vibration,
      turbidity: row.turbidity,
      rssi: row.rssi,
      seq: row.seq,
      gateway_status: row.gateway_status,
    }));

    return res.status(200).json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error('get-history error:', err);
    return res.status(500).json({ error: err.message });
  }
}
