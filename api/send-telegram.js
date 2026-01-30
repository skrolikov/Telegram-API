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

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.status(500).json({ ok: false, error: 'Telegram not configured' });
    return;
  }

  try {
    const { subject, data = {}, userIP, formOwner, blockedIP } = req.body || {};
    const parts = [];
    parts.push(`<b>Форма отправки ${formOwner || 'сайта'}:</b> ${subject || 'Заявка'}`);
    if (data.phone) parts.push(`<b>Телефон:</b> ${data.phone}`);
    if (data.name) parts.push(`<b>Имя:</b> ${data.name}`);
    if (data.problem) parts.push(`<b>Проблема:</b> ${data.problem}`);
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
