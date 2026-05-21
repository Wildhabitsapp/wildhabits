import { supabase } from './supabase'

// localStorage fallback
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(`wh:${k}`); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(`wh:${k}`, JSON.stringify(v)); } catch {} },
}

// Местное время телефона
const localTime = () => new Date().toLocaleString('ru-RU', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })

// AUTH
export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
  if (error) throw error
  return data.user
}
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}
export async function signOut() { await supabase.auth.signOut() }
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://wildhabits.ru/reset' })
  if (error) throw error
}

// SETTINGS
export async function loadSettings(uid) {
  try {
    const { data } = await supabase.from('settings').select('data').eq('user_id', uid).single()
    if (data?.data) { ls.set('settings', data.data); return data.data; }
  } catch {}
  return ls.get('settings', {})
}
export async function saveSettings(uid, d) {
  ls.set('settings', d)
  try { await supabase.from('settings').upsert({ user_id: uid, data: d, updated_at: new Date().toISOString() }) } catch {}
}

// HABITS
export async function loadHabits(uid, DH) {
  try {
    const { data } = await supabase.from('habits').select('id,data').eq('user_id', uid)
    if (data?.length) { const h = data.map(r => r.data).filter(h => h?.id); ls.set('habits', h); return h; }
  } catch {}
  return ls.get('habits', DH)
}
export async function saveHabit(uid, habit) {
  try { await supabase.from('habits').upsert({ id: habit.id, user_id: uid, data: habit, updated_at: new Date().toISOString() }) } catch {}
}
export async function deleteHabit(uid, id) {
  try { await supabase.from('habits').delete().eq('id', id).eq('user_id', uid) } catch {}
}

// LOGS
export async function loadLogs(uid) {
  try {
    const { data } = await supabase.from('logs').select('*').eq('user_id', uid).order('ts', { ascending: false })
    if (data) {
      const logs = data.map(r => ({ ts: r.ts, habitId: r.habit_id, value: r.value, note: r.note, _id: r.id, habitName: r.habit_name, habitUnit: r.habit_unit, localTime: r.local_time, ...r.extra }))
      ls.set('logs', logs); return logs;
    }
  } catch {}
  return ls.get('logs', [])
}
export async function addLog(uid, log, habitName = '', habitUnit = '') {
  const lt = log.localTime || localTime()
  try {
    const { data } = await supabase.from('logs').insert({
      user_id: uid, habit_id: log.habitId, value: log.value,
      note: log.note || '', ts: log.ts,
      habit_name: habitName, habit_unit: habitUnit,
      local_time: lt,
      extra: Object.fromEntries(Object.entries(log).filter(([k]) => !['habitId','value','note','ts','localTime','habitName','habitUnit'].includes(k)))
    }).select().single()
    return { ...log, _id: data?.id, habitName, habitUnit, localTime: lt }
  } catch { return log }
}
export async function deleteLog(uid, ts) {
  try { await supabase.from('logs').delete().eq('ts', ts).eq('user_id', uid) } catch {}
}
export async function updateLog(uid, ts, upd) {
  try { await supabase.from('logs').update({ value: upd.value, note: upd.note }).eq('ts', ts).eq('user_id', uid) } catch {}
}

// SKIPS
export async function loadSkips(uid) {
  try {
    const { data } = await supabase.from('skips').select('*').eq('user_id', uid)
    if (data) { const s = data.map(r => ({ id: r.id, habitId: r.habit_id, date: r.date, reason: r.reason, ts: r.ts })); ls.set('skips', s); return s; }
  } catch {}
  return ls.get('skips', [])
}
export async function addSkip(uid, skip) {
  try {
    const { data } = await supabase.from('skips').insert({ user_id: uid, habit_id: skip.habitId, date: skip.date, reason: skip.reason, ts: skip.ts }).select().single()
    return { ...skip, id: data?.id }
  } catch { return skip }
}
export async function deleteSkip(uid, id) {
  try { await supabase.from('skips').delete().eq('id', id).eq('user_id', uid) } catch {}
}

// IDEAS
export async function loadIdeas(uid) {
  try {
    const { data } = await supabase.from('ideas').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (data) { const ideas = data.map(r => ({ id: r.id, text: r.text, category: r.category, priority: r.priority, done: r.done, date: r.date })); ls.set('ideas', ideas); return ideas; }
  } catch {}
  return ls.get('ideas', [])
}
export async function addIdea(uid, idea) {
  try {
    const { data } = await supabase.from('ideas').insert({ user_id: uid, text: idea.text, category: idea.category || '', priority: idea.priority || 'medium', done: false, date: idea.date }).select().single()
    return { ...idea, id: data?.id || idea.id }
  } catch { return idea }
}
export async function updateIdea(uid, id, upd) {
  try { await supabase.from('ideas').update(upd).eq('id', id).eq('user_id', uid) } catch {}
}
export async function deleteIdea(uid, id) {
  try { await supabase.from('ideas').delete().eq('id', id).eq('user_id', uid) } catch {}
}

// REFLECTIONS
export async function loadReflections(uid) {
  try {
    const { data } = await supabase.from('reflections').select('*').eq('user_id', uid)
    if (data) { const r = data.map(r => ({ date: r.date, data: r.data })); ls.set('reflections', r); return r; }
  } catch {}
  return ls.get('reflections', [])
}
export async function saveReflection(uid, ref) {
  try {
    await supabase.from('reflections').upsert({ user_id: uid, date: ref.date, data: ref.data }, { onConflict: 'user_id,date' })
  } catch {}
}

// FEEDBACK
export async function sendFeedback(uid, theme, message, email) {
  try {
    await supabase.from('feedback').insert({ user_id: uid || null, theme, message, email: email || '' })
    return true
  } catch { return false }
}
