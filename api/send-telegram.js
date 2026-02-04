/**
 * Серверный endpoint для отправки заявок в Telegram.
 * Токен и chat ID задаются только в Vercel: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID.
 * CORS разрешён для вызова со статических сайтов (Spaceweb и др.).
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  // IP того, кто дергает API (на Vercel — из заголовков)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIP = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : (req.headers['x-real-ip'] || '').trim();

  const blockedList = (process.env.BLOCKED_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (blockedList.length && clientIP && blockedList.includes(clientIP)) {
    res.status(403).json({ ok: false, error: 'Forbidden' });
    return;
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.status(500).json({
      ok: false,
      error: 'Telegram not configured. В Vercel → Settings → Environment Variables добавь TELEGRAM_TOKEN и TELEGRAM_CHAT_ID, затем Redeploy.',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
  }
  if (!body || typeof body !== 'object') body = {};

  try {
    const { subject, data = {}, userIP: clientSentIP, formOwner, blockedIP } = body;
    const serverIP =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
      (req.headers['x-real-ip'] || '') ||
      (req.socket && req.socket.remoteAddress) ||
      (req.connection && req.connection.remoteAddress) ||
      '';
    const userIP = serverIP || clientSentIP || '';

    const parts = [];
    parts.push(`<b>Форма отправки ${formOwner || 'сайта'}:</b> ${subject || 'Заявка'}`);
    if (data.phone) parts.push(`<b>Телефон:</b> ${data.phone}`);
    if (data.name) parts.push(`<b>Имя:</b> ${data.name}`);
    if (data.device) parts.push(`<b>Устройство:</b> ${data.device}`);
    if (data.problem) parts.push(`<b>Проблема:</b> ${data.problem}`);
    if (data.malfunction) parts.push(`<b>Неисправность:</b> ${data.malfunction}`);
    if (data.address) parts.push(`<b>Адрес:</b> ${data.address}`);
    if (data.brand) parts.push(`<b>Бренд:</b> ${data.brand}`);
    if (data.question) parts.push(`<b>Вопрос:</b> ${data.question}`);
    if (data.message) parts.push(`<b>Сообщение:</b> ${data.message}`);
    if (userIP) parts.push(`<b>IP-адрес:</b> ${userIP}`);
    if (blockedIP) parts.push(`<b>⚠️ ЗАБЛОКИРОВАННЫЙ IP:</b> ${blockedIP}`);

    const text = parts.join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const result = await tgRes.json();
    if (!tgRes.ok || !result.ok) {
      res.status(502).json({ ok: false, error: result.description || 'Telegram error' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
};
