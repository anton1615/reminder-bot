import { LOGIN_HTML, APP_HTML } from './ui.js';

const SESSION_DAYS = 30;
const REMINDER_PREFIX = 'reminder:';

// ---------- Auth ----------
// Cookie value = expiry.HMAC(expiry), signed with AUTH_SECRET. Stateless: no KV session needed.

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function parseCookies(header) {
  const out = {};
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

async function signSession(env, expires) {
  return expires + '.' + await hmac(env.AUTH_SECRET, String(expires));
}

async function hasValidSession(request, env) {
  const raw = parseCookies(request.headers.get('Cookie')).session;
  if (!raw) return false;
  const i = raw.indexOf('.');
  if (i < 1) return false;
  const expires = raw.slice(0, i);
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = await hmac(env.AUTH_SECRET, expires);
  // Different lengths return early: the comparison below must not throw
  const given = raw.slice(i + 1);
  if (given.length !== expected.length) return false;
  const a = enc.encode(given), b = enc.encode(expected);
  let diff = 0;
  for (let j = 0; j < a.length; j++) diff |= a[j] ^ b[j];
  return diff === 0;
}

function sameSecret(a, b) {
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function sessionCookie(value, maxAge) {
  return `session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

// ---------- Time (UTC+8) ----------
// All comparisons use 'YYYY-MM-DD' strings instead of Date arithmetic, so no timezone drift.

function taipeiToday() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// ---------- KV ----------
// One key per reminder: avoids read-modify-write races on a single JSON blob.

async function listReminders(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.REMINDERS.list({ prefix: REMINDER_PREFIX, cursor });
    const values = await Promise.all(page.keys.map(k => env.REMINDERS.get(k.name, 'json')));
    for (const v of values) if (v) out.push(v);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

function newId() {
  return Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
}

// ---------- Discord ----------
// Bot token and recipient live in secrets, never in version control.

async function sendDM(env, content) {
  const token = env.DISCORD_TOKEN;
  if (!token) return { ok: false, error: 'DISCORD_TOKEN is not configured' };
  if (!env.DISCORD_USER_ID) return { ok: false, error: 'DISCORD_USER_ID is not configured' };

  const open = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: env.DISCORD_USER_ID }),
  });
  if (!open.ok) return { ok: false, error: `Could not open a DM channel (Discord ${open.status})` };
  const { id: channelId } = await open.json();

  const sent = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.slice(0, 2000) }),
  });
  if (!sent.ok) return { ok: false, error: `Could not send the message (Discord ${sent.status})` };
  return { ok: true };
}

// ---------- API ----------

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/login' && method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!env.AUTH_PASSWORD) return json({ error: 'Server password is not configured' }, 500);
    if (!body || typeof body.password !== 'string' || !sameSecret(body.password, env.AUTH_PASSWORD)) {
      return json({ error: 'Incorrect password' }, 401);
    }
    const expires = Date.now() + SESSION_DAYS * 86400000;
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(await signSession(env, expires), SESSION_DAYS * 86400) });
  }

  if (path === '/api/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  if (!await hasValidSession(request, env)) return json({ error: 'Not signed in' }, 401);

  if (path === '/api/reminders' && method === 'GET') {
    return json({ today: taipeiToday(), reminders: await listReminders(env) });
  }

  if (path === '/api/reminders' && method === 'POST') {
    const body = await request.json().catch(() => null);
    const date = body && typeof body.date === 'string' ? body.date.trim() : '';
    const text = body && typeof body.text === 'string' ? body.text.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Date must be in YYYY-MM-DD format' }, 400);
    if (!text) return json({ error: 'Reminder text is required' }, 400);
    if (text.length > 200) return json({ error: 'Reminder text is too long (200 characters max)' }, 400);

    const reminder = { id: newId(), date, text, done: false, createdAt: new Date().toISOString() };
    await env.REMINDERS.put(REMINDER_PREFIX + reminder.id, JSON.stringify(reminder));
    return json(reminder, 201);
  }

  if (path.startsWith('/api/reminders/') && method === 'DELETE') {
    const id = decodeURIComponent(path.slice('/api/reminders/'.length));
    if (!id || id.includes('/')) return json({ error: 'Not found' }, 404);
    const key = REMINDER_PREFIX + id;
    if (!await env.REMINDERS.get(key)) return json({ error: 'Not found' }, 404);
    await env.REMINDERS.delete(key);
    return json({ ok: true });
  }

  if (path === '/api/test' && method === 'POST') {
    const result = await sendDM(env, 'Test message: the reminder bot is connected.');
    return result.ok ? json({ ok: true }) : json({ error: result.error }, 502);
  }

  return json({ error: 'Not found' }, 404);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

// ---------- Cron ----------

async function runReminders(env) {
  const today = taipeiToday();
  const due = (await listReminders(env)).filter(r => !r.done && r.date <= today);
  const results = [];
  for (const r of due) {
    const sentAt = new Date().toISOString();
    const res = await sendDM(env, `Reminder (${r.date})\n${r.text}`);
    if (res.ok) {
      await env.REMINDERS.put(REMINDER_PREFIX + r.id, JSON.stringify({ ...r, done: true, sentAt }));
      results.push(`sent ${r.id}`);
    } else {
      results.push(`failed ${r.id}: ${res.error}`);
    }
  }
  return results;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      if (!env.AUTH_SECRET) return json({ error: 'AUTH_SECRET is not configured' }, 500);
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ error: 'Server error: ' + err.message }, 500);
      }
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const authed = env.AUTH_SECRET && await hasValidSession(request, env);
    return new Response(authed ? APP_HTML : LOGIN_HTML, {
      status: authed ? 200 : 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env).then(results => {
      if (results.length) console.log('reminders:', results.join('; '));
    }));
  },
};
