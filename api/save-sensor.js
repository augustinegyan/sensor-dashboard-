import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, raw, value, timestamp, seq } = req.body || {};
    if (!topic || !raw) {
      return res.status(400).json({ error: 'Missing required fields: topic, raw' });
    }

    // Parse the raw JSON to extract known sensor fields
    let temperature = null, humidity = null, pressure = null;
    let flow = null, vibration = null, turbidity = null;
    let rssi = null, gatewayStatus = null;

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        temperature   = parseFloat(parsed.temp ?? parsed.temperature) || null;
        humidity      = parseFloat(parsed.humidity) || null;
        pressure      = parseFloat(parsed.pressure) || null;
        flow          = parseFloat(parsed.flow ?? parsed.f ?? parsed.flow_rate) || null;
        vibration     = parseFloat(parsed.state ?? parsed.vibration ?? parsed.vibr) || null;
        turbidity     = parseFloat(parsed.turbidity ?? parsed.turb ?? parsed.ntu) || null;
        rssi          = parseInt(parsed.rssi ?? parsed.signal) || null;
        gatewayStatus = parsed.status || parsed.state || null;
      }
    } catch { /* raw is not JSON — leave fields as null */ }

    // Build the insert payload
    const insertData = {
      topic,
      raw: typeof raw === 'string' ? raw : JSON.stringify(raw),
      temperature,
      humidity,
      pressure,
      flow,
      vibration,
      turbidity,
      rssi,
      seq: seq || null,
      gateway_status: gatewayStatus,
      created_at: timestamp || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sensor_data')
      .insert([insertData])
      .select('id');

    if (error) throw error;

    return res.status(200).json({ id: data?.[0]?.id });
  } catch (err) {
    console.error('save-sensor error:', err);
    return res.status(500).json({ error: err.message });
  }
}
