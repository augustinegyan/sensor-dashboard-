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
    // Get latest gateway status
    const { data: gwData, error: gwError } = await supabase
      .from('sensor_data')
      .select('gateway_status, created_at')
      .eq('topic', 'sensors/gw_status')
      .not('gateway_status', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (gwError) throw gwError;

    // Get latest temperature reading
    const { data: tempData, error: tempError } = await supabase
      .from('sensor_data')
      .select('temperature, created_at')
      .not('temperature', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (tempError) throw tempError;

    const latest = {
      gateway_status: gwData?.[0]?.gateway_status || null,
      gateway_status_at: gwData?.[0]?.created_at || null,
      temperature: tempData?.[0]?.temperature || null,
      temperature_at: tempData?.[0]?.created_at || null,
    };

    return res.status(200).json(latest);
  } catch (err) {
    console.error('poll-status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
