import { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import * as db from '../lib/db'


const V = 'v4.6';
const S = k => `wh:${k}`;
const DR = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const mD = (d = new Date()) => { const v = d.getDay(); return v === 0 ? 6 : v - 1; };
const CATS = ['Здоровье','Ментальное','Работа','Отношения','Обучение','Контент','Вредные'];
const TYP = [{v:'duration',l:'Длительность'},{v:'count',l:'Счётчик'},{v:'check',l:'Галочка'},{v:'rating',l:'Оценка 1–5'},{v:'scale',l:'Число'},{v:'sleep',l:'Сон'}];
const TOD = [{v:'morning',l:'🌅 Утро'},{v:'day',l:'☀️ День'},{v:'evening',l:'🌙 Вечер'},{v:'anytime',l:'⏳ Днём'}];
const FRQ = [{v:'daily',l:'Каждый день'},{v:'weekly',l:'Раз/нед'},{v:'monthly',l:'Раз/мес'},{v:'custom',l:'Дни'}];
const tk = (d = new Date()) => {
  // Ночной буфер: до 03:00 считаем предыдущий день
  if (d.getHours() < 3) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const LEVELS = [
  {name:'Новичок',min:0,icon:'🌱'},{name:'Практик',min:50,icon:'🌿'},{name:'Мастер',min:200,icon:'🌳'},
  {name:'Гуру',min:500,icon:'⚡'},{name:'Легенда',min:1000,icon:'🏆'}
];
const getLevel = xp => { for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return { ...LEVELS[i], idx: i, next: LEVELS[i + 1] }; return { ...LEVELS[0], idx: 0, next: LEVELS[1] }; };

const DH = [
  {id:'H01',name:'Спорт',cat:'Здоровье',type:'duration',unit:'мин',goalDay:60,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'morning',icon:'🏃',color:'#10b981',why:'Здоровое тело, энергия, ясный ум',archived:false},
  {id:'H02',name:'Вода',cat:'Здоровье',type:'count',unit:'мл',goalDay:3000,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'anytime',icon:'💧',color:'#06b6d4',why:'Чистая кожа, работающий мозг',archived:false},
  {id:'H03',name:'Сон',cat:'Здоровье',type:'sleep',unit:'ч',goalDay:8,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'😴',color:'#6366f1',why:'Восстановление, иммунитет',archived:false},
  {id:'H04',name:'Вес',cat:'Здоровье',type:'scale',unit:'кг',goalDay:0,goalMonth:4,goalYear:12,period:'daily',days:[],dir:'down',time:'morning',icon:'⚖️',color:'#84cc16',why:'Контроль формы',archived:false},
  {id:'H05',name:'Медитация',cat:'Ментальное',type:'duration',unit:'мин',goalDay:15,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'morning',icon:'🧘',color:'#a855f7',why:'Спокойствие, фокус',archived:false},
  {id:'H06',name:'Чтение',cat:'Ментальное',type:'duration',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'evening',icon:'📖',color:'#ec4899',why:'Новые идеи, 24+ книги/год',archived:false},
  {id:'H07',name:'Настроение',cat:'Ментальное',type:'rating',unit:'1-5',goalDay:4,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'evening',icon:'😊',color:'#f59e0b',why:'Понять что влияет на состояние',archived:false},
  {id:'H08',name:'Энергия',cat:'Ментальное',type:'rating',unit:'1-5',goalDay:4,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'anytime',icon:'⚡',color:'#eab308',why:'Отслеживать пики и провалы',archived:false},
  {id:'H09',name:'Фокус-время',cat:'Работа',type:'duration',unit:'мин',goalDay:240,goalMonth:22,goalYear:264,period:'daily',days:[],dir:'up',time:'day',icon:'🎯',color:'#3b82f6',why:'Глубокая работа = результаты',archived:false},
  {id:'H10',name:'Время с близкими',cat:'Отношения',type:'duration',unit:'мин',goalDay:120,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'evening',icon:'❤️',color:'#ef4444',why:'Крепкие отношения',archived:false},
  {id:'H11',name:'Звонок близким',cat:'Отношения',type:'check',unit:'раз',goalDay:1,goalMonth:8,goalYear:100,period:'weekly',days:[2],dir:'up',time:'anytime',icon:'📞',color:'#f97316',why:'Связь с семьёй',archived:false},
  {id:'H12',name:'Английский',cat:'Обучение',type:'duration',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'day',icon:'🇬🇧',color:'#0ea5e9',why:'Свободный разговорный',archived:false},
  {id:'H13',name:'Курсы',cat:'Обучение',type:'duration',unit:'мин',goalDay:30,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'day',icon:'🎓',color:'#14b8a6',why:'Новые компетенции',archived:false},
  {id:'H14',name:'Алкоголь',cat:'Вредные',type:'count',unit:'порц.',goalDay:0,goalMonth:2,goalYear:12,period:'weekly',days:[4,5],dir:'down',time:'evening',icon:'🍷',color:'#71717a',why:'Контроль потребления',archived:false},
  {id:'H15',name:'Залипание',cat:'Вредные',type:'duration',unit:'мин',goalDay:30,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'down',time:'anytime',icon:'📱',color:'#737373',why:'Вернуть 2ч/день',archived:false},
  {id:'H16',name:'Прокрастинация',cat:'Вредные',type:'rating',unit:'1-5',goalDay:2,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'down',time:'evening',icon:'🐌',color:'#78716c',why:'Начинать без сопротивления',archived:false},
  {id:'H17',name:'Аффирмации',cat:'Ментальное',type:'check',unit:'раз',goalDay:1,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'🌟',color:'#d946ef',why:'Программируем подсознание',archived:false},
  {id:'H18',name:'Чистка зубов',cat:'Здоровье',type:'check',unit:'раз',goalDay:2,goalMonth:60,goalYear:730,period:'daily',days:[],dir:'up',time:'morning',icon:'🦷',color:'#38bdf8',why:'Здоровые зубы',archived:false},
  {id:'H19',name:'Протеин',cat:'Здоровье',type:'count',unit:'г',goalDay:25,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'💪',color:'#f472b6',why:'Мышечное восстановление',archived:false},
  {id:'H20',name:'Контент',cat:'Контент',type:'check',unit:'раз',goalDay:1,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'day',icon:'📸',color:'#8b5cf6',why:'Развитие личного бренда',archived:false},
  {id:'H21',name:'Приём БАД',cat:'Здоровье',type:'check',unit:'раз',goalDay:1,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'💊',color:'#22d3ee',why:'Поддержка здоровья',archived:false,badList:['Витамин D','Омега-3','Магний']},
  {id:'H22',name:'Прогулка',cat:'Здоровье',type:'count',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'day',icon:'🚶',color:'#4ade80',why:'Свежий воздух, движение',archived:false,walkMode:'min'},
  {id:'H23',name:'Контрастный душ',cat:'Здоровье',type:'check',unit:'раз',goalDay:1,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'morning',icon:'🚿',color:'#67e8f9',why:'Иммунитет, бодрость',archived:false},
  {id:'H24',name:'Цифровой детокс',cat:'Ментальное',type:'duration',unit:'мин',goalDay:60,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'evening',icon:'🔇',color:'#a78bfa',why:'Качественный отдых, сон',archived:false},
];

const DQ = ["Вы не обязаны быть великими, чтобы начать","Маленькие шаги ведут к большим результатам","Дисциплина — мост между целями и достижениями","Через год вы будете рады, что начали сегодня","Система работает всегда","1% лучше каждый день = в 37 раз лучше через год","Путь в тысячу миль начинается с одного шага","Прогресс, а не совершенство","Вы конкурируете только с вчерашней версией себя","Действие лечит страх","Каждое утро — новый шанс","Боль дисциплины весит граммы, боль сожаления — тонны","Лучший проект — вы сами","Награда за дисциплину — свобода","Записывайте, чтобы осознавать","Стабильность важнее интенсивности","Каждый выбор — голос за человека, которым хотите стать","Вы уже на правильном пути"];

const DA = "Я — успешный человек\nЯ заслуживаю богатства, здоровья и счастья\nМоё тело сильное и здоровое\nЯ строю крепкие отношения с близкими\nЯ спокоен(а), уверен(а) и сфокусирован(а)\nКаждый день я становлюсь на 1% лучше\nМои действия создают мою реальность\nМоё дело растёт и приносит пользу\nЯ свободен(а) от вредных привычек\nСегодня — лучший день стать лучше";

const DQK = ['H02','idea','unplanned','H08'];
const SOCIALS = ['Instagram','Telegram','YouTube','TikTok','LinkedIn','Twitter','Другое'];
const CONTENT_TYPES = ['Пост','Видео','Stories','Reels','Подкаст','Статья','Другое'];
const DEFAULT_REF_SECTIONS = [
  { id: 'tasks', title: '🎯 3 задачи на сегодня', count: 3, type: 'tasks' },
  { id: 'thanks', title: '❤️ Благодарность', count: 3, type: 'simple' },
  { id: 'proud', title: '💪 Чем горжусь сегодня', count: 3, type: 'simple' },
];

const HELP_TEXT = `## Как пользоваться WildHabits\n\n**🏠 Главный экран** — ваши привычки на сегодня, сгруппированные по времени дня.\n\n**📋 Все привычки** — полный список. Добавляйте, редактируйте, архивируйте.\n\n**📅 План** — календарь месяца с цветными точками.\n\n**📊 Статистика** — графики, heatmap, фильтры по периоду.\n\n**🏆 Ачивки** — система уровней и достижений.\n\n**💬 Мотивация** — коллекция фраз. Добавляйте свои.\n\n**🌟 Аффирмации** — утренние утверждения через ридер.\n\n**💡 Идеи** — записывайте идеи с категориями и приоритетами.\n\n**📝 Рефлексия** — задачи, благодарности, достижения дня.\n\n**📤 Экспорт** — CSV для Google Sheets или Excel.`;

const COMEBACK_MSGS = [
  "С возвращением! Каждый новый день — новый шанс 🌅",
  "Рады видеть вас снова! Начнём с малого? 💪",
  "Вы здесь — значит, вы на верном пути ✨",
  "Пропуски — это нормально. Главное — продолжать 🌿",
  "Отлично, что вы вернулись! Прогресс > совершенство 🚀",
];

async function ld(k, fb) { try { const r = await window.storage.get(S(k)); return r?.value ? JSON.parse(r.value) : fb; } catch { return fb; } }
async function sv(k, d) { try { await window.storage.set(S(k), JSON.stringify(d)); } catch {} }
function sumH(l, h) { if (!l.length) return 0; if (h.type === 'rating' || h.type === 'scale' || h.type === 'sleep') return l[0]?.value || 0; return l.reduce((s, x) => s + (x.value || 0), 0); }
function sumH2(l, h) { if (!l.length) return 0; if (h.type === 'rating' || h.type === 'scale' || h.type === 'sleep') { const v = l.map(x => x.value || 0); return v.reduce((a, b) => a + b, 0) / v.length; } return l.reduce((s, x) => s + (x.value || 0), 0); }
function fmtV(v) { if (!v && v !== 0) return '0'; if (Number.isInteger(v)) return String(v); return v.toFixed(1); }
function fmtEl(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`; }
function calcStr(logs, h) { if (h.period !== 'daily') return 0; let s = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setHours(0,0,0,0); const st = d.getTime() - i * 86400000, en = st + 86400000; const dl = logs.filter(l => l.ts >= st && l.ts < en); if (!dl.length) { if (i === 0) continue; else break; } const v = sumH(dl, h); const ok = h.dir === 'up' ? (h.goalDay > 0 && v >= h.goalDay) : (v > 0 && v <= (h.goalDay || 999)); if (ok) s++; else if (i === 0) continue; else break; } return s; }

const THEMES = {
  dark: { bg: '#09090b', bg2: '#18181b', bg3: '#27272a', border: '#27272a', text: '#fafafa', text2: '#a1a1aa', text3: '#71717a' },
  light: { bg: '#f9fafb', bg2: '#ffffff', bg3: '#f3f4f6', border: '#e5e7eb', text: '#111827', text2: '#6b7280', text3: '#9ca3af' }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
* { font-family: 'Montserrat', system-ui, sans-serif; box-sizing: border-box; }
body { font-size: clamp(15px, 4vw, 17px); }
body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 150px 150px; }
body.theme-light::before { opacity: 0.025; }
body.theme-light { background: #f2f2f7 !important; color: #1c1c1e !important; }
body.theme-light * { color: inherit; }
body.theme-light .min-h-screen, body.theme-light .bg-zinc-950 { background: #f2f2f7 !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-900"] { background: #ffffff !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-800"] { background: #e5e5ea !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-700"] { background: #d1d1d6 !important; }
body.theme-light [class*="border-zinc-8"], body.theme-light [class*="border-zinc-7"] { border-color: #c7c7cc !important; }
body.theme-light [class*="text-zinc-1"] { color: #1c1c1e !important; }
body.theme-light [class*="text-zinc-2"] { color: #1c1c1e !important; }
body.theme-light [class*="text-zinc-3"] { color: #3a3a3c !important; }
body.theme-light [class*="text-zinc-4"] { color: #48484a !important; }
body.theme-light [class*="text-zinc-5"] { color: #636366 !important; }
body.theme-light [class*="text-zinc-6"] { color: #8e8e93 !important; }
body.theme-light .inp { background: #ffffff !important; border: 1px solid #c7c7cc !important; color: #1c1c1e !important; }
body.theme-light .inp::placeholder { color: #aeaeb2 !important; font-style: italic; }
body.theme-light select, body.theme-light select option { background: #ffffff !important; color: #1c1c1e !important; }
body.theme-light .bg-black\/80 { background: rgba(0,0,0,0.5) !important; }
body.theme-light [class*="text-zinc-9"] { color: #1c1c1e !important; }
.inp { width: 100%; padding: 12px 16px; border-radius: 14px; background: #18181b; border: 1px solid #27272a; outline: none; font-size: clamp(15px, 4vw, 17px); color: #fafafa; }
.inp:focus { border-color: #3f3f46; }
.btn-primary { width: 100%; padding: 16px; border-radius: 16px; font-weight: 700; font-size: clamp(15px, 4vw, 17px); display: flex; align-items: center; justify-content: center; gap: 8px; }
h1 { font-size: clamp(18px, 5vw, 22px); }
h2 { font-size: clamp(16px, 4.5vw, 20px); }
@keyframes confetti { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(-80px) rotate(360deg); opacity: 0; } }
.confetti { animation: confetti 1s ease-out forwards; }
@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.pop-in { animation: popIn 0.4s ease-out; }
.inp::placeholder { color: #52525b; font-style: italic; }
body.theme-light .inp::placeholder { color: #9ca3af; font-style: italic; }
`;

export default function App() {
  const [rdy, setRdy] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState(null)
  const [scr, setScr] = useState('home')
  const [habits, setHab] = useState([])
  const [logs, setLogs] = useState([])
  const [quotes, setQ] = useState(DQ)
  const [affirm, setAf] = useState(DA)
  const [skips, setSk] = useState([])
  const [unplanned, setUp] = useState([])
  const [reflections, setRef] = useState([])
  const [refSections, setRefSec] = useState(DEFAULT_REF_SECTIONS)
  const [ideas, setIdeas] = useState([])
  const [quickIds, setQuick] = useState(DQK)
  const [undo, setUndo] = useState([])
  const [aId, setAId] = useState(null)
  const [eId, setEId] = useState(null)
  const [eLTs, setELTs] = useState(null)
  const [tmrs, setTmrs] = useState({})
  const [tick, setTick] = useState(0)
  const [toast, setToast] = useState(null)
  const [menu, setMenu] = useState(false)
  const [qkO, setQkO] = useState(null)
  const [xp, setXp] = useState(0)
  const [achPop, setAchPop] = useState(null)

  // Применяем тему
  useEffect(() => {
    const saved = localStorage.getItem('wh:theme') || 'dark'
    setTheme(saved)
    document.body.className = saved === 'light' ? 'theme-light' : ''
  }, [])
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('wh:theme', next)
    document.body.className = next === 'light' ? 'theme-light' : ''
  }

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) loadAll(u)
      else setRdy(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) loadAll(u)
      else { setRdy(true); setHab([]); setLogs([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadAll = async (u) => {
    const [h, l, sk, rf, id, set] = await Promise.all([
      db.loadHabits(u.id, DH),
      db.loadLogs(u.id),
      db.loadSkips(u.id),
      db.loadReflections(u.id),
      db.loadIdeas(u.id),
      db.loadSettings(u.id),
    ])
    setHab(h); setLogs(l); setSk(sk); setRef(rf); setIdeas(id)
    if (set.quotes) setQ(set.quotes)
    if (set.affirm) setAf(set.affirm)
    if (set.refSections) setRefSec(set.refSections)
    if (set.quickIds) setQuick(set.quickIds)
    if (set.xp) setXp(set.xp)
    setRdy(true)
  }

  const saveSetting = async (key, val) => {
    if (!user) return
    const cur = { quotes, affirm, refSections, quickIds, xp }
    const upd = { ...cur, [key]: val }
    await db.saveSettings(user.id, upd)
  }

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (!achPop) return; const t = setTimeout(() => setAchPop(null), 3000); return () => clearTimeout(t) }, [achPop])

  const show = (m, a) => setToast({ m, a })

  const gainXp = async (amt = 5) => {
    const n = xp + amt; setXp(n)
    const ol = getLevel(xp), nl = getLevel(n)
    if (nl.idx > ol.idx) setAchPop(`${nl.icon} Уровень: ${nl.name}!`)
    if (user) await saveSetting('xp', n)
  }

  const addLogFn = async e => {
    const l = { ts: e.ts || Date.now(), ...e }
    if (user) {
      const h = habits.find(x => x.id === e.habitId)
      const saved = await db.addLog(user.id, l, h?.name || '', h?.unit || '')
      const n = [saved, ...logs]; setLogs(n)
    } else setLogs(p => [l, ...p])
    gainXp(5)
  }

  const delLog = async ts => {
    const e = logs.find(l => l.ts === ts)
    if (e) setUndo(u => [{ type: 'log', data: e }, ...u.slice(0, 19)])
    if (user) await db.deleteLog(user.id, ts)
    setLogs(p => p.filter(l => l.ts !== ts))
    show('Удалено', () => undoAct())
  }

  const updLog = async (ts, u2) => {
    if (user) await db.updateLog(user.id, ts, u2)
    setLogs(p => p.map(l => l.ts === ts ? { ...l, ...u2 } : l))
    show('Обновлено')
  }

  const undoAct = async () => {
    if (!undo.length) return
    const [last, ...rest] = undo
    if (last.type === 'log') { await addLogFn(last.data) }
    if (last.type === 'idea') {
      if (user) { const saved = await db.addIdea(user.id, last.data); setIdeas(p => [saved, ...p]) }
      else setIdeas(p => [last.data, ...p])
    }
    setUndo(rest); show('Отменено ✓')
  }

  const stTmr = id => setTmrs(t => ({ ...t, [id]: Date.now() }))
  const spTmr = (id, n = '') => {
    const s = tmrs[id]; if (!s) return
    const m = Math.round((Date.now() - s) / 60000 * 10) / 10
    addLogFn({ habitId: id, value: m, start: s, end: Date.now(), note: n })
    setTmrs(t => { const { [id]: _, ...r } = t; return r })
  }
  const cTmr = id => setTmrs(t => { const { [id]: _, ...r } = t; return r })
  const go = s => { setScr(s); setMenu(false); setQkO(null) }
  const goH = id => { setAId(id); setScr('detail'); setMenu(false); setQkO(null) }

  if (!rdy) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <style>{CSS}</style>
      <div className="text-center">
        <div className="text-4xl font-black text-violet-500 mb-2">WH</div>
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    </div>
  )

  if (!user) return <AuthScreen onAuth={() => {}} />

  const habit = habits.find(h => h.id === aId)
  const actH = habits.filter(h => !h.archived)
  const p = { habits: actH, allHabits: habits, logs, skips, unplanned, reflections, refSections, tmrs, tick, quotes, affirm, user, quickIds, ideas, xp }

  return (
    <>
      <Head>
        <title>WildHabits</title>
        <meta name="description" content="Дикие привычки — трекер привычек" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WildHabits" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </Head>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <style>{CSS}</style>
        {menu && <MenuOvl onClose={() => setMenu(false)} go={go} undo={undo} onUndo={undoAct} xp={xp} avatar={typeof window !== 'undefined' ? localStorage.getItem('wh:avatar') : null} userName={typeof window !== 'undefined' ? (localStorage.getItem('wh:name') || user?.email?.split('@')[0]) : user?.email?.split('@')[0]} />}
        {toast && <Toast m={toast.m} a={toast.a} onX={() => setToast(null)} />}
        {achPop && <AchPop text={achPop} />}

        {scr === 'home' && <Home {...p} onMenu={() => setMenu(true)} onH={goH} onSettings={id => { setEId(id); go('editH') }}
          onSkip={async (id, r) => { const s = { habitId: id, date: tk(), reason: r, ts: Date.now() }; if (user) await db.addSkip(user.id, s); setSk(p => [s, ...p]); addLogFn({ habitId: id, value: 0, note: r || 'Пропуск', ts: Date.now(), isSkip: true }); show('Пропуск') }}
          onUnplanned={async e => { const n = { ts: Date.now(), date: tk(), ...e }; setUp(p => [n, ...p]); show('Записано') }}
          onReflect={async r => {
            setRef(p => { const n = p.filter(x => x.date !== r.date); return [r, ...n] })
            if (user) {
              try { await db.saveReflection(user.id, r) } catch(e) { console.error('ref save:', e) }
            }
            // Также в localStorage как резерв
            try { localStorage.setItem('wh:ref:' + r.date, JSON.stringify(r)) } catch {}
          }}
          addLog={addLogFn} qkO={qkO} setQkO={setQkO}
          onAddIdea={async idea => {
            const base = { id: Date.now(), date: tk(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), text: idea.text, category: idea.category || '', priority: idea.priority || 'medium', done: false }
            if (user) { const saved = await db.addIdea(user.id, base); setIdeas(p => [saved, ...p]) } else setIdeas(p => [base, ...p])
            show('Идея ✓'); gainXp(3)
          }} />}

        {scr === 'detail' && habit && <Detail habit={habit} logs={logs} timer={tmrs[habit.id]} tick={tick} affirm={affirm} onBack={() => go('home')} addLog={addLogFn} delLog={delLog} updLog={updLog} stTmr={() => stTmr(habit.id)} spTmr={n => spTmr(habit.id, n)} cTmr={() => cTmr(habit.id)}
          onSkip={async (id, r) => { const s = { habitId: id, date: tk(), reason: r, ts: Date.now() }; if (user) await db.addSkip(user.id, s); setSk(p => [s, ...p]); addLogFn({ habitId: id, value: 0, note: r || 'Пропуск', ts: Date.now(), isSkip: true }); show('Пропуск') }}
          eLTs={eLTs} setELTs={setELTs} habits={habits}
          setHab={async h => { setHab(h); if (user) for (const hab of h) await db.saveHabit(user.id, hab) }} />}

        {scr === 'allHabits' && <AllH habits={habits} onBack={() => go('home')} onH={goH}
          onEdit={id => { setEId(id); go('editH') }}
          onDel={async id => { const h = habits.find(x => x.id === id); if (h) setUndo(u => [{ type: 'habit', data: h }, ...u.slice(0, 19)]); if (user) await db.deleteHabit(user.id, id); setHab(p => p.filter(x => x.id !== id)); show('Удалено', () => undoAct()) }}
          onAdd={() => { setEId(null); go('editH') }}
          onArch={async id => { const n = habits.map(h => h.id === id ? { ...h, archived: !h.archived } : h); setHab(n); if (user) await db.saveHabit(user.id, n.find(h => h.id === id)); show('Обновлено') }} />}

        {scr === 'editH' && <EditH habit={eId ? habits.find(h => h.id === eId) : null} onBack={() => go('allHabits')}
          onSave={async h => {
            if (eId) {
              const n = habits.map(x => x.id === h.id ? h : x)
              setHab(n)
              if (user) await db.saveHabit(user.id, h)
            } else {
              const newH = { ...h, id: 'H' + Date.now(), archived: false }
              const n = [...habits, newH]
              setHab(n)
              if (user) await db.saveHabit(user.id, newH)
            }
            go('allHabits'); show(eId ? 'Обновлено' : 'Добавлено ✓')
          }} />}

        {scr === 'plan' && <Plan habits={actH} logs={logs} onBack={() => go('home')} />}
        {scr === 'stats' && <Stats logs={logs} habits={actH} skips={skips} onBack={() => go('home')} />}
        {scr === 'ach' && <Ach logs={logs} habits={actH} xp={xp} onBack={() => go('home')} />}
        {scr === 'mot' && <Mot quotes={quotes} onBack={() => go('home')} onSave={async q => { setQ(q); await saveSetting('quotes', q); show('Сохранено') }} />}
        {scr === 'aff' && <AffScr text={affirm} onBack={() => go('home')} onSave={async t => { setAf(t); await saveSetting('affirm', t); show('Сохранено') }} />}
        {scr === 'ideas' && <IdeasScr ideas={ideas} onBack={() => go('home')}
          onUpd={async i => { setIdeas(i) }}
          onAdd={async idea => { if (user) { const s = await db.addIdea(user.id, idea); setIdeas(p => [s, ...p]) } else setIdeas(p => [idea, ...p]) }}
          onUpdate={async (id, upd) => { if (user) await db.updateIdea(user.id, id, upd); setIdeas(p => p.map(x => x.id === id ? { ...x, ...upd } : x)) }}
          onDelete={async id => { const idea = ideas.find(x => x.id === id); if (idea) setUndo(u => [{ type: 'idea', data: idea }, ...u.slice(0, 19)]); if (user) await db.deleteIdea(user.id, id); setIdeas(p => p.filter(x => x.id !== id)); show('Удалено', () => undoAct()) }}
          show={show} />}
        {scr === 'refH' && <RefHist reflections={reflections} refSections={refSections} onBack={() => go('home')}
          onUpd={async r => { setRef(r) }}
          onSaveSec={async s => { setRefSec(s); await saveSetting('refSections', s); show('Сохранено') }} />}
        {scr === 'qkS' && <QkSet habits={actH} quickIds={quickIds} onBack={() => go('home')} onSave={async q => { setQuick(q); await saveSetting('quickIds', q); show('Сохранено') }} />}
        {scr === 'acct' && <Acct user={user} onBack={() => go('home')} onOut={async () => { await db.signOut(); setUser(null) }} />}
        {scr === 'exp' && <Exp logs={logs} habits={habits} skips={skips} onBack={() => go('home')} />}
        {scr === 'history' && <HistoryScr logs={logs} habits={actH} skips={skips} onBack={() => go('home')} />}
        {scr === 'events' && <EventsScr onBack={() => go('home')} user={user} show={show} />}
        {scr === 'help' && <HelpScr onBack={() => go('home')} />}
        {scr === 'feedback' && <Feedback onBack={() => go('home')} show={show} user={user} />}
        {scr === 'settings' && <SettingsScr onBack={() => go('home')} theme={theme} onToggleTheme={toggleTheme} />}
      </div>
    </>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) return
    setLoading(true); setErr('')
    try {
      if (mode === 'login') await db.signIn(email, pass)
      else await db.signUp(email, pass, name || email.split('@')[0])
    } catch (e) {
      setErr(e.message === 'Invalid login credentials' ? 'Неверный email или пароль' : e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <style>{CSS}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="WH" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="font-black tracking-tight" style={{ color: '#7c3aed', fontSize: 'clamp(20px,5vw,26px)' }}>WILD HABITS</h1>
          <p className="text-zinc-500 mt-1" style={{ fontSize: '12px' }}>{V} · Дикие привычки</p>
        </div>
        <div className="flex mb-6 bg-zinc-900 rounded-xl p-1">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-lg font-semibold ${mode === 'login' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}>Войти</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 rounded-lg font-semibold ${mode === 'register' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}>Регистрация</button>
        </div>
        <div className="space-y-3">
          {mode === 'register' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" className="inp" />}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="inp" autoComplete="email" />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Пароль (минимум 6 символов)" type="password" className="inp" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {err && <div className="text-rose-400 text-sm px-1">{err}</div>}
          <button onClick={submit} disabled={loading} className="btn-primary text-white active:scale-[0.98] transition-transform disabled:opacity-50" style={{ background: '#7c3aed' }}>
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
          {mode === 'login' && <button onClick={async () => { if (!email) { setErr('Введите email'); return; } try { await db.resetPassword(email); setErr(''); alert('Письмо отправлено! Проверьте почту.'); } catch(e) { setErr(e.message); } }} className="w-full text-center text-sm text-zinc-500 py-1 active:text-zinc-300">Забыли пароль?</button>}
        </div>
      </div>
    </div>
  )
}


function AccordionMenu({ groups, go }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-0.5">
      {groups.map((g, gi) => (
        <div key={g.title}>
          <button onClick={() => setOpen(open === gi ? null : gi)} className="w-full px-3 py-3 flex items-center justify-between active:bg-zinc-800/50 rounded-xl">
            <span className="text-base font-black tracking-tight">{g.title}</span>
            <span className="text-zinc-500 text-sm">{open === gi ? '▲' : '▼'}</span>
          </button>
          {open === gi && (
            <div className="space-y-0.5 pl-2 pb-1">
              {g.items.map(it => (
                <button key={it.l} onClick={() => go(it.s)} className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 active:bg-zinc-800 text-left">
                  <span className="text-base">{it.i}</span>
                  <span className="font-medium text-sm text-zinc-300">{it.l}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MenuOvl({ onClose, go, undo, onUndo, xp, avatar, userName }) {
  const lv = getLevel(xp);
  const groups = [
    { title: '📋 Главное', items: [
      { i: '🏠', l: 'Привычки дня', s: 'home' },
      { i: '📋', l: 'Настроить привычки', s: 'allHabits' },
      { i: '📅', l: 'План', s: 'plan' },
      { i: '⚡', l: 'Быстрые записи', s: 'qkS' },
    ]},
    { title: '📊 Аналитика', items: [
      { i: '📊', l: 'Статистика', s: 'stats' },
      { i: '🏆', l: 'Ачивки', s: 'ach' },
      { i: '📚', l: 'Вся история', s: 'history' },
    ]},
    { title: '🧘 Практики', items: [
      { i: '💡', l: 'Идеи', s: 'ideas' },
      { i: '📅', l: 'События', s: 'events' },
      { i: '📝', l: 'Рефлексия', s: 'refH' },
      { i: '💬', l: 'Мотивация', s: 'mot' },
      { i: '🌟', l: 'Аффирмации', s: 'aff' },
    ]},
    { title: '⚙️ Настройки', items: [
      { i: '👤', l: 'Аккаунт', s: 'acct' },
      { i: '⚙️', l: 'Настройки', s: 'settings' },
      { i: '📤', l: 'Экспорт', s: 'exp' },
      { i: '❓', l: 'О приложении', s: 'help' },
      { i: '💌', l: 'Обратная связь', s: 'feedback' },
    ]},
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xl overflow-hidden">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : '👤'}
            </div>
            <div className="font-semibold text-sm">{userName || 'Профиль'}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">✕</button>
        </div>
        <div className="mb-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-2"><span className="text-xl">{lv.icon}</span><div><div className="font-bold text-sm">{lv.name}</div><div className="text-xs text-zinc-400">{xp} XP{lv.next ? ` · до ${lv.next.name}: ${lv.next.min - xp}` : ''}</div></div></div>
          {lv.next && <div className="mt-2 h-1.5 rounded-full bg-zinc-700 overflow-hidden"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${((xp - lv.min) / (lv.next.min - lv.min)) * 100}%` }} /></div>}
        </div>
        <AccordionMenu groups={groups} go={go} />
        {undo.length > 0 && <button onClick={() => { onUndo(); onClose(); }} className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-400 font-medium active:scale-[0.98]"><span>↩</span> Отменить последнее удаление</button>}
        <div className="mt-3 flex items-center justify-center gap-2 py-2">
          <img src="/logo.png" alt="WH" className="h-5 w-auto opacity-40" />
          <span className="text-[10px] text-zinc-600">{V}</span>
        </div>
        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20"><div className="font-semibold text-violet-400 mb-1">🚀 Pro</div><div className="text-xs text-zinc-500">ИИ аналитика, Telegram-бот, авто-экспорт. Скоро!</div></div>
      </div>
    </div>
  );
}

function Toast({ m, a, onX }) {
  return (<div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center"><div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl max-w-sm"><span className="flex-1">{m}</span>{a && <button onClick={() => { a(); onX(); }} className="font-semibold text-amber-400">Отменить</button>}</div></div>);
}

function AchPop({ text }) {
  return (<div className="fixed top-16 left-4 right-4 z-50 flex justify-center pop-in"><div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl px-6 py-4 shadow-2xl text-center"><div className="text-2xl mb-1">🎉</div><div className="font-bold text-white">{text}</div></div></div>);
}


function TimeScroller({ hour, minute, onHour, onMinute, label }) {
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'))
  return (
    <div>
      {label && <div className="text-xs text-zinc-500 mb-1">{label}</div>}
      <div className="flex gap-2 items-center">
        <select value={hour} onChange={e => onHour(e.target.value)} className="inp flex-1 text-center tabular-nums appearance-none">
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-zinc-400 font-bold">:</span>
        <select value={minute} onChange={e => onMinute(e.target.value)} className="inp flex-1 text-center tabular-nums appearance-none">
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  )
}

function SH({ text, color = 'text-zinc-500' }) { return <div className={`text-xs uppercase tracking-widest ${color} mb-2 px-1 font-bold`}>{text}</div>; }
function Fld({ l, children }) { return <div><div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{l}</div>{children}</div>; }
function Sel({ opts, val, onCh }) { return <div className="flex flex-wrap gap-1.5">{opts.map(o => <button key={o.v} onClick={() => onCh(o.v)} className={`px-3 py-2.5 rounded-lg font-medium ${val === o.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{o.l}</button>)}</div>; }
function MStat({ l, v }) { return <div className="p-2 rounded-lg bg-zinc-800/30 text-center"><div className="text-[11px] text-zinc-500">{l}</div><div className="font-bold tabular-nums mt-0.5">{v}</div></div>; }
function CirP({ value, color, size = 56 }) { const r = size * .42, c = 2 * Math.PI * r, off = c - Math.min(value, 1) * c, cx = size / 2; return <svg width={size} height={size} className="-rotate-90"><circle cx={cx} cy={cx} r={r} stroke="#27272a" strokeWidth="5" fill="none" /><circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .5s' }} /><text x={cx} y={cx} textAnchor="middle" dominantBaseline="central" className="fill-zinc-100 font-bold rotate-90" style={{ transformOrigin: `${cx}px ${cx}px`, fontSize: size * .22 }}>{Math.round(value * 100)}%</text></svg>; }

/* ============ HOME ============ */
function Home({ habits, logs, skips, tmrs, tick, quotes, quickIds, ideas, unplanned, onMenu, onH, onSkip, onUnplanned, reflections, refSections, onReflect, addLog, affirm, qkO, setQkO, onAddIdea, xp, onSettings }) {
  const today = tk(); const dow = mD(); const ts0 = new Date(); ts0.setHours(0, 0, 0, 0);
  const quoteList = Array.isArray(quotes) ? quotes : (typeof quotes === 'string' ? quotes.split('\n').filter(Boolean) : []); const quote = useMemo(() => quoteList[Math.floor(Math.random() * (quoteList.length || 1))] || '', []);
  const tH = useMemo(() => habits.filter(h => {
    if (h.period === 'daily') return true;
    if (h.period === 'weekly') return (h.days || []).includes(dow) || !(h.days || []).length;
    if (h.period === 'monthly') return (h.days || []).includes(new Date().getDate() - 1);
    if (h.period === 'custom') return (h.days || []).includes(dow);
    return true;
  }), [habits, dow]);
  const tL = logs.filter(l => l.ts >= ts0.getTime()); const tSk = skips.filter(s => s.date === today);
  const grps = useMemo(() => { const g = { morning: [], day: [], evening: [], anytime: [], done: [] }; tH.forEach(h => { const hL = tL.filter(l => l.habitId === h.id); const v = sumH(hL, h); const sk = tSk.some(s => s.habitId === h.id); const isDone = sk || (h.type === 'sleep' || h.type === 'scale' ? v > 0 : h.dir === 'up' ? (h.goalDay > 0 && v >= h.goalDay) : (h.type === 'check' && v > 0)); if (isDone) g.done.push(h); else (g[h.time] || g.anytime).push(h); }); return g; }, [tH, tL, tSk]);
  const total = tH.length, done = grps.done.length, pct = total ? Math.round(done / total * 100) : 0;
  const [upN, setUpN] = useState(''); const [upM, setUpM] = useState(''); const [ideaTxt, setIdeaTxt] = useState(''); const [ideaCat, setIdeaCat] = useState(''); const [ideaPri, setIdeaPri] = useState('medium'); const [waterAmt, setWA] = useState('');
  const tR = reflections.find(r => r.date === today) || { date: today, data: {} };
  const [ref, setR] = useState(tR);
  useEffect(() => {
    const found = reflections.find(r => r.date === today)
    if (found) setR(found)
  }, [today, reflections.length])

  const uR = (secId, idx, key, val) => {
    setR(prev => {
      const d = { ...(prev.data || {}) }
      if (!d[secId]) d[secId] = {}
      if (!d[secId][key]) d[secId][key] = []
      const arr = [...(d[secId][key] || [])]
      arr[idx] = val
      d[secId] = { ...d[secId], [key]: arr }
      const next = { ...prev, data: d }
      // Сохраняем немедленно
      onReflect(next)
      return next
    })
  }

  const gl = { morning: '🌅 Утро', day: '☀️ День', evening: '🌙 Вечер', anytime: '⏳ В течение дня' };
  const qI = { H02: '💧', H08: '⚡', idea: '💡', unplanned: '📋' }; const getQI = id => { if (qI[id]) return qI[id]; const h = habits.find(x => x.id === id); return h ? h.icon : '⚡'; };
  const pIcons = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <div className="max-w-md mx-auto px-4 pb-24">
      <div className="pt-5 pb-2 flex items-center gap-3">
        <button onClick={onMenu} className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95 shrink-0 text-lg">☰</button>
        <img src='/logo.png' alt='WH' className='h-8 w-auto shrink-0' />
        <div className="flex-1 min-w-0">
          <div className="font-black leading-tight" style={{ fontSize: 'clamp(16px,4vw,18px)' }}>{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
          <div className="text-zinc-500 capitalize" style={{ fontSize: 'clamp(12px,3vw,13px)' }}>{new Date().toLocaleDateString('ru-RU', { weekday: 'long' })}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 shrink-0">
          {quickIds.slice(0, 4).map((qid, qi) => (
            <button key={qi} onClick={() => setQkO(qkO === qid ? null : qid)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg active:scale-90 transition-all ${qkO === qid ? 'bg-violet-500/20 ring-2 ring-violet-500/50' : 'bg-zinc-900 border border-zinc-800'}`}>{getQI(qid)}</button>
          ))}
        </div>
      </div>

      {qkO === 'H02' && <QkPanel color="cyan" icon="💧" title="Вода"><div className="grid grid-cols-4 gap-2">{[200, 250, 350, 500].map(n => <button key={n} onClick={() => { addLog({ habitId: 'H02', value: n, note: '' }); setQkO(null); }} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}</button>)}</div><div className="flex gap-2 mt-2"><input type="number" value={waterAmt} onChange={e => setWA(e.target.value)} placeholder="мл" className="inp flex-1 tabular-nums" /><button onClick={() => { if (waterAmt) { addLog({ habitId: 'H02', value: parseFloat(waterAmt), note: '' }); setWA(''); setQkO(null); } }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-95">OK</button></div></QkPanel>}
      {qkO === 'idea' && <QkPanel color="amber" icon="💡" title="Идея"><input value={ideaTxt} onChange={e => setIdeaTxt(e.target.value)} placeholder="Запишите идею..." className="inp" /><div className="flex gap-2 mt-2"><input value={ideaCat} onChange={e => setIdeaCat(e.target.value)} placeholder="Категория" className="inp flex-1" /><div className="flex gap-1">{['low','medium','high'].map(p => <button key={p} onClick={() => setIdeaPri(p)} className={`w-10 h-10 rounded-lg flex items-center justify-center ${ideaPri === p ? 'ring-2 ring-zinc-400' : ''} bg-zinc-800`}>{pIcons[p]}</button>)}</div></div><button onClick={() => { if (ideaTxt) { onAddIdea({ text: ideaTxt, category: ideaCat, priority: ideaPri }); setIdeaTxt(''); setIdeaCat(''); setQkO(null); } }} className="w-full mt-2 p-3 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-[0.98]">Записать</button></QkPanel>}
      {qkO === 'unplanned' && <QkPanel color="zinc" icon="📋" title="Без плана"><p className="text-xs text-zinc-500 mb-2">Запись попадёт в раздел «Вся история»</p><input value={upN} onChange={e => setUpN(e.target.value)} placeholder="Что делали?" className="inp" /><input type="number" value={upM} onChange={e => setUpM(e.target.value)} placeholder="Минут" className="inp mt-2 tabular-nums" /><button onClick={() => { if (upN) { onUnplanned({ name: upN, minutes: parseFloat(upM) || 0 }); setUpN(''); setUpM(''); setQkO(null); } }} className="w-full mt-2 p-3 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-[0.98]">Записать</button></QkPanel>}
      {qkO === 'H08' && <QkPanel color="yellow" icon="⚡" title="Энергия"><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(n => { const c = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][n - 1]; return <button key={n} onClick={() => { addLog({ habitId: 'H08', value: n, note: '' }); setQkO(null); }} className="aspect-square rounded-xl border-2 active:scale-95 font-bold text-xl flex items-center justify-center" style={{ borderColor: c, color: c }}>{n}</button>; })}</div></QkPanel>}

      <div className="mt-2 mb-3 px-2"><p className="text-zinc-500 italic text-center leading-relaxed" style={{ fontSize: 'clamp(12px,3vw,14px)' }}>{quote}</p></div>

      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800">
        <div className="flex items-center justify-between mb-2"><span className="text-zinc-400">Прогресс</span><span className="font-bold tabular-nums">{done}/{total} · {pct}%</span></div>
        <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      </div>

      {Object.keys(tmrs).length > 0 && <div className="mb-3"><SH text="⏱ Идёт" />{Object.entries(tmrs).map(([hid, start]) => { const h = habits.find(x => x.id === hid); if (!h) return null; return <button key={hid} onClick={() => onH(hid)} className="w-full mb-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 active:scale-[0.98]"><span className="text-xl">{h.icon}</span><div className="flex-1 text-left"><div className="font-semibold">{h.name}</div><div className="text-amber-400 tabular-nums">{fmtEl(Math.floor((Date.now() - start) / 1000))}</div></div><div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" /></button>; })}</div>}

      {['morning', 'day', 'evening', 'anytime'].map(g => grps[g].length > 0 && <div key={g} className="mb-3"><SH text={gl[g]} /><div className="space-y-1.5">{grps[g].map(h => <HRow key={h.id} h={h} logs={tL} tmrs={tmrs} onClick={() => onH(h.id)} onSettings={onSettings} />)}</div></div>)}


      <div className="mt-5 mb-4"><SH text="📝 Рефлексия" />
        <div className="space-y-3 mt-2">
          {refSections.map(sec => {
            const secData = ref.data?.[sec.id] || {};
            if (sec.type === 'tasks') {
              return (<div key={sec.id} className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="font-semibold text-sm mb-2">{sec.title}</div>
                {Array.from({ length: sec.count }).map((_, i) => {
                  const items = secData.items || []; const doneFlags = secData.done || []; const whyItems = secData.why || [];
                  return (<div key={i} className="mb-2">
                    <div className="flex gap-2 items-center">
                      <input value={items[i] || ''} onChange={e => uR(sec.id, i, 'items', e.target.value)} placeholder={`Задача ${i + 1}`} className="inp flex-1" />
                      {items[i] && <button onClick={() => uR(sec.id, i, 'done', doneFlags[i] === null || doneFlags[i] === undefined ? true : doneFlags[i] ? false : null)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${doneFlags[i] === true ? 'bg-emerald-500/20 text-emerald-400' : doneFlags[i] === false ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>{doneFlags[i] === true ? '✓' : doneFlags[i] === false ? '✗' : '?'}</button>}
                    </div>
                    {doneFlags[i] === false && <input value={whyItems[i] || ''} onChange={e => uR(sec.id, i, 'why', e.target.value)} placeholder="Почему?" className="w-full mt-1 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 outline-none text-sm text-rose-300" />}
                  </div>);
                })}
              </div>);
            }
            return (<div key={sec.id} className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="font-semibold text-sm mb-2">{sec.title}</div>
              {Array.from({ length: sec.count }).map((_, i) => { const items = secData.items || []; return <input key={i} value={items[i] || ''} onChange={e => uR(sec.id, i, 'items', e.target.value)} placeholder={`${i + 1}`} className="inp mb-1.5" />; })}
            </div>);
          })}
        </div>
      </div>
      {grps.done.length > 0 && <div className="mt-4 mb-3"><SH text="✅ Сделано" color="text-emerald-600/60" /><div className="space-y-1.5 opacity-50">{grps.done.map(h => <HRow key={h.id} h={h} logs={tL} tmrs={tmrs} onClick={() => onH(h.id)} done onSettings={onSettings} />)}</div></div>}
    </div>
  );
}

function QkPanel({ color, icon, title, children }) {
  return (<div className="mt-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2"><div className="font-semibold" style={{ fontSize: 'clamp(14px,3.5vw,16px)' }}>{icon} {title}</div>{children}</div>);
}

function HRow({ h, logs, tmrs, onClick, done, onSettings }) {
  const hL = logs.filter(l => l.habitId === h.id && !l.isSkip)
  const v = sumH(hL, h); const ac = !!tmrs[h.id]
  const pct = h.goalDay > 0 && h.dir === 'up' ? Math.min(v / h.goalDay, 1) : (v > 0 ? 1 : 0)
  const freqLabel = {daily:'Каждый день', weekly:'Раз в нед', monthly:'Раз в мес', custom:'По дням'}[h.period] || ''
  const timeLabel = {morning:'Утро', day:'День', evening:'Вечер', anytime:'Весь день'}[h.time] || ''
  return (
    <div className={`w-full rounded-2xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden ${ac ? 'ring-1 ring-amber-500/40' : ''}`}>
      <button onClick={onClick} className="w-full p-3.5 flex items-center gap-3 active:scale-[0.98] text-left">
        <div className="text-xl w-8 flex items-center justify-center">{h.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{h.name}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500 tabular-nums">{fmtV(v)} / {h.goalDay} {h.unit}</span>
            {!done && <><span className="text-zinc-700">·</span><span className="text-xs text-zinc-600">{freqLabel}</span><span className="text-zinc-700">·</span><span className="text-xs text-zinc-600">{timeLabel}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done ? <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
            : <div className="w-10 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: h.color }} /></div>}
          {onSettings && <button onClick={e => { e.stopPropagation(); onSettings(h.id) }} className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-600 active:scale-90">⚙️</button>}
        </div>
      </button>
    </div>
  )
}


/* ============ MEDITATION PLAYER ============ */
function MedPlayer() {
  const [playing, setPlaying] = useState(false)
  const [withMusic, setWithMusic] = useState(true)
  const audioRef = useRef(null)

  const toggle = (music) => {
    if (audioRef.current) {
      if (playing && withMusic === music) {
        audioRef.current.pause()
        setPlaying(false)
        return
      }
      audioRef.current.pause()
    }
    const audio = new Audio(music ? '/meditation.mp3' : null)
    if (music) {
      audio.loop = true
      audioRef.current = audio
      audio.play().catch(() => {})
      setWithMusic(true)
      setPlaying(true)
    } else {
      setWithMusic(false)
      setPlaying(true)
      audioRef.current = null
    }
  }

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause() }, [])

  return (
    <div className="mb-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
      <div className="text-sm font-semibold text-purple-400 mb-3">🧘 Медитация</div>
      <div className="flex gap-2">
        <button onClick={() => toggle(true)} className={`flex-1 p-3 rounded-xl font-semibold text-sm active:scale-[0.98] ${playing && withMusic ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
          {playing && withMusic ? '⏸ С музыкой' : '▶ С музыкой'}
        </button>
        <button onClick={() => toggle(false)} className={`flex-1 p-3 rounded-xl font-semibold text-sm active:scale-[0.98] ${playing && !withMusic ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
          {playing && !withMusic ? '⏸ Без музыки' : '▶ Без музыки'}
        </button>
      </div>
      {playing && <div className="mt-2 text-center text-xs text-purple-400">● Воспроизведение...</div>}
    </div>
  )
}

/* ============ DETAIL ============ */
function Detail({ habit: h, logs, timer, tick, affirm, onBack, addLog, delLog, updLog, stTmr, spTmr, cTmr, onSkip, eLTs, setELTs, habits, setHab }) {
  const [note, setNote] = useState(''); const [mv, setMv] = useState(''); const [skipR, setSkipR] = useState('');
  const [showSk, setShowSk] = useState(false); const [eN, setEN] = useState(''); const [eV, setEV] = useState('');
  const [affO, setAffO] = useState(false)
  const [showAltDate, setShowAltDate] = useState(false)
  const [altDate, setAltDate] = useState(tk())
  const [altTime, setAltTime] = useState('')
  const [bH, setBH] = useState('23'); const [bM, setBM] = useState('00');
  const [wH, setWH2] = useState('07'); const [wM, setWM] = useState('00');
  const [sleepQ, setSleepQ] = useState(0);
  const [cSocial, setCSocial] = useState('Instagram'); const [cType, setCType] = useState('Пост');
  const [badChecks, setBadChecks] = useState({});
  const [walkMode, setWalkMode] = useState(h.walkMode || 'min');
  const walkUnits = { min: 'мин', m: 'м', steps: 'шагов' };

  const hL = logs.filter(l => l.habitId === h.id); const now2 = new Date(); now2.setHours(0, 0, 0, 0);
  const tL = hL.filter(l => l.ts >= now2.getTime()); const tV = sumH(tL, h);
  const tCount = tL.length;
  const wL = hL.filter(l => l.ts >= now2.getTime() - 6 * 86400000); const wV = sumH(wL, h);
  const mL = hL.filter(l => l.ts >= now2.getTime() - 29 * 86400000); const mV = sumH(mL, h);
  const tPct = h.dir === 'up' ? (h.goalDay > 0 ? Math.min(tV / h.goalDay, 1) : 0) : (tV <= (h.goalDay || 0) ? 1 : 0);
  const elapsed = timer ? Math.floor((Date.now() - timer) / 1000) : 0;
  const streak = useMemo(() => calcStr(hL, h), [hL]);
  const chart = useMemo(() => {
    const r = []
    const base = new Date(); base.setHours(0,0,0,0)
    for (let i = 6; i >= 0; i--) {
      const ds = base.getTime() - i * 86400000
      const de = ds + 86400000
      const dl = hL.filter(l => l.ts >= ds && l.ts < de)
      const val = sumH(dl, h)
      r.push({ day: new Date(ds).toLocaleDateString('ru-RU', { weekday: 'short' }), value: val, count: dl.length, isToday: i === 0 })
    }
    return r
  }, [hL, h.id])
  const maxC = Math.max(h.goalDay || 1, ...chart.map(d => d.value), 1);
  const qa = v => {
    let ts = Date.now()
    if (showAltDate && altDate) {
      const d = new Date(altDate + (altTime ? 'T' + altTime : 'T12:00'))
      if (!isNaN(d.getTime())) ts = d.getTime()
    }
    addLog({ habitId: h.id, value: v, note, ts, localTime: altTime ? altDate + ' ' + altTime : undefined })
    setNote(''); setMv(''); setShowAltDate(false); setAltDate(tk()); setAltTime('')
  }
  const logSleep = () => { const bed = parseInt(bH) * 60 + parseInt(bM); const wk = parseInt(wH) * 60 + parseInt(wM); let d = wk - bed; if (d < 0) d += 1440; addLog({ habitId: h.id, value: Math.round(d / 60 * 10) / 10, note: `Лёг: ${bH}:${bM}, встал: ${wH}:${wM}${sleepQ > 0 ? `, качество: ${sleepQ}/5` : ''}`, sleepQuality: sleepQ }); };

  if (affO) return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8"><div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center mb-6">🌟 Аффирмации</h2>
      <div className="space-y-3 leading-relaxed">{affirm.split('\n').filter(Boolean).map((l, i) => <p key={i} className="pl-3 border-l-2 border-violet-500/30 py-1">{l}</p>)}</div>
      <button onClick={() => { setAffO(false); addLog({ habitId: h.id, value: 1, note: 'Аффирмации прочитаны' }); }} className="btn-primary bg-emerald-500 text-zinc-950 mt-8 active:scale-[0.98]">✓ Прочитано</button>
    </div></div>
  );

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <span className="text-2xl">{h.icon}</span>
        <div className="flex-1 min-w-0"><h1 className="font-bold truncate">{h.name}</h1><div className="text-sm text-zinc-500">{h.cat}</div></div>
      </div>
      {h.why && <div className="mb-3 px-1"><div className="text-sm text-zinc-500 leading-relaxed italic">{h.why}</div></div>}

      <div className="mb-3 p-5 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-zinc-500">Сегодня</div>
            <div className="font-bold tabular-nums" style={{ color: h.color, fontSize: 'clamp(24px,7vw,32px)' }}>{fmtV(tV)}<span className="font-normal text-zinc-500 ml-1" style={{ fontSize: 'clamp(14px,3.5vw,16px)' }}>/ {h.goalDay} {h.unit}</span></div>
            {h.type === 'check' && <div className="text-zinc-400 mt-0.5" style={{ fontSize: 'clamp(13px,3.5vw,15px)' }}>{tCount} / {h.goalDay} раз · {Math.round(tPct * 100)}%</div>}
          </div>
          <CirP value={tPct} color={h.color} size={64} />
        </div>
        <div className="grid grid-cols-4 gap-2"><MStat l="Неделя" v={fmtV(wV)} /><MStat l="Месяц" v={fmtV(mV)} /><MStat l="Серия" v={`${streak}🔥`} /><MStat l="Цель/мес" v={`${h.goalMonth || '—'}`} /></div>
      </div>

      {h.id === 'H17' && <button onClick={() => setAffO(true)} className="w-full mb-3 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 font-semibold text-violet-400 active:scale-[0.98] flex items-center justify-center gap-2">📖 Прочитать аффирмации</button>}
      {h.id === 'H05' && <MedPlayer />}

      <div className="mb-3"><SH text="Записать" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Заметка..." className="inp mb-2" />
        <div className="mb-2">

          {showAltDate && <div className="mt-1.5 flex gap-2 flex-wrap">
            <input type="date" value={altDate} onChange={e => setAltDate(e.target.value)} className="inp flex-1" style={{minWidth:120}} />
            <TimeScroller hour={altTime.split(':')[0] || '12'} minute={altTime.split(':')[1] || '00'} onHour={h => setAltTime(h + ':' + (altTime.split(':')[1] || '00'))} onMinute={m => setAltTime((altTime.split(':')[0] || '12') + ':' + m)} />
          </div>}
        </div>

        {h.type === 'sleep' && <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"><TimeScroller hour={bH} minute={bM} onHour={setBH} onMinute={setBM} label="🌙 Лёг" />
                <TimeScroller hour={wH} minute={wM} onHour={setWH2} onMinute={setWM} label="☀️ Встал" /><div><div className="text-sm text-zinc-400 mb-1.5">Качество сна</div><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(n => { const c = ['#ef4444','#f97316','#eab308','#84cc16','#10b981'][n-1]; return <button key={n} onClick={() => setSleepQ(n)} className={`py-2.5 rounded-lg border-2 font-bold ${sleepQ === n ? 'text-white' : ''}`} style={{ borderColor: c, color: c, background: sleepQ === n ? c + '33' : 'transparent' }}>{n}</button>; })}</div></div><button onClick={logSleep} className="btn-primary bg-indigo-500 text-white active:scale-[0.98]">Записать сон</button></div>}

        {h.id === 'H21' && <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-sm text-zinc-400 mb-1">Отметьте принятые</div>
          {(h.badList || ['Витамин D','Омега-3','Магний']).map((b, i) => <button key={i} onClick={() => setBadChecks(p => ({ ...p, [b]: !p[b] }))} className={`w-full p-3 rounded-xl flex items-center gap-3 ${badChecks[b] ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}><span className={`w-5 h-5 rounded-md flex items-center justify-center text-sm ${badChecks[b] ? 'bg-emerald-500 text-white' : 'bg-zinc-700'}`}>{badChecks[b] ? '✓' : ''}</span><span>{b}</span></button>)}
          <button onClick={() => { const taken = Object.keys(badChecks).filter(k => badChecks[k]); if (taken.length) { addLog({ habitId: h.id, value: 1, note: `Принято: ${taken.join(', ')}` }); setBadChecks({}); } }} className="btn-primary bg-cyan-500 text-zinc-950 active:scale-[0.98] mt-1">💊 Записать</button>
        </div>}

        {h.id === 'H22' && <div className="space-y-2">
          <div className="flex gap-1.5">{[{v:'min',l:'⏱ Минуты'},{v:'m',l:'📏 Метры'},{v:'steps',l:'👣 Шаги'}].map(o => <button key={o.v} onClick={() => setWalkMode(o.v)} className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${walkMode === o.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{o.l}</button>)}</div>
          {walkMode === 'min' && <div className="grid grid-cols-4 gap-2">{[15,30,45,60].map(m => <button key={m} onClick={() => qa(m)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{m}</button>)}</div>}
          <div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder={walkUnits[walkMode]} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) { addLog({ habitId: h.id, value: parseFloat(mv), note: `${walkUnits[walkMode]}` }); setMv(''); setNote(''); } }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div>
        </div>}

        {h.type === 'duration' && !timer && h.id !== 'H22' && <div className="space-y-2"><button onClick={stTmr} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>▶ Начать</button><div className="grid grid-cols-4 gap-2">{[15, 30, 45, 60].map(m => <button key={m} onClick={() => qa(m)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{m}</button>)}</div><div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder="мин" className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div></div>}
        {h.type === 'duration' && timer && <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25"><div className="text-2xl font-bold tabular-nums text-amber-400 mb-1">{fmtEl(elapsed)}</div><div className="text-sm text-zinc-500 mb-3">начало: {new Date(timer).toLocaleTimeString('ru-RU')}</div><div className="flex gap-2"><button onClick={() => spTmr(note)} className="flex-1 p-3.5 rounded-xl bg-emerald-500 active:scale-[0.98] font-semibold flex items-center justify-center gap-2">⏹ Стоп</button><button onClick={cTmr} className="px-5 rounded-xl bg-zinc-800 text-zinc-400">✕</button></div></div>}
        {h.type === 'count' && h.id !== 'H22' && <div className="space-y-2">{h.unit === 'мл' ? <div className="grid grid-cols-4 gap-2">{[200, 250, 350, 500].map(n => <button key={n} onClick={() => qa(n)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}</button>)}</div> : h.unit === 'г' ? <div className="grid grid-cols-3 gap-2">{[20, 25, 30].map(n => <button key={n} onClick={() => qa(n)} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}г</button>)}</div> : <><button onClick={() => qa(1)} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>+ 1</button><div className="grid grid-cols-3 gap-2">{[2, 3, 5].map(n => <button key={n} onClick={() => qa(n)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">+{n}</button>)}</div></>}<div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder={h.unit} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div></div>}
        {h.type === 'check' && h.id === 'H20' && <div className="space-y-2"><div className="flex gap-2"><select value={cSocial} onChange={e => setCSocial(e.target.value)} className="inp flex-1">{SOCIALS.map(s => <option key={s} value={s}>{s}</option>)}</select><select value={cType} onChange={e => setCType(e.target.value)} className="inp flex-1">{CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><button onClick={() => { addLog({ habitId: h.id, value: 1, note: `${cSocial}: ${cType}` }); }} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>📸 Опубликовано</button></div>}
        {h.type === 'check' && h.id !== 'H17' && h.id !== 'H20' && h.id !== 'H21' && <button onClick={() => qa(1)} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>✓ Сделано</button>}
        {h.type === 'rating' && <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(n => { const c = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][n - 1]; return <button key={n} onClick={() => qa(n)} className="aspect-square rounded-2xl border-2 active:scale-95 font-bold text-xl flex items-center justify-center" style={{ borderColor: c, color: c }}>{n}</button>; })}</div>}
        {h.type === 'scale' && <div className="flex gap-2"><input type="number" step="0.1" value={mv} onChange={e => setMv(e.target.value)} placeholder={h.unit} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">💾</button></div>}
      </div>

      <div className="mb-4"><button onClick={() => setShowSk(!showSk)} className="text-sm text-zinc-500 flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-700/50 active:scale-95">Не получилось сегодня?</button>{showSk && <div className="mt-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2"><p className="text-sm text-zinc-400">Ничего страшного, завтра получится лучше! 💪</p><input value={skipR} onChange={e => setSkipR(e.target.value)} placeholder="Что помешало? (необязательно)" className="inp" /><div className="flex gap-2"><button onClick={() => { onSkip(h.id, skipR || 'Пропуск'); setSkipR(''); setShowSk(false); }} className="flex-1 p-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold active:scale-[0.98]">Пропустить</button></div></div>}</div>

      <div className="mb-4 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800"><SH text="Последние 7 дней" /><div className="flex gap-1.5">{chart.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className={`text-lg leading-none ${d.count > 0 ? '' : 'opacity-20'}`}>{d.count > 0 ? (d.value >= (h.goalDay||1) ? '✅' : '🟣') : '⬜'}</div><div className={`text-[10px] font-medium ${d.isToday ? 'text-zinc-300' : 'text-zinc-600'}`}>{d.day}</div>{d.count > 0 && <div className="text-[9px] text-zinc-500 tabular-nums">{fmtV(d.value)}</div>}</div>)}</div>
    </div></div>useMemo, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import * as db from '../lib/db'


const V = 'v4.6';
const S = k => `wh:${k}`;
const DR = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const mD = (d = new Date()) => { const v = d.getDay(); return v === 0 ? 6 : v - 1; };
const CATS = ['Здоровье','Ментальное','Работа','Отношения','Обучение','Контент','Вредные'];
const TYP = [{v:'duration',l:'Длительность'},{v:'count',l:'Счётчик'},{v:'check',l:'Галочка'},{v:'rating',l:'Оценка 1–5'},{v:'scale',l:'Число'},{v:'sleep',l:'Сон'}];
const TOD = [{v:'morning',l:'🌅 Утро'},{v:'day',l:'☀️ День'},{v:'evening',l:'🌙 Вечер'},{v:'anytime',l:'⏳ Днём'}];
const FRQ = [{v:'daily',l:'Каждый день'},{v:'weekly',l:'Раз/нед'},{v:'monthly',l:'Раз/мес'},{v:'custom',l:'Дни'}];
const tk = (d = new Date()) => {
  // Ночной буфер: до 03:00 считаем предыдущий день
  if (d.getHours() < 3) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const LEVELS = [
  {name:'Новичок',min:0,icon:'🌱'},{name:'Практик',min:50,icon:'🌿'},{name:'Мастер',min:200,icon:'🌳'},
  {name:'Гуру',min:500,icon:'⚡'},{name:'Легенда',min:1000,icon:'🏆'}
];
const getLevel = xp => { for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return { ...LEVELS[i], idx: i, next: LEVELS[i + 1] }; return { ...LEVELS[0], idx: 0, next: LEVELS[1] }; };

const DH = [
  {id:'H01',name:'Спорт',cat:'Здоровье',type:'duration',unit:'мин',goalDay:60,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'morning',icon:'🏃',color:'#10b981',why:'Здоровое тело, энергия, ясный ум',archived:false},
  {id:'H02',name:'Вода',cat:'Здоровье',type:'count',unit:'мл',goalDay:3000,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'anytime',icon:'💧',color:'#06b6d4',why:'Чистая кожа, работающий мозг',archived:false},
  {id:'H03',name:'Сон',cat:'Здоровье',type:'sleep',unit:'ч',goalDay:8,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'😴',color:'#6366f1',why:'Восстановление, иммунитет',archived:false},
  {id:'H04',name:'Вес',cat:'Здоровье',type:'scale',unit:'кг',goalDay:0,goalMonth:4,goalYear:12,period:'daily',days:[],dir:'down',time:'morning',icon:'⚖️',color:'#84cc16',why:'Контроль формы',archived:false},
  {id:'H05',name:'Медитация',cat:'Ментальное',type:'duration',unit:'мин',goalDay:15,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'morning',icon:'🧘',color:'#a855f7',why:'Спокойствие, фокус',archived:false},
  {id:'H06',name:'Чтение',cat:'Ментальное',type:'duration',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'evening',icon:'📖',color:'#ec4899',why:'Новые идеи, 24+ книги/год',archived:false},
  {id:'H07',name:'Настроение',cat:'Ментальное',type:'rating',unit:'1-5',goalDay:4,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'evening',icon:'😊',color:'#f59e0b',why:'Понять что влияет на состояние',archived:false},
  {id:'H08',name:'Энергия',cat:'Ментальное',type:'rating',unit:'1-5',goalDay:4,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'anytime',icon:'⚡',color:'#eab308',why:'Отслеживать пики и провалы',archived:false},
  {id:'H09',name:'Фокус-время',cat:'Работа',type:'duration',unit:'мин',goalDay:240,goalMonth:22,goalYear:264,period:'daily',days:[],dir:'up',time:'day',icon:'🎯',color:'#3b82f6',why:'Глубокая работа = результаты',archived:false},
  {id:'H10',name:'Время с близкими',cat:'Отношения',type:'duration',unit:'мин',goalDay:120,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'evening',icon:'❤️',color:'#ef4444',why:'Крепкие отношения',archived:false},
  {id:'H11',name:'Звонок близким',cat:'Отношения',type:'check',unit:'раз',goalDay:1,goalMonth:8,goalYear:100,period:'weekly',days:[2],dir:'up',time:'anytime',icon:'📞',color:'#f97316',why:'Связь с семьёй',archived:false},
  {id:'H12',name:'Английский',cat:'Обучение',type:'duration',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'day',icon:'🇬🇧',color:'#0ea5e9',why:'Свободный разговорный',archived:false},
  {id:'H13',name:'Курсы',cat:'Обучение',type:'duration',unit:'мин',goalDay:30,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'day',icon:'🎓',color:'#14b8a6',why:'Новые компетенции',archived:false},
  {id:'H14',name:'Алкоголь',cat:'Вредные',type:'count',unit:'порц.',goalDay:0,goalMonth:2,goalYear:12,period:'weekly',days:[4,5],dir:'down',time:'evening',icon:'🍷',color:'#71717a',why:'Контроль потребления',archived:false},
  {id:'H15',name:'Залипание',cat:'Вредные',type:'duration',unit:'мин',goalDay:30,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'down',time:'anytime',icon:'📱',color:'#737373',why:'Вернуть 2ч/день',archived:false},
  {id:'H16',name:'Прокрастинация',cat:'Вредные',type:'rating',unit:'1-5',goalDay:2,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'down',time:'evening',icon:'🐌',color:'#78716c',why:'Начинать без сопротивления',archived:false},
  {id:'H17',name:'Аффирмации',cat:'Ментальное',type:'check',unit:'раз',goalDay:1,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'🌟',color:'#d946ef',why:'Программируем подсознание',archived:false},
  {id:'H18',name:'Чистка зубов',cat:'Здоровье',type:'check',unit:'раз',goalDay:2,goalMonth:60,goalYear:730,period:'daily',days:[],dir:'up',time:'morning',icon:'🦷',color:'#38bdf8',why:'Здоровые зубы',archived:false},
  {id:'H19',name:'Протеин',cat:'Здоровье',type:'count',unit:'г',goalDay:25,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'💪',color:'#f472b6',why:'Мышечное восстановление',archived:false},
  {id:'H20',name:'Контент',cat:'Контент',type:'check',unit:'раз',goalDay:1,goalMonth:20,goalYear:240,period:'daily',days:[],dir:'up',time:'day',icon:'📸',color:'#8b5cf6',why:'Развитие личного бренда',archived:false},
  {id:'H21',name:'Приём БАД',cat:'Здоровье',type:'check',unit:'раз',goalDay:1,goalMonth:30,goalYear:365,period:'daily',days:[],dir:'up',time:'morning',icon:'💊',color:'#22d3ee',why:'Поддержка здоровья',archived:false,badList:['Витамин D','Омега-3','Магний']},
  {id:'H22',name:'Прогулка',cat:'Здоровье',type:'count',unit:'мин',goalDay:30,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'day',icon:'🚶',color:'#4ade80',why:'Свежий воздух, движение',archived:false,walkMode:'min'},
  {id:'H23',name:'Контрастный душ',cat:'Здоровье',type:'check',unit:'раз',goalDay:1,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'morning',icon:'🚿',color:'#67e8f9',why:'Иммунитет, бодрость',archived:false},
  {id:'H24',name:'Цифровой детокс',cat:'Ментальное',type:'duration',unit:'мин',goalDay:60,goalMonth:25,goalYear:300,period:'daily',days:[],dir:'up',time:'evening',icon:'🔇',color:'#a78bfa',why:'Качественный отдых, сон',archived:false},
];

const DQ = ["Вы не обязаны быть великими, чтобы начать","Маленькие шаги ведут к большим результатам","Дисциплина — мост между целями и достижениями","Через год вы будете рады, что начали сегодня","Система работает всегда","1% лучше каждый день = в 37 раз лучше через год","Путь в тысячу миль начинается с одного шага","Прогресс, а не совершенство","Вы конкурируете только с вчерашней версией себя","Действие лечит страх","Каждое утро — новый шанс","Боль дисциплины весит граммы, боль сожаления — тонны","Лучший проект — вы сами","Награда за дисциплину — свобода","Записывайте, чтобы осознавать","Стабильность важнее интенсивности","Каждый выбор — голос за человека, которым хотите стать","Вы уже на правильном пути"];

const DA = "Я — успешный человек\nЯ заслуживаю богатства, здоровья и счастья\nМоё тело сильное и здоровое\nЯ строю крепкие отношения с близкими\nЯ спокоен(а), уверен(а) и сфокусирован(а)\nКаждый день я становлюсь на 1% лучше\nМои действия создают мою реальность\nМоё дело растёт и приносит пользу\nЯ свободен(а) от вредных привычек\nСегодня — лучший день стать лучше";

const DQK = ['H02','idea','unplanned','H08'];
const SOCIALS = ['Instagram','Telegram','YouTube','TikTok','LinkedIn','Twitter','Другое'];
const CONTENT_TYPES = ['Пост','Видео','Stories','Reels','Подкаст','Статья','Другое'];
const DEFAULT_REF_SECTIONS = [
  { id: 'tasks', title: '🎯 3 задачи на сегодня', count: 3, type: 'tasks' },
  { id: 'thanks', title: '❤️ Благодарность', count: 3, type: 'simple' },
  { id: 'proud', title: '💪 Чем горжусь сегодня', count: 3, type: 'simple' },
];

const HELP_TEXT = `## Как пользоваться WildHabits\n\n**🏠 Главный экран** — ваши привычки на сегодня, сгруппированные по времени дня.\n\n**📋 Все привычки** — полный список. Добавляйте, редактируйте, архивируйте.\n\n**📅 План** — календарь месяца с цветными точками.\n\n**📊 Статистика** — графики, heatmap, фильтры по периоду.\n\n**🏆 Ачивки** — система уровней и достижений.\n\n**💬 Мотивация** — коллекция фраз. Добавляйте свои.\n\n**🌟 Аффирмации** — утренние утверждения через ридер.\n\n**💡 Идеи** — записывайте идеи с категориями и приоритетами.\n\n**📝 Рефлексия** — задачи, благодарности, достижения дня.\n\n**📤 Экспорт** — CSV для Google Sheets или Excel.`;

const COMEBACK_MSGS = [
  "С возвращением! Каждый новый день — новый шанс 🌅",
  "Рады видеть вас снова! Начнём с малого? 💪",
  "Вы здесь — значит, вы на верном пути ✨",
  "Пропуски — это нормально. Главное — продолжать 🌿",
  "Отлично, что вы вернулись! Прогресс > совершенство 🚀",
];

async function ld(k, fb) { try { const r = await window.storage.get(S(k)); return r?.value ? JSON.parse(r.value) : fb; } catch { return fb; } }
async function sv(k, d) { try { await window.storage.set(S(k), JSON.stringify(d)); } catch {} }
function sumH(l, h) { if (!l.length) return 0; if (h.type === 'rating' || h.type === 'scale' || h.type === 'sleep') return l[0]?.value || 0; return l.reduce((s, x) => s + (x.value || 0), 0); }
function sumH2(l, h) { if (!l.length) return 0; if (h.type === 'rating' || h.type === 'scale' || h.type === 'sleep') { const v = l.map(x => x.value || 0); return v.reduce((a, b) => a + b, 0) / v.length; } return l.reduce((s, x) => s + (x.value || 0), 0); }
function fmtV(v) { if (!v && v !== 0) return '0'; if (Number.isInteger(v)) return String(v); return v.toFixed(1); }
function fmtEl(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`; }
function calcStr(logs, h) { if (h.period !== 'daily') return 0; let s = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setHours(0,0,0,0); const st = d.getTime() - i * 86400000, en = st + 86400000; const dl = logs.filter(l => l.ts >= st && l.ts < en); if (!dl.length) { if (i === 0) continue; else break; } const v = sumH(dl, h); const ok = h.dir === 'up' ? (h.goalDay > 0 && v >= h.goalDay) : (v > 0 && v <= (h.goalDay || 999)); if (ok) s++; else if (i === 0) continue; else break; } return s; }

const THEMES = {
  dark: { bg: '#09090b', bg2: '#18181b', bg3: '#27272a', border: '#27272a', text: '#fafafa', text2: '#a1a1aa', text3: '#71717a' },
  light: { bg: '#f9fafb', bg2: '#ffffff', bg3: '#f3f4f6', border: '#e5e7eb', text: '#111827', text2: '#6b7280', text3: '#9ca3af' }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
* { font-family: 'Montserrat', system-ui, sans-serif; box-sizing: border-box; }
body { font-size: clamp(15px, 4vw, 17px); }
body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 150px 150px; }
body.theme-light::before { opacity: 0.025; }
body.theme-light { background: #f2f2f7 !important; color: #1c1c1e !important; }
body.theme-light * { color: inherit; }
body.theme-light .min-h-screen, body.theme-light .bg-zinc-950 { background: #f2f2f7 !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-900"] { background: #ffffff !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-800"] { background: #e5e5ea !important; color: #1c1c1e !important; }
body.theme-light [class*="bg-zinc-700"] { background: #d1d1d6 !important; }
body.theme-light [class*="border-zinc-8"], body.theme-light [class*="border-zinc-7"] { border-color: #c7c7cc !important; }
body.theme-light [class*="text-zinc-1"] { color: #1c1c1e !important; }
body.theme-light [class*="text-zinc-2"] { color: #1c1c1e !important; }
body.theme-light [class*="text-zinc-3"] { color: #3a3a3c !important; }
body.theme-light [class*="text-zinc-4"] { color: #48484a !important; }
body.theme-light [class*="text-zinc-5"] { color: #636366 !important; }
body.theme-light [class*="text-zinc-6"] { color: #8e8e93 !important; }
body.theme-light .inp { background: #ffffff !important; border: 1px solid #c7c7cc !important; color: #1c1c1e !important; }
body.theme-light .inp::placeholder { color: #aeaeb2 !important; font-style: italic; }
body.theme-light select, body.theme-light select option { background: #ffffff !important; color: #1c1c1e !important; }
body.theme-light .bg-black\/80 { background: rgba(0,0,0,0.5) !important; }
body.theme-light [class*="text-zinc-9"] { color: #1c1c1e !important; }
.inp { width: 100%; padding: 12px 16px; border-radius: 14px; background: #18181b; border: 1px solid #27272a; outline: none; font-size: clamp(15px, 4vw, 17px); color: #fafafa; }
.inp:focus { border-color: #3f3f46; }
.btn-primary { width: 100%; padding: 16px; border-radius: 16px; font-weight: 700; font-size: clamp(15px, 4vw, 17px); display: flex; align-items: center; justify-content: center; gap: 8px; }
h1 { font-size: clamp(18px, 5vw, 22px); }
h2 { font-size: clamp(16px, 4.5vw, 20px); }
@keyframes confetti { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(-80px) rotate(360deg); opacity: 0; } }
.confetti { animation: confetti 1s ease-out forwards; }
@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.pop-in { animation: popIn 0.4s ease-out; }
.inp::placeholder { color: #52525b; font-style: italic; }
body.theme-light .inp::placeholder { color: #9ca3af; font-style: italic; }
`;

export default function App() {
  const [rdy, setRdy] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState(null)
  const [scr, setScr] = useState('home')
  const [habits, setHab] = useState([])
  const [logs, setLogs] = useState([])
  const [quotes, setQ] = useState(DQ)
  const [affirm, setAf] = useState(DA)
  const [skips, setSk] = useState([])
  const [unplanned, setUp] = useState([])
  const [reflections, setRef] = useState([])
  const [refSections, setRefSec] = useState(DEFAULT_REF_SECTIONS)
  const [ideas, setIdeas] = useState([])
  const [quickIds, setQuick] = useState(DQK)
  const [undo, setUndo] = useState([])
  const [aId, setAId] = useState(null)
  const [eId, setEId] = useState(null)
  const [eLTs, setELTs] = useState(null)
  const [tmrs, setTmrs] = useState({})
  const [tick, setTick] = useState(0)
  const [toast, setToast] = useState(null)
  const [menu, setMenu] = useState(false)
  const [qkO, setQkO] = useState(null)
  const [xp, setXp] = useState(0)
  const [achPop, setAchPop] = useState(null)

  // Применяем тему
  useEffect(() => {
    const saved = localStorage.getItem('wh:theme') || 'dark'
    setTheme(saved)
    document.body.className = saved === 'light' ? 'theme-light' : ''
  }, [])
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('wh:theme', next)
    document.body.className = next === 'light' ? 'theme-light' : ''
  }

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) loadAll(u)
      else setRdy(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) loadAll(u)
      else { setRdy(true); setHab([]); setLogs([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadAll = async (u) => {
    const [h, l, sk, rf, id, set] = await Promise.all([
      db.loadHabits(u.id, DH),
      db.loadLogs(u.id),
      db.loadSkips(u.id),
      db.loadReflections(u.id),
      db.loadIdeas(u.id),
      db.loadSettings(u.id),
    ])
    setHab(h); setLogs(l); setSk(sk); setRef(rf); setIdeas(id)
    if (set.quotes) setQ(set.quotes)
    if (set.affirm) setAf(set.affirm)
    if (set.refSections) setRefSec(set.refSections)
    if (set.quickIds) setQuick(set.quickIds)
    if (set.xp) setXp(set.xp)
    setRdy(true)
  }

  const saveSetting = async (key, val) => {
    if (!user) return
    const cur = { quotes, affirm, refSections, quickIds, xp }
    const upd = { ...cur, [key]: val }
    await db.saveSettings(user.id, upd)
  }

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (!achPop) return; const t = setTimeout(() => setAchPop(null), 3000); return () => clearTimeout(t) }, [achPop])

  const show = (m, a) => setToast({ m, a })

  const gainXp = async (amt = 5) => {
    const n = xp + amt; setXp(n)
    const ol = getLevel(xp), nl = getLevel(n)
    if (nl.idx > ol.idx) setAchPop(`${nl.icon} Уровень: ${nl.name}!`)
    if (user) await saveSetting('xp', n)
  }

  const addLogFn = async e => {
    const l = { ts: e.ts || Date.now(), ...e }
    if (user) {
      const h = habits.find(x => x.id === e.habitId)
      const saved = await db.addLog(user.id, l, h?.name || '', h?.unit || '')
      const n = [saved, ...logs]; setLogs(n)
    } else setLogs(p => [l, ...p])
    gainXp(5)
  }

  const delLog = async ts => {
    const e = logs.find(l => l.ts === ts)
    if (e) setUndo(u => [{ type: 'log', data: e }, ...u.slice(0, 19)])
    if (user) await db.deleteLog(user.id, ts)
    setLogs(p => p.filter(l => l.ts !== ts))
    show('Удалено', () => undoAct())
  }

  const updLog = async (ts, u2) => {
    if (user) await db.updateLog(user.id, ts, u2)
    setLogs(p => p.map(l => l.ts === ts ? { ...l, ...u2 } : l))
    show('Обновлено')
  }

  const undoAct = async () => {
    if (!undo.length) return
    const [last, ...rest] = undo
    if (last.type === 'log') { await addLogFn(last.data) }
    if (last.type === 'idea') {
      if (user) { const saved = await db.addIdea(user.id, last.data); setIdeas(p => [saved, ...p]) }
      else setIdeas(p => [last.data, ...p])
    }
    setUndo(rest); show('Отменено ✓')
  }

  const stTmr = id => setTmrs(t => ({ ...t, [id]: Date.now() }))
  const spTmr = (id, n = '') => {
    const s = tmrs[id]; if (!s) return
    const m = Math.round((Date.now() - s) / 60000 * 10) / 10
    addLogFn({ habitId: id, value: m, start: s, end: Date.now(), note: n })
    setTmrs(t => { const { [id]: _, ...r } = t; return r })
  }
  const cTmr = id => setTmrs(t => { const { [id]: _, ...r } = t; return r })
  const go = s => { setScr(s); setMenu(false); setQkO(null) }
  const goH = id => { setAId(id); setScr('detail'); setMenu(false); setQkO(null) }

  if (!rdy) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <style>{CSS}</style>
      <div className="text-center">
        <div className="text-4xl font-black text-violet-500 mb-2">WH</div>
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    </div>
  )

  if (!user) return <AuthScreen onAuth={() => {}} />

  const habit = habits.find(h => h.id === aId)
  const actH = habits.filter(h => !h.archived)
  const p = { habits: actH, allHabits: habits, logs, skips, unplanned, reflections, refSections, tmrs, tick, quotes, affirm, user, quickIds, ideas, xp }

  return (
    <>
      <Head>
        <title>WildHabits</title>
        <meta name="description" content="Дикие привычки — трекер привычек" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WildHabits" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </Head>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <style>{CSS}</style>
        {menu && <MenuOvl onClose={() => setMenu(false)} go={go} undo={undo} onUndo={undoAct} xp={xp} avatar={typeof window !== 'undefined' ? localStorage.getItem('wh:avatar') : null} userName={typeof window !== 'undefined' ? (localStorage.getItem('wh:name') || user?.email?.split('@')[0]) : user?.email?.split('@')[0]} />}
        {toast && <Toast m={toast.m} a={toast.a} onX={() => setToast(null)} />}
        {achPop && <AchPop text={achPop} />}

        {scr === 'home' && <Home {...p} onMenu={() => setMenu(true)} onH={goH} onSettings={id => { setEId(id); go('editH') }}
          onSkip={async (id, r) => { const s = { habitId: id, date: tk(), reason: r, ts: Date.now() }; if (user) await db.addSkip(user.id, s); setSk(p => [s, ...p]); addLogFn({ habitId: id, value: 0, note: r || 'Пропуск', ts: Date.now(), isSkip: true }); show('Пропуск') }}
          onUnplanned={async e => { const n = { ts: Date.now(), date: tk(), ...e }; setUp(p => [n, ...p]); show('Записано') }}
          onReflect={async r => {
            setRef(p => { const n = p.filter(x => x.date !== r.date); return [r, ...n] })
            if (user) {
              try { await db.saveReflection(user.id, r) } catch(e) { console.error('ref save:', e) }
            }
            // Также в localStorage как резерв
            try { localStorage.setItem('wh:ref:' + r.date, JSON.stringify(r)) } catch {}
          }}
          addLog={addLogFn} qkO={qkO} setQkO={setQkO}
          onAddIdea={async idea => {
            const base = { id: Date.now(), date: tk(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), text: idea.text, category: idea.category || '', priority: idea.priority || 'medium', done: false }
            if (user) { const saved = await db.addIdea(user.id, base); setIdeas(p => [saved, ...p]) } else setIdeas(p => [base, ...p])
            show('Идея ✓'); gainXp(3)
          }} />}

        {scr === 'detail' && habit && <Detail habit={habit} logs={logs} timer={tmrs[habit.id]} tick={tick} affirm={affirm} onBack={() => go('home')} addLog={addLogFn} delLog={delLog} updLog={updLog} stTmr={() => stTmr(habit.id)} spTmr={n => spTmr(habit.id, n)} cTmr={() => cTmr(habit.id)}
          onSkip={async (id, r) => { const s = { habitId: id, date: tk(), reason: r, ts: Date.now() }; if (user) await db.addSkip(user.id, s); setSk(p => [s, ...p]); addLogFn({ habitId: id, value: 0, note: r || 'Пропуск', ts: Date.now(), isSkip: true }); show('Пропуск') }}
          eLTs={eLTs} setELTs={setELTs} habits={habits}
          setHab={async h => { setHab(h); if (user) for (const hab of h) await db.saveHabit(user.id, hab) }} />}

        {scr === 'allHabits' && <AllH habits={habits} onBack={() => go('home')} onH={goH}
          onEdit={id => { setEId(id); go('editH') }}
          onDel={async id => { const h = habits.find(x => x.id === id); if (h) setUndo(u => [{ type: 'habit', data: h }, ...u.slice(0, 19)]); if (user) await db.deleteHabit(user.id, id); setHab(p => p.filter(x => x.id !== id)); show('Удалено', () => undoAct()) }}
          onAdd={() => { setEId(null); go('editH') }}
          onArch={async id => { const n = habits.map(h => h.id === id ? { ...h, archived: !h.archived } : h); setHab(n); if (user) await db.saveHabit(user.id, n.find(h => h.id === id)); show('Обновлено') }} />}

        {scr === 'editH' && <EditH habit={eId ? habits.find(h => h.id === eId) : null} onBack={() => go('allHabits')}
          onSave={async h => {
            if (eId) {
              const n = habits.map(x => x.id === h.id ? h : x)
              setHab(n)
              if (user) await db.saveHabit(user.id, h)
            } else {
              const newH = { ...h, id: 'H' + Date.now(), archived: false }
              const n = [...habits, newH]
              setHab(n)
              if (user) await db.saveHabit(user.id, newH)
            }
            go('allHabits'); show(eId ? 'Обновлено' : 'Добавлено ✓')
          }} />}

        {scr === 'plan' && <Plan habits={actH} logs={logs} onBack={() => go('home')} />}
        {scr === 'stats' && <Stats logs={logs} habits={actH} skips={skips} onBack={() => go('home')} />}
        {scr === 'ach' && <Ach logs={logs} habits={actH} xp={xp} onBack={() => go('home')} />}
        {scr === 'mot' && <Mot quotes={quotes} onBack={() => go('home')} onSave={async q => { setQ(q); await saveSetting('quotes', q); show('Сохранено') }} />}
        {scr === 'aff' && <AffScr text={affirm} onBack={() => go('home')} onSave={async t => { setAf(t); await saveSetting('affirm', t); show('Сохранено') }} />}
        {scr === 'ideas' && <IdeasScr ideas={ideas} onBack={() => go('home')}
          onUpd={async i => { setIdeas(i) }}
          onAdd={async idea => { if (user) { const s = await db.addIdea(user.id, idea); setIdeas(p => [s, ...p]) } else setIdeas(p => [idea, ...p]) }}
          onUpdate={async (id, upd) => { if (user) await db.updateIdea(user.id, id, upd); setIdeas(p => p.map(x => x.id === id ? { ...x, ...upd } : x)) }}
          onDelete={async id => { const idea = ideas.find(x => x.id === id); if (idea) setUndo(u => [{ type: 'idea', data: idea }, ...u.slice(0, 19)]); if (user) await db.deleteIdea(user.id, id); setIdeas(p => p.filter(x => x.id !== id)); show('Удалено', () => undoAct()) }}
          show={show} />}
        {scr === 'refH' && <RefHist reflections={reflections} refSections={refSections} onBack={() => go('home')}
          onUpd={async r => { setRef(r) }}
          onSaveSec={async s => { setRefSec(s); await saveSetting('refSections', s); show('Сохранено') }} />}
        {scr === 'qkS' && <QkSet habits={actH} quickIds={quickIds} onBack={() => go('home')} onSave={async q => { setQuick(q); await saveSetting('quickIds', q); show('Сохранено') }} />}
        {scr === 'acct' && <Acct user={user} onBack={() => go('home')} onOut={async () => { await db.signOut(); setUser(null) }} />}
        {scr === 'exp' && <Exp logs={logs} habits={habits} skips={skips} onBack={() => go('home')} />}
        {scr === 'history' && <HistoryScr logs={logs} habits={actH} skips={skips} onBack={() => go('home')} />}
        {scr === 'events' && <EventsScr onBack={() => go('home')} user={user} show={show} />}
        {scr === 'help' && <HelpScr onBack={() => go('home')} />}
        {scr === 'feedback' && <Feedback onBack={() => go('home')} show={show} user={user} />}
        {scr === 'settings' && <SettingsScr onBack={() => go('home')} theme={theme} onToggleTheme={toggleTheme} />}
      </div>
    </>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) return
    setLoading(true); setErr('')
    try {
      if (mode === 'login') await db.signIn(email, pass)
      else await db.signUp(email, pass, name || email.split('@')[0])
    } catch (e) {
      setErr(e.message === 'Invalid login credentials' ? 'Неверный email или пароль' : e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <style>{CSS}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="WH" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="font-black tracking-tight" style={{ color: '#7c3aed', fontSize: 'clamp(20px,5vw,26px)' }}>WILD HABITS</h1>
          <p className="text-zinc-500 mt-1" style={{ fontSize: '12px' }}>{V} · Дикие привычки</p>
        </div>
        <div className="flex mb-6 bg-zinc-900 rounded-xl p-1">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-lg font-semibold ${mode === 'login' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}>Войти</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 rounded-lg font-semibold ${mode === 'register' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}>Регистрация</button>
        </div>
        <div className="space-y-3">
          {mode === 'register' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" className="inp" />}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="inp" autoComplete="email" />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Пароль (минимум 6 символов)" type="password" className="inp" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {err && <div className="text-rose-400 text-sm px-1">{err}</div>}
          <button onClick={submit} disabled={loading} className="btn-primary text-white active:scale-[0.98] transition-transform disabled:opacity-50" style={{ background: '#7c3aed' }}>
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
          {mode === 'login' && <button onClick={async () => { if (!email) { setErr('Введите email'); return; } try { await db.resetPassword(email); setErr(''); alert('Письмо отправлено! Проверьте почту.'); } catch(e) { setErr(e.message); } }} className="w-full text-center text-sm text-zinc-500 py-1 active:text-zinc-300">Забыли пароль?</button>}
        </div>
      </div>
    </div>
  )
}


function AccordionMenu({ groups, go }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-0.5">
      {groups.map((g, gi) => (
        <div key={g.title}>
          <button onClick={() => setOpen(open === gi ? null : gi)} className="w-full px-3 py-3 flex items-center justify-between active:bg-zinc-800/50 rounded-xl">
            <span className="text-base font-black tracking-tight">{g.title}</span>
            <span className="text-zinc-500 text-sm">{open === gi ? '▲' : '▼'}</span>
          </button>
          {open === gi && (
            <div className="space-y-0.5 pl-2 pb-1">
              {g.items.map(it => (
                <button key={it.l} onClick={() => go(it.s)} className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 active:bg-zinc-800 text-left">
                  <span className="text-base">{it.i}</span>
                  <span className="font-medium text-sm text-zinc-300">{it.l}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MenuOvl({ onClose, go, undo, onUndo, xp, avatar, userName }) {
  const lv = getLevel(xp);
  const groups = [
    { title: '📋 Главное', items: [
      { i: '🏠', l: 'Привычки дня', s: 'home' },
      { i: '📋', l: 'Настроить привычки', s: 'allHabits' },
      { i: '📅', l: 'План', s: 'plan' },
      { i: '⚡', l: 'Быстрые записи', s: 'qkS' },
    ]},
    { title: '📊 Аналитика', items: [
      { i: '📊', l: 'Статистика', s: 'stats' },
      { i: '🏆', l: 'Ачивки', s: 'ach' },
      { i: '📚', l: 'Вся история', s: 'history' },
    ]},
    { title: '🧘 Практики', items: [
      { i: '💡', l: 'Идеи', s: 'ideas' },
      { i: '📅', l: 'События', s: 'events' },
      { i: '📝', l: 'Рефлексия', s: 'refH' },
      { i: '💬', l: 'Мотивация', s: 'mot' },
      { i: '🌟', l: 'Аффирмации', s: 'aff' },
    ]},
    { title: '⚙️ Настройки', items: [
      { i: '👤', l: 'Аккаунт', s: 'acct' },
      { i: '⚙️', l: 'Настройки', s: 'settings' },
      { i: '📤', l: 'Экспорт', s: 'exp' },
      { i: '❓', l: 'О приложении', s: 'help' },
      { i: '💌', l: 'Обратная связь', s: 'feedback' },
    ]},
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xl overflow-hidden">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : '👤'}
            </div>
            <div className="font-semibold text-sm">{userName || 'Профиль'}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">✕</button>
        </div>
        <div className="mb-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-2"><span className="text-xl">{lv.icon}</span><div><div className="font-bold text-sm">{lv.name}</div><div className="text-xs text-zinc-400">{xp} XP{lv.next ? ` · до ${lv.next.name}: ${lv.next.min - xp}` : ''}</div></div></div>
          {lv.next && <div className="mt-2 h-1.5 rounded-full bg-zinc-700 overflow-hidden"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${((xp - lv.min) / (lv.next.min - lv.min)) * 100}%` }} /></div>}
        </div>
        <AccordionMenu groups={groups} go={go} />
        {undo.length > 0 && <button onClick={() => { onUndo(); onClose(); }} className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-400 font-medium active:scale-[0.98]"><span>↩</span> Отменить последнее удаление</button>}
        <div className="mt-3 flex items-center justify-center gap-2 py-2">
          <img src="/logo.png" alt="WH" className="h-5 w-auto opacity-40" />
          <span className="text-[10px] text-zinc-600">{V}</span>
        </div>
        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20"><div className="font-semibold text-violet-400 mb-1">🚀 Pro</div><div className="text-xs text-zinc-500">ИИ аналитика, Telegram-бот, авто-экспорт. Скоро!</div></div>
      </div>
    </div>
  );
}

function Toast({ m, a, onX }) {
  return (<div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center"><div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl max-w-sm"><span className="flex-1">{m}</span>{a && <button onClick={() => { a(); onX(); }} className="font-semibold text-amber-400">Отменить</button>}</div></div>);
}

function AchPop({ text }) {
  return (<div className="fixed top-16 left-4 right-4 z-50 flex justify-center pop-in"><div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl px-6 py-4 shadow-2xl text-center"><div className="text-2xl mb-1">🎉</div><div className="font-bold text-white">{text}</div></div></div>);
}


function TimeScroller({ hour, minute, onHour, onMinute, label }) {
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'))
  return (
    <div>
      {label && <div className="text-xs text-zinc-500 mb-1">{label}</div>}
      <div className="flex gap-2 items-center">
        <select value={hour} onChange={e => onHour(e.target.value)} className="inp flex-1 text-center tabular-nums appearance-none">
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-zinc-400 font-bold">:</span>
        <select value={minute} onChange={e => onMinute(e.target.value)} className="inp flex-1 text-center tabular-nums appearance-none">
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  )
}

function SH({ text, color = 'text-zinc-500' }) { return <div className={`text-xs uppercase tracking-widest ${color} mb-2 px-1 font-bold`}>{text}</div>; }
function Fld({ l, children }) { return <div><div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{l}</div>{children}</div>; }
function Sel({ opts, val, onCh }) { return <div className="flex flex-wrap gap-1.5">{opts.map(o => <button key={o.v} onClick={() => onCh(o.v)} className={`px-3 py-2.5 rounded-lg font-medium ${val === o.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{o.l}</button>)}</div>; }
function MStat({ l, v }) { return <div className="p-2 rounded-lg bg-zinc-800/30 text-center"><div className="text-[11px] text-zinc-500">{l}</div><div className="font-bold tabular-nums mt-0.5">{v}</div></div>; }
function CirP({ value, color, size = 56 }) { const r = size * .42, c = 2 * Math.PI * r, off = c - Math.min(value, 1) * c, cx = size / 2; return <svg width={size} height={size} className="-rotate-90"><circle cx={cx} cy={cx} r={r} stroke="#27272a" strokeWidth="5" fill="none" /><circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .5s' }} /><text x={cx} y={cx} textAnchor="middle" dominantBaseline="central" className="fill-zinc-100 font-bold rotate-90" style={{ transformOrigin: `${cx}px ${cx}px`, fontSize: size * .22 }}>{Math.round(value * 100)}%</text></svg>; }

/* ============ HOME ============ */
function Home({ habits, logs, skips, tmrs, tick, quotes, quickIds, ideas, unplanned, onMenu, onH, onSkip, onUnplanned, reflections, refSections, onReflect, addLog, affirm, qkO, setQkO, onAddIdea, xp, onSettings }) {
  const today = tk(); const dow = mD(); const ts0 = new Date(); ts0.setHours(0, 0, 0, 0);
  const quoteList = Array.isArray(quotes) ? quotes : (typeof quotes === 'string' ? quotes.split('\n').filter(Boolean) : []); const quote = useMemo(() => quoteList[Math.floor(Math.random() * (quoteList.length || 1))] || '', []);
  const tH = useMemo(() => habits.filter(h => {
    if (h.period === 'daily') return true;
    if (h.period === 'weekly') return (h.days || []).includes(dow) || !(h.days || []).length;
    if (h.period === 'monthly') return (h.days || []).includes(new Date().getDate() - 1);
    if (h.period === 'custom') return (h.days || []).includes(dow);
    return true;
  }), [habits, dow]);
  const tL = logs.filter(l => l.ts >= ts0.getTime()); const tSk = skips.filter(s => s.date === today);
  const grps = useMemo(() => { const g = { morning: [], day: [], evening: [], anytime: [], done: [] }; tH.forEach(h => { const hL = tL.filter(l => l.habitId === h.id); const v = sumH(hL, h); const sk = tSk.some(s => s.habitId === h.id); const isDone = sk || (h.type === 'sleep' || h.type === 'scale' ? v > 0 : h.dir === 'up' ? (h.goalDay > 0 && v >= h.goalDay) : (h.type === 'check' && v > 0)); if (isDone) g.done.push(h); else (g[h.time] || g.anytime).push(h); }); return g; }, [tH, tL, tSk]);
  const total = tH.length, done = grps.done.length, pct = total ? Math.round(done / total * 100) : 0;
  const [upN, setUpN] = useState(''); const [upM, setUpM] = useState(''); const [ideaTxt, setIdeaTxt] = useState(''); const [ideaCat, setIdeaCat] = useState(''); const [ideaPri, setIdeaPri] = useState('medium'); const [waterAmt, setWA] = useState('');
  const tR = reflections.find(r => r.date === today) || { date: today, data: {} };
  const [ref, setR] = useState(tR);
  useEffect(() => {
    const found = reflections.find(r => r.date === today)
    if (found) setR(found)
  }, [today, reflections.length])

  const uR = (secId, idx, key, val) => {
    setR(prev => {
      const d = { ...(prev.data || {}) }
      if (!d[secId]) d[secId] = {}
      if (!d[secId][key]) d[secId][key] = []
      const arr = [...(d[secId][key] || [])]
      arr[idx] = val
      d[secId] = { ...d[secId], [key]: arr }
      const next = { ...prev, data: d }
      // Сохраняем немедленно
      onReflect(next)
      return next
    })
  }

  const gl = { morning: '🌅 Утро', day: '☀️ День', evening: '🌙 Вечер', anytime: '⏳ В течение дня' };
  const qI = { H02: '💧', H08: '⚡', idea: '💡', unplanned: '📋' }; const getQI = id => { if (qI[id]) return qI[id]; const h = habits.find(x => x.id === id); return h ? h.icon : '⚡'; };
  const pIcons = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <div className="max-w-md mx-auto px-4 pb-24">
      <div className="pt-5 pb-2 flex items-center gap-3">
        <button onClick={onMenu} className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95 shrink-0 text-lg">☰</button>
        <img src='/logo.png' alt='WH' className='h-8 w-auto shrink-0' />
        <div className="flex-1 min-w-0">
          <div className="font-black leading-tight" style={{ fontSize: 'clamp(16px,4vw,18px)' }}>{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
          <div className="text-zinc-500 capitalize" style={{ fontSize: 'clamp(12px,3vw,13px)' }}>{new Date().toLocaleDateString('ru-RU', { weekday: 'long' })}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 shrink-0">
          {quickIds.slice(0, 4).map((qid, qi) => (
            <button key={qi} onClick={() => setQkO(qkO === qid ? null : qid)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg active:scale-90 transition-all ${qkO === qid ? 'bg-violet-500/20 ring-2 ring-violet-500/50' : 'bg-zinc-900 border border-zinc-800'}`}>{getQI(qid)}</button>
          ))}
        </div>
      </div>

      {qkO === 'H02' && <QkPanel color="cyan" icon="💧" title="Вода"><div className="grid grid-cols-4 gap-2">{[200, 250, 350, 500].map(n => <button key={n} onClick={() => { addLog({ habitId: 'H02', value: n, note: '' }); setQkO(null); }} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}</button>)}</div><div className="flex gap-2 mt-2"><input type="number" value={waterAmt} onChange={e => setWA(e.target.value)} placeholder="мл" className="inp flex-1 tabular-nums" /><button onClick={() => { if (waterAmt) { addLog({ habitId: 'H02', value: parseFloat(waterAmt), note: '' }); setWA(''); setQkO(null); } }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-95">OK</button></div></QkPanel>}
      {qkO === 'idea' && <QkPanel color="amber" icon="💡" title="Идея"><input value={ideaTxt} onChange={e => setIdeaTxt(e.target.value)} placeholder="Запишите идею..." className="inp" /><div className="flex gap-2 mt-2"><input value={ideaCat} onChange={e => setIdeaCat(e.target.value)} placeholder="Категория" className="inp flex-1" /><div className="flex gap-1">{['low','medium','high'].map(p => <button key={p} onClick={() => setIdeaPri(p)} className={`w-10 h-10 rounded-lg flex items-center justify-center ${ideaPri === p ? 'ring-2 ring-zinc-400' : ''} bg-zinc-800`}>{pIcons[p]}</button>)}</div></div><button onClick={() => { if (ideaTxt) { onAddIdea({ text: ideaTxt, category: ideaCat, priority: ideaPri }); setIdeaTxt(''); setIdeaCat(''); setQkO(null); } }} className="w-full mt-2 p-3 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-[0.98]">Записать</button></QkPanel>}
      {qkO === 'unplanned' && <QkPanel color="zinc" icon="📋" title="Без плана"><p className="text-xs text-zinc-500 mb-2">Запись попадёт в раздел «Вся история»</p><input value={upN} onChange={e => setUpN(e.target.value)} placeholder="Что делали?" className="inp" /><input type="number" value={upM} onChange={e => setUpM(e.target.value)} placeholder="Минут" className="inp mt-2 tabular-nums" /><button onClick={() => { if (upN) { onUnplanned({ name: upN, minutes: parseFloat(upM) || 0 }); setUpN(''); setUpM(''); setQkO(null); } }} className="w-full mt-2 p-3 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-[0.98]">Записать</button></QkPanel>}
      {qkO === 'H08' && <QkPanel color="yellow" icon="⚡" title="Энергия"><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(n => { const c = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][n - 1]; return <button key={n} onClick={() => { addLog({ habitId: 'H08', value: n, note: '' }); setQkO(null); }} className="aspect-square rounded-xl border-2 active:scale-95 font-bold text-xl flex items-center justify-center" style={{ borderColor: c, color: c }}>{n}</button>; })}</div></QkPanel>}

      <div className="mt-2 mb-3 px-2"><p className="text-zinc-500 italic text-center leading-relaxed" style={{ fontSize: 'clamp(12px,3vw,14px)' }}>{quote}</p></div>

      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800">
        <div className="flex items-center justify-between mb-2"><span className="text-zinc-400">Прогресс</span><span className="font-bold tabular-nums">{done}/{total} · {pct}%</span></div>
        <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      </div>

      {Object.keys(tmrs).length > 0 && <div className="mb-3"><SH text="⏱ Идёт" />{Object.entries(tmrs).map(([hid, start]) => { const h = habits.find(x => x.id === hid); if (!h) return null; return <button key={hid} onClick={() => onH(hid)} className="w-full mb-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 active:scale-[0.98]"><span className="text-xl">{h.icon}</span><div className="flex-1 text-left"><div className="font-semibold">{h.name}</div><div className="text-amber-400 tabular-nums">{fmtEl(Math.floor((Date.now() - start) / 1000))}</div></div><div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" /></button>; })}</div>}

      {['morning', 'day', 'evening', 'anytime'].map(g => grps[g].length > 0 && <div key={g} className="mb-3"><SH text={gl[g]} /><div className="space-y-1.5">{grps[g].map(h => <HRow key={h.id} h={h} logs={tL} tmrs={tmrs} onClick={() => onH(h.id)} onSettings={onSettings} />)}</div></div>)}


      <div className="mt-5 mb-4"><SH text="📝 Рефлексия" />
        <div className="space-y-3 mt-2">
          {refSections.map(sec => {
            const secData = ref.data?.[sec.id] || {};
            if (sec.type === 'tasks') {
              return (<div key={sec.id} className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="font-semibold text-sm mb-2">{sec.title}</div>
                {Array.from({ length: sec.count }).map((_, i) => {
                  const items = secData.items || []; const doneFlags = secData.done || []; const whyItems = secData.why || [];
                  return (<div key={i} className="mb-2">
                    <div className="flex gap-2 items-center">
                      <input value={items[i] || ''} onChange={e => uR(sec.id, i, 'items', e.target.value)} placeholder={`Задача ${i + 1}`} className="inp flex-1" />
                      {items[i] && <button onClick={() => uR(sec.id, i, 'done', doneFlags[i] === null || doneFlags[i] === undefined ? true : doneFlags[i] ? false : null)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${doneFlags[i] === true ? 'bg-emerald-500/20 text-emerald-400' : doneFlags[i] === false ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>{doneFlags[i] === true ? '✓' : doneFlags[i] === false ? '✗' : '?'}</button>}
                    </div>
                    {doneFlags[i] === false && <input value={whyItems[i] || ''} onChange={e => uR(sec.id, i, 'why', e.target.value)} placeholder="Почему?" className="w-full mt-1 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 outline-none text-sm text-rose-300" />}
                  </div>);
                })}
              </div>);
            }
            return (<div key={sec.id} className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="font-semibold text-sm mb-2">{sec.title}</div>
              {Array.from({ length: sec.count }).map((_, i) => { const items = secData.items || []; return <input key={i} value={items[i] || ''} onChange={e => uR(sec.id, i, 'items', e.target.value)} placeholder={`${i + 1}`} className="inp mb-1.5" />; })}
            </div>);
          })}
        </div>
      </div>
      {grps.done.length > 0 && <div className="mt-4 mb-3"><SH text="✅ Сделано" color="text-emerald-600/60" /><div className="space-y-1.5 opacity-50">{grps.done.map(h => <HRow key={h.id} h={h} logs={tL} tmrs={tmrs} onClick={() => onH(h.id)} done onSettings={onSettings} />)}</div></div>}
    </div>
  );
}

function QkPanel({ color, icon, title, children }) {
  return (<div className="mt-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2"><div className="font-semibold" style={{ fontSize: 'clamp(14px,3.5vw,16px)' }}>{icon} {title}</div>{children}</div>);
}

function HRow({ h, logs, tmrs, onClick, done, onSettings }) {
  const hL = logs.filter(l => l.habitId === h.id && !l.isSkip)
  const v = sumH(hL, h); const ac = !!tmrs[h.id]
  const pct = h.goalDay > 0 && h.dir === 'up' ? Math.min(v / h.goalDay, 1) : (v > 0 ? 1 : 0)
  const freqLabel = {daily:'Каждый день', weekly:'Раз в нед', monthly:'Раз в мес', custom:'По дням'}[h.period] || ''
  const timeLabel = {morning:'Утро', day:'День', evening:'Вечер', anytime:'Весь день'}[h.time] || ''
  return (
    <div className={`w-full rounded-2xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden ${ac ? 'ring-1 ring-amber-500/40' : ''}`}>
      <button onClick={onClick} className="w-full p-3.5 flex items-center gap-3 active:scale-[0.98] text-left">
        <div className="text-xl w-8 flex items-center justify-center">{h.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{h.name}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500 tabular-nums">{fmtV(v)} / {h.goalDay} {h.unit}</span>
            {!done && <><span className="text-zinc-700">·</span><span className="text-xs text-zinc-600">{freqLabel}</span><span className="text-zinc-700">·</span><span className="text-xs text-zinc-600">{timeLabel}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done ? <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
            : <div className="w-10 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: h.color }} /></div>}
          {onSettings && <button onClick={e => { e.stopPropagation(); onSettings(h.id) }} className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-600 active:scale-90">⚙️</button>}
        </div>
      </button>
    </div>
  )
}


/* ============ MEDITATION PLAYER ============ */
function MedPlayer() {
  const [playing, setPlaying] = useState(false)
  const [withMusic, setWithMusic] = useState(true)
  const audioRef = useRef(null)

  const toggle = (music) => {
    if (audioRef.current) {
      if (playing && withMusic === music) {
        audioRef.current.pause()
        setPlaying(false)
        return
      }
      audioRef.current.pause()
    }
    const audio = new Audio(music ? '/meditation.mp3' : null)
    if (music) {
      audio.loop = true
      audioRef.current = audio
      audio.play().catch(() => {})
      setWithMusic(true)
      setPlaying(true)
    } else {
      setWithMusic(false)
      setPlaying(true)
      audioRef.current = null
    }
  }

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause() }, [])

  return (
    <div className="mb-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
      <div className="text-sm font-semibold text-purple-400 mb-3">🧘 Медитация</div>
      <div className="flex gap-2">
        <button onClick={() => toggle(true)} className={`flex-1 p-3 rounded-xl font-semibold text-sm active:scale-[0.98] ${playing && withMusic ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
          {playing && withMusic ? '⏸ С музыкой' : '▶ С музыкой'}
        </button>
        <button onClick={() => toggle(false)} className={`flex-1 p-3 rounded-xl font-semibold text-sm active:scale-[0.98] ${playing && !withMusic ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
          {playing && !withMusic ? '⏸ Без музыки' : '▶ Без музыки'}
        </button>
      </div>
      {playing && <div className="mt-2 text-center text-xs text-purple-400">● Воспроизведение...</div>}
    </div>
  )
}

/* ============ DETAIL ============ */
function Detail({ habit: h, logs, timer, tick, affirm, onBack, addLog, delLog, updLog, stTmr, spTmr, cTmr, onSkip, eLTs, setELTs, habits, setHab }) {
  const [note, setNote] = useState(''); const [mv, setMv] = useState(''); const [skipR, setSkipR] = useState('');
  const [showSk, setShowSk] = useState(false); const [eN, setEN] = useState(''); const [eV, setEV] = useState('');
  const [affO, setAffO] = useState(false)
  const [showAltDate, setShowAltDate] = useState(false)
  const [altDate, setAltDate] = useState(tk())
  const [altTime, setAltTime] = useState('')
  const [bH, setBH] = useState('23'); const [bM, setBM] = useState('00');
  const [wH, setWH2] = useState('07'); const [wM, setWM] = useState('00');
  const [sleepQ, setSleepQ] = useState(0);
  const [cSocial, setCSocial] = useState('Instagram'); const [cType, setCType] = useState('Пост');
  const [badChecks, setBadChecks] = useState({});
  const [walkMode, setWalkMode] = useState(h.walkMode || 'min');
  const walkUnits = { min: 'мин', m: 'м', steps: 'шагов' };

  const hL = logs.filter(l => l.habitId === h.id); const now2 = new Date(); now2.setHours(0, 0, 0, 0);
  const tL = hL.filter(l => l.ts >= now2.getTime()); const tV = sumH(tL, h);
  const tCount = tL.length;
  const wL = hL.filter(l => l.ts >= now2.getTime() - 6 * 86400000); const wV = sumH(wL, h);
  const mL = hL.filter(l => l.ts >= now2.getTime() - 29 * 86400000); const mV = sumH(mL, h);
  const tPct = h.dir === 'up' ? (h.goalDay > 0 ? Math.min(tV / h.goalDay, 1) : 0) : (tV <= (h.goalDay || 0) ? 1 : 0);
  const elapsed = timer ? Math.floor((Date.now() - timer) / 1000) : 0;
  const streak = useMemo(() => calcStr(hL, h), [hL]);
  const chart = useMemo(() => {
    const r = []
    const base = new Date(); base.setHours(0,0,0,0)
    for (let i = 6; i >= 0; i--) {
      const ds = base.getTime() - i * 86400000
      const de = ds + 86400000
      const dl = hL.filter(l => l.ts >= ds && l.ts < de)
      const val = sumH(dl, h)
      r.push({ day: new Date(ds).toLocaleDateString('ru-RU', { weekday: 'short' }), value: val, count: dl.length, isToday: i === 0 })
    }
    return r
  }, [hL, h.id])
  const maxC = Math.max(h.goalDay || 1, ...chart.map(d => d.value), 1);
  const qa = v => {
    let ts = Date.now()
    if (showAltDate && altDate) {
      const d = new Date(altDate + (altTime ? 'T' + altTime : 'T12:00'))
      if (!isNaN(d.getTime())) ts = d.getTime()
    }
    addLog({ habitId: h.id, value: v, note, ts, localTime: altTime ? altDate + ' ' + altTime : undefined })
    setNote(''); setMv(''); setShowAltDate(false); setAltDate(tk()); setAltTime('')
  }
  const logSleep = () => { const bed = parseInt(bH) * 60 + parseInt(bM); const wk = parseInt(wH) * 60 + parseInt(wM); let d = wk - bed; if (d < 0) d += 1440; addLog({ habitId: h.id, value: Math.round(d / 60 * 10) / 10, note: `Лёг: ${bH}:${bM}, встал: ${wH}:${wM}${sleepQ > 0 ? `, качество: ${sleepQ}/5` : ''}`, sleepQuality: sleepQ }); };

  if (affO) return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8"><div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center mb-6">🌟 Аффирмации</h2>
      <div className="space-y-3 leading-relaxed">{affirm.split('\n').filter(Boolean).map((l, i) => <p key={i} className="pl-3 border-l-2 border-violet-500/30 py-1">{l}</p>)}</div>
      <button onClick={() => { setAffO(false); addLog({ habitId: h.id, value: 1, note: 'Аффирмации прочитаны' }); }} className="btn-primary bg-emerald-500 text-zinc-950 mt-8 active:scale-[0.98]">✓ Прочитано</button>
    </div></div>
  );

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <span className="text-2xl">{h.icon}</span>
        <div className="flex-1 min-w-0"><h1 className="font-bold truncate">{h.name}</h1><div className="text-sm text-zinc-500">{h.cat}</div></div>
      </div>
      {h.why && <div className="mb-3 px-1"><div className="text-sm text-zinc-500 leading-relaxed italic">{h.why}</div></div>}

      <div className="mb-3 p-5 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-zinc-500">Сегодня</div>
            <div className="font-bold tabular-nums" style={{ color: h.color, fontSize: 'clamp(24px,7vw,32px)' }}>{fmtV(tV)}<span className="font-normal text-zinc-500 ml-1" style={{ fontSize: 'clamp(14px,3.5vw,16px)' }}>/ {h.goalDay} {h.unit}</span></div>
            {h.type === 'check' && <div className="text-zinc-400 mt-0.5" style={{ fontSize: 'clamp(13px,3.5vw,15px)' }}>{tCount} / {h.goalDay} раз · {Math.round(tPct * 100)}%</div>}
          </div>
          <CirP value={tPct} color={h.color} size={64} />
        </div>
        <div className="grid grid-cols-4 gap-2"><MStat l="Неделя" v={fmtV(wV)} /><MStat l="Месяц" v={fmtV(mV)} /><MStat l="Серия" v={`${streak}🔥`} /><MStat l="Цель/мес" v={`${h.goalMonth || '—'}`} /></div>
      </div>

      {h.id === 'H17' && <button onClick={() => setAffO(true)} className="w-full mb-3 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 font-semibold text-violet-400 active:scale-[0.98] flex items-center justify-center gap-2">📖 Прочитать аффирмации</button>}
      {h.id === 'H05' && <MedPlayer />}

      <div className="mb-3"><SH text="Записать" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Заметка..." className="inp mb-2" />
        <div className="mb-2">

          {showAltDate && <div className="mt-1.5 flex gap-2 flex-wrap">
            <input type="date" value={altDate} onChange={e => setAltDate(e.target.value)} className="inp flex-1" style={{minWidth:120}} />
            <TimeScroller hour={altTime.split(':')[0] || '12'} minute={altTime.split(':')[1] || '00'} onHour={h => setAltTime(h + ':' + (altTime.split(':')[1] || '00'))} onMinute={m => setAltTime((altTime.split(':')[0] || '12') + ':' + m)} />
          </div>}
        </div>

        {h.type === 'sleep' && <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"><TimeScroller hour={bH} minute={bM} onHour={setBH} onMinute={setBM} label="🌙 Лёг" />
                <TimeScroller hour={wH} minute={wM} onHour={setWH2} onMinute={setWM} label="☀️ Встал" /><div><div className="text-sm text-zinc-400 mb-1.5">Качество сна</div><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(n => { const c = ['#ef4444','#f97316','#eab308','#84cc16','#10b981'][n-1]; return <button key={n} onClick={() => setSleepQ(n)} className={`py-2.5 rounded-lg border-2 font-bold ${sleepQ === n ? 'text-white' : ''}`} style={{ borderColor: c, color: c, background: sleepQ === n ? c + '33' : 'transparent' }}>{n}</button>; })}</div></div><button onClick={logSleep} className="btn-primary bg-indigo-500 text-white active:scale-[0.98]">Записать сон</button></div>}

        {h.id === 'H21' && <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-sm text-zinc-400 mb-1">Отметьте принятые</div>
          {(h.badList || ['Витамин D','Омега-3','Магний']).map((b, i) => <button key={i} onClick={() => setBadChecks(p => ({ ...p, [b]: !p[b] }))} className={`w-full p-3 rounded-xl flex items-center gap-3 ${badChecks[b] ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}><span className={`w-5 h-5 rounded-md flex items-center justify-center text-sm ${badChecks[b] ? 'bg-emerald-500 text-white' : 'bg-zinc-700'}`}>{badChecks[b] ? '✓' : ''}</span><span>{b}</span></button>)}
          <button onClick={() => { const taken = Object.keys(badChecks).filter(k => badChecks[k]); if (taken.length) { addLog({ habitId: h.id, value: 1, note: `Принято: ${taken.join(', ')}` }); setBadChecks({}); } }} className="btn-primary bg-cyan-500 text-zinc-950 active:scale-[0.98] mt-1">💊 Записать</button>
        </div>}

        {h.id === 'H22' && <div className="space-y-2">
          <div className="flex gap-1.5">{[{v:'min',l:'⏱ Минуты'},{v:'m',l:'📏 Метры'},{v:'steps',l:'👣 Шаги'}].map(o => <button key={o.v} onClick={() => setWalkMode(o.v)} className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${walkMode === o.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{o.l}</button>)}</div>
          {walkMode === 'min' && <div className="grid grid-cols-4 gap-2">{[15,30,45,60].map(m => <button key={m} onClick={() => qa(m)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{m}</button>)}</div>}
          <div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder={walkUnits[walkMode]} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) { addLog({ habitId: h.id, value: parseFloat(mv), note: `${walkUnits[walkMode]}` }); setMv(''); setNote(''); } }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div>
        </div>}

        {h.type === 'duration' && !timer && h.id !== 'H22' && <div className="space-y-2"><button onClick={stTmr} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>▶ Начать</button><div className="grid grid-cols-4 gap-2">{[15, 30, 45, 60].map(m => <button key={m} onClick={() => qa(m)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{m}</button>)}</div><div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder="мин" className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div></div>}
        {h.type === 'duration' && timer && <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25"><div className="text-2xl font-bold tabular-nums text-amber-400 mb-1">{fmtEl(elapsed)}</div><div className="text-sm text-zinc-500 mb-3">начало: {new Date(timer).toLocaleTimeString('ru-RU')}</div><div className="flex gap-2"><button onClick={() => spTmr(note)} className="flex-1 p-3.5 rounded-xl bg-emerald-500 active:scale-[0.98] font-semibold flex items-center justify-center gap-2">⏹ Стоп</button><button onClick={cTmr} className="px-5 rounded-xl bg-zinc-800 text-zinc-400">✕</button></div></div>}
        {h.type === 'count' && h.id !== 'H22' && <div className="space-y-2">{h.unit === 'мл' ? <div className="grid grid-cols-4 gap-2">{[200, 250, 350, 500].map(n => <button key={n} onClick={() => qa(n)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}</button>)}</div> : h.unit === 'г' ? <div className="grid grid-cols-3 gap-2">{[20, 25, 30].map(n => <button key={n} onClick={() => qa(n)} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">{n}г</button>)}</div> : <><button onClick={() => qa(1)} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>+ 1</button><div className="grid grid-cols-3 gap-2">{[2, 3, 5].map(n => <button key={n} onClick={() => qa(n)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 font-semibold tabular-nums">+{n}</button>)}</div></>}<div className="flex gap-2"><input type="number" value={mv} onChange={e => setMv(e.target.value)} placeholder={h.unit} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">OK</button></div></div>}
        {h.type === 'check' && h.id === 'H20' && <div className="space-y-2"><div className="flex gap-2"><select value={cSocial} onChange={e => setCSocial(e.target.value)} className="inp flex-1">{SOCIALS.map(s => <option key={s} value={s}>{s}</option>)}</select><select value={cType} onChange={e => setCType(e.target.value)} className="inp flex-1">{CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><button onClick={() => { addLog({ habitId: h.id, value: 1, note: `${cSocial}: ${cType}` }); }} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>📸 Опубликовано</button></div>}
        {h.type === 'check' && h.id !== 'H17' && h.id !== 'H20' && h.id !== 'H21' && <button onClick={() => qa(1)} className="btn-primary border-2 active:scale-[0.98]" style={{ borderColor: h.color, color: h.color }}>✓ Сделано</button>}
        {h.type === 'rating' && <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(n => { const c = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][n - 1]; return <button key={n} onClick={() => qa(n)} className="aspect-square rounded-2xl border-2 active:scale-95 font-bold text-xl flex items-center justify-center" style={{ borderColor: c, color: c }}>{n}</button>; })}</div>}
        {h.type === 'scale' && <div className="flex gap-2"><input type="number" step="0.1" value={mv} onChange={e => setMv(e.target.value)} placeholder={h.unit} className="inp flex-1 tabular-nums" /><button onClick={() => { if (mv) qa(parseFloat(mv)); }} className="px-5 rounded-xl bg-zinc-100 text-zinc-900 active:scale-95 font-semibold">💾</button></div>}
      </div>

      <div className="mb-4"><button onClick={() => setShowSk(!showSk)} className="text-sm text-zinc-500 flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-700/50 active:scale-95">Не получилось сегодня?</button>{showSk && <div className="mt-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2"><p className="text-sm text-zinc-400">Ничего страшного, завтра получится лучше! 💪</p><input value={skipR} onChange={e => setSkipR(e.target.value)} placeholder="Что помешало? (необязательно)" className="inp" /><div className="flex gap-2"><button onClick={() => { onSkip(h.id, skipR || 'Пропуск'); setSkipR(''); setShowSk(false); }} className="flex-1 p-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold active:scale-[0.98]">Пропустить</button></div></div>}</div>

      <div className="mb-4 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800"><SH text="Последние 7 дней" /><div className="flex items-end gap-1 h-12">{chart.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-0.5"><div className="flex-1 w-full flex items-end"><div className="w-full rounded-t transition-all" style={{ height: d.count > 0 ? `${Math.max((d.value / maxC) * 100, 15)}%` : "3px", background: d.count > 0 ? (d.isToday ? h.color : `${h.color}bb`) : "#27272a", opacity: d.count > 0 ? 1 : 0.3 }} /></div><div className={`text-[9px] tabular-nums ${d.isToday ? 'text-zinc-300 font-bold' : 'text-zinc-600'}`}>{d.day}</div></div>)}</div></div>

      <div><div className="flex items-center justify-between mb-2"><SH text="История" /><span className="text-sm text-zinc-600 tabular-nums">{hL.length}</span></div>
        {hL.length === 0 && <div className="text-center py-6 text-zinc-600">Нет записей</div>}
        <div className="space-y-1.5">{hL.slice(0, 15).map(l => <div key={l.ts} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
          {eLTs === l.ts ? <div className="space-y-2"><input type="number" value={eV} onChange={e => setEV(e.target.value)} className="inp tabular-nums" /><input value={eN} onChange={e => setEN(e.target.value)} placeholder="Заметка" className="inp" /><div className="flex gap-2"><button onClick={() => { updLog(eLTs, { note: eN, value: parseFloat(eV) || 0 }); setELTs(null); }} className="flex-1 p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium">Сохранить</button><button onClick={() => setELTs(null)} className="px-3 p-2.5 rounded-lg bg-zinc-800 text-zinc-400">Отмена</button></div></div>
            : <div className="flex items-start gap-2"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-semibold tabular-nums" style={{ color: h.color }}>{fmtV(l.value)} {h.unit}</span><span className="text-sm text-zinc-500">{new Date(l.ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>{l.note && <div className="text-sm text-zinc-400 mt-0.5 italic">«{l.note}»</div>}</div><button onClick={() => { setELTs(l.ts); setEN(l.note || ''); setEV(String(l.value || '')); }} className="text-zinc-600 p-1">✏️</button><button onClick={() => delLog(l.ts)} className="text-zinc-600 hover:text-rose-400 p-1">🗑</button></div>}
        </div>)}</div></div>
    </div>
  );
}

/* ============ ALL HABITS ============ */
function AllH({ habits, onBack, onH, onEdit, onDel, onAdd, onArch }) {
  const [tab, setTab] = useState('active');
  const list = tab === 'active' ? habits.filter(h => !h.archived) : habits.filter(h => h.archived);
  const gd = CATS.map(c => ({ c, items: list.filter(h => h.cat === c) })).filter(g => g.items.length > 0);
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">📋 Настроить привычки</h1><button onClick={onAdd} className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center active:scale-95 text-emerald-400 text-xl">+</button></div>
      <div className="flex gap-2 mb-4"><button onClick={() => setTab('active')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'active' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>Активные</button><button onClick={() => setTab('archive')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'archive' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>Архив</button></div>
      {gd.map(g => <div key={g.c} className="mb-4"><SH text={g.c} /><div className="space-y-1.5">{g.items.map(h => <div key={h.id} className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-3"><button onClick={() => onH(h.id)} className="flex-1 flex items-center gap-3 text-left"><span className="text-xl">{h.icon}</span><div className="min-w-0"><div className="font-semibold truncate">{h.name}</div><div className="text-sm text-zinc-500">{FRQ.find(f => f.v === h.period)?.l}</div></div></button><button onClick={() => onArch(h.id)} className="text-zinc-600 p-1.5">📦</button><button onClick={() => onEdit(h.id)} className="text-zinc-600 p-1.5">✏️</button><button onClick={() => onDel(h.id)} className="text-zinc-600 hover:text-rose-400 p-1.5">🗑</button></div>)}</div></div>)}
      {gd.length === 0 && <div className="text-center py-8 text-zinc-600">{tab === 'archive' ? 'Архив пуст' : 'Нет активных'}</div>}
    </div>
  );
}

/* ============ EDIT HABIT ============ */
function EditH({ habit, onBack, onSave }) {
  const [f, setF] = useState(habit || { name: '', cat: 'Здоровье', type: 'check', unit: '', goalDay: 1, goalMonth: 30, goalYear: 365, period: 'daily', days: [], dir: 'up', time: 'morning', icon: '✅', color: '#7c3aed', why: '', archived: false });
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));
  const togD = d => u('days', f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d]);
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">{habit ? 'Редактировать' : 'Новая привычка'}</h1></div>
      <div className="space-y-4">
        <Fld l="Название и иконка">
          <div className="flex gap-2">
            <input value={f.name} onChange={e => u('name', e.target.value)} placeholder="Название привычки" className="inp flex-1" />
            <input value={f.icon} onChange={e => {
              const emoji = [...e.target.value].filter(c => /\p{Emoji}/u.test(c))
              u('icon', emoji[emoji.length - 1] || f.icon)
            }} className="inp text-center text-2xl" style={{width:56}} maxLength={8} />
          </div>
          <div className="text-xs text-zinc-600 mt-1 px-1">Нажмите на поле иконки и выберите эмодзи</div>
        </Fld>
        <Fld l="Категория"><Sel opts={CATS.map(c => ({ v: c, l: c }))} val={f.cat} onCh={v => u('cat', v)} /></Fld>
        <Fld l="Тип"><Sel opts={TYP} val={f.type} onCh={v => u('type', v)} /></Fld>
        <Fld l="Единица">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {['мин','ч','раз','мл','г','кг','км','м','шагов','порц.','1-5'].map(un => (
              <button key={un} onClick={() => u('unit', un)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${f.unit === un ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{un}</button>
            ))}
          </div>
          <input value={f.unit} onChange={e => u('unit', e.target.value)} placeholder="или введите своё..." className="inp" />
        </Fld>
        <Fld l="Цели">
          <div className="flex gap-2">
            <div className="flex-1"><div className="text-xs text-zinc-600 mb-1">В день</div><input type="number" value={f.goalDay} onChange={e => u('goalDay', parseFloat(e.target.value) || 0)} className="inp tabular-nums" /></div>
            <div className="flex-1"><div className="text-xs text-zinc-600 mb-1">В месяц</div><input type="number" value={f.goalMonth} onChange={e => u('goalMonth', parseFloat(e.target.value) || 0)} className="inp tabular-nums" /></div>
          </div>
        </Fld>
        <Fld l="Направление"><Sel opts={[{ v: 'up', l: 'Больше ↑' }, { v: 'down', l: 'Меньше ↓' }]} val={f.dir} onCh={v => u('dir', v)} /></Fld>
        <Fld l="Время дня"><Sel opts={TOD} val={f.time} onCh={v => u('time', v)} /></Fld>
        <Fld l="Частота">
          <div className="flex flex-wrap gap-1.5">
            {[{v:'daily',l:'Каждый день'},{v:'weekly',l:'Дни недели'},{v:'monthly',l:'Числа месяца'}].map(o =>
              <button key={o.v} onClick={() => u('period', o.v)} className={`px-3 py-2.5 rounded-lg font-medium text-sm ${f.period === o.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>{o.l}</button>
            )}
          </div>
          {f.period === 'weekly' && <div className="flex gap-1.5 mt-2">{DR.map((d, i) => <button key={i} onClick={() => togD(i)} className={`flex-1 py-2 rounded-lg font-medium text-sm ${f.days.includes(i) ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{d}</button>)}</div>}
          {f.period === 'monthly' && <div className="flex flex-wrap gap-1 mt-2">{Array.from({length:31},(_,i)=>i+1).map(n => <button key={n} onClick={() => togD(n-1)} className={`w-9 h-9 rounded-lg text-sm font-medium ${f.days.includes(n-1) ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{n}</button>)}</div>}
        </Fld>
        <Fld l="Цвет"><input type="color" value={f.color} onChange={e => u('color', e.target.value)} className="w-14 h-12 rounded-lg border border-zinc-700 bg-zinc-900" /></Fld>
        <Fld l="Зачем"><textarea value={f.why} onChange={e => u('why', e.target.value)} rows={2} className="inp resize-none" placeholder="Что изменится через год..." /></Fld>
        <button onClick={() => { if (f.name) onSave({ ...f, id: habit?.id || '' }); }} className="btn-primary bg-emerald-500 text-zinc-950 active:scale-[0.98]">{habit ? 'Сохранить' : 'Добавить'}</button>
      </div>
    </div>
  );
}

/* ============ PLAN ============ */
function Plan({ habits, logs, onBack }) {
  const [mo, setMo] = useState(new Date().getMonth()); const [yr, setYr] = useState(new Date().getFullYear()); const [selD, setSelD] = useState(null);
  const dim = new Date(yr, mo + 1, 0).getDate();
  const fdow = (() => { const d = new Date(yr, mo, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const mn = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const pM = () => { if (mo === 0) { setMo(11); setYr(yr - 1); } else setMo(mo - 1); setSelD(null); };
  const nM = () => { if (mo === 11) { setMo(0); setYr(yr + 1); } else setMo(mo + 1); setSelD(null); };
  const hfd = day => { const d = new Date(yr, mo, day); const dow = mD(d); return habits.filter(h => { if (h.period === 'daily') return true; if (h.period === 'weekly') return (h.days || []).includes(dow) || !(h.days || []).length; if (h.period === 'monthly') return (h.days || []).includes(day - 1); if (h.period === 'custom') return (h.days || []).includes(dow); return true; }); };
  const td = new Date(); const isT = day => td.getDate() === day && td.getMonth() === mo && td.getFullYear() === yr;
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">📅 План</h1></div>
      <div className="flex items-center justify-between mb-3 px-1"><button onClick={pM} className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><div className="font-bold">{mn[mo]} {yr}</div><button onClick={nM} className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">→</button></div>
      <div className="grid grid-cols-7 gap-1 mb-1">{DR.map(d => <div key={d} className="text-xs text-zinc-500 text-center font-bold">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1 mb-4">{Array.from({ length: fdow }).map((_, i) => <div key={`e${i}`} />)}{Array.from({ length: dim }).map((_, i) => { const day = i + 1; const hs = hfd(day); return <button key={day} onClick={() => setSelD(selD === day ? null : day)} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${isT(day) ? 'bg-violet-500/20 ring-2 ring-violet-500/50' : selD === day ? 'bg-zinc-800 ring-1 ring-zinc-600' : 'bg-zinc-900/50 border border-zinc-800/40'} active:scale-95`}><span className={`font-semibold ${isT(day) ? 'text-violet-400' : ''}`}>{day}</span>{hs.length > 0 && <div className="flex gap-px mt-0.5">{hs.slice(0, 3).map((h, hi) => <div key={hi} className="w-1.5 h-1.5 rounded-full" style={{ background: h.color }} />)}</div>}</button>; })}</div>
      {selD && <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800"><div className="font-semibold mb-2">{selD} {mn[mo]}</div><div className="space-y-1">{hfd(selD).map(h => <div key={h.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-800/30"><span className="text-lg">{h.icon}</span><span className="flex-1">{h.name}</span><span className="text-sm text-zinc-500">{TOD.find(t => t.v === h.time)?.l}</span></div>)}</div></div>}
    </div>
  );
}

/* ============ STATS ============ */
function Stats({ logs, habits, skips, onBack }) {
  const [period, setPeriod] = useState('week')
  const [hFilter, setHF] = useState('all')
  const now = new Date(); now.setHours(0,0,0,0)
  const ranges = { week: 7, month: 30, quarter: 90, year: 365 }
  const days = ranges[period]
  const from = now.getTime() - (days - 1) * 86400000
  const fL = logs.filter(l => l.ts >= from && !l.isSkip && (hFilter === 'all' || l.habitId === hFilter))
  const fH = hFilter === 'all' ? habits : habits.filter(h => h.id === hFilter)

  // Тепловая карта
  const heatData = useMemo(() => {
    const r = []
    for (let i = days - 1; i >= 0; i--) {
      const ds = now.getTime() - i * 86400000
      const dl = fL.filter(l => l.ts >= ds && l.ts < ds + 86400000)
      const done = fH.filter(h => { const hl = dl.filter(l => l.habitId === h.id); return sumH(hl, h) > 0 }).length
      r.push({ date: new Date(ds), pct: fH.length ? done / fH.length : 0, done, total: fH.length })
    }
    return r
  }, [fL, fH, days])

  // Топ привычек
  const topHabits = useMemo(() => {
    return habits.map(h => {
      const hL = fL.filter(l => l.habitId === h.id)
      const streak = calcStr(logs.filter(l => l.habitId === h.id), h)
      const daysLogged = new Set(hL.map(l => new Date(l.ts).toISOString().slice(0,10))).size
      const pct = Math.round(daysLogged / days * 100)
      return { h, daysLogged, pct, streak }
    }).filter(x => x.daysLogged > 0).sort((a,b) => b.pct - a.pct).slice(0, 5)
  }, [fL, days])

  const avgPct = heatData.length ? Math.round(heatData.reduce((s,d) => s + d.pct, 0) / heatData.length * 100) : 0
  const totalLogs = fL.length
  const totalSkips = skips.filter(s => new Date(s.date+'T00:00').getTime() >= from).length
  const bestDay = heatData.reduce((b,d) => d.pct > b.pct ? d : b, heatData[0] || {pct:0})
  const bestStreak = habits.reduce((max, h) => { const s = calcStr(logs.filter(l => l.habitId === h.id), h); return s > max.s ? {s, h} : max }, {s:0, h:null})

  const periodLabel = {week:'за неделю', month:'за месяц', quarter:'за квартал', year:'за год'}[period]

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">📊 Статистика</h1>
      </div>

      <div className="flex gap-1.5 mb-4">
        {[{v:'week',l:'7 дней'},{v:'month',l:'Месяц'},{v:'quarter',l:'Квартал'},{v:'year',l:'Год'}].map(p =>
          <button key={p.v} onClick={() => setPeriod(p.v)} className={`flex-1 py-2 rounded-lg font-semibold text-sm ${period === p.v ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>{p.l}</button>
        )}
      </div>

      <div className="mb-3">
        <select value={hFilter} onChange={e => setHF(e.target.value)} className="inp">
          <option value="all">Все привычки</option>
          {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
          <div className="text-3xl font-black" style={{color:'#7c3aed'}}>{avgPct}%</div>
          <div className="text-xs text-zinc-500 mt-1">Средний % выполнения</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
          <div className="text-3xl font-black text-emerald-400">{totalLogs}</div>
          <div className="text-xs text-zinc-500 mt-1">Записей {periodLabel}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
          <div className="text-3xl font-black text-amber-400">{bestStreak.s}🔥</div>
          <div className="text-xs text-zinc-500 mt-1">{bestStreak.h ? `Серия: ${bestStreak.h.name}` : 'Лучшая серия'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
          <div className="text-3xl font-black text-rose-400">{totalSkips}</div>
          <div className="text-xs text-zinc-500 mt-1">Пропусков {periodLabel}</div>
        </div>
      </div>

      {topHabits.length > 0 && <div className="mb-4">
        <SH text="Топ привычек" />
        <div className="space-y-2">
          {topHabits.map(({h, daysLogged, pct, streak}) => (
            <div key={h.id} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span>{h.icon}</span>
                <span className="flex-1 font-medium text-sm">{h.name}</span>
                <span className="font-bold tabular-nums" style={{color: h.color}}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background: h.color}} />
              </div>
              <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
                <span>{daysLogged} из {days} дней</span>
                {streak > 0 && <span>🔥 серия {streak}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>}

      <div className="mb-4">
        <SH text={`Тепловая карта (${days} дней)`} />
        <div className="flex flex-wrap gap-1 mt-1">
          {heatData.map((d, i) => {
            const g = Math.round(d.pct * 4)
            const colors = ['#27272a','#4c1d95','#6d28d9','#7c3aed','#a78bfa']
            return <div key={i} className="w-4 h-4 rounded-sm cursor-default" style={{background: colors[g]}} title={`${d.date.toLocaleDateString('ru-RU')}: ${d.done}/${d.total} (${Math.round(d.pct*100)}%)`} />
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
          <span>Меньше</span>
          {['#27272a','#4c1d95','#6d28d9','#7c3aed','#a78bfa'].map((c,i) => <div key={i} className="w-3 h-3 rounded-sm" style={{background:c}} />)}
          <span>Больше</span>
        </div>
      </div>

      {hFilter !== 'all' && (() => {
        const h = habits.find(x => x.id === hFilter)
        if (!h) return null
        const chartD = []
        const n = Math.min(days, 14)
        for (let i = n-1; i >= 0; i--) {
          const ds = now.getTime() - i * 86400000
          const dl = fL.filter(l => l.ts >= ds && l.ts < ds + 86400000)
          chartD.push({ day: new Date(ds).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}), value: sumH(dl, h) })
        }
        const mx = Math.max(h.goalDay || 1, ...chartD.map(d => d.value), 1)
        return <div className="mb-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="text-sm font-semibold mb-3">{h.icon} {h.name} — динамика</div>
          <div className="flex items-end gap-1 h-20">
            {chartD.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex-1 w-full flex items-end">
                <div className="w-full rounded-t" style={{height: d.value > 0 ? `${Math.max(d.value/mx*100,10)}%` : '2px', background: h.color, opacity: d.value > 0 ? 1 : 0.2}} />
              </div>
              <div className="text-[8px] text-zinc-600 tabular-nums">{d.day}</div>
            </div>)}
          </div>
          {h.goalDay > 0 && <div className="mt-2 text-xs text-zinc-500">Цель: {h.goalDay} {h.unit}/день</div>}
        </div>
      })()}
    </div>
  )
}

/* ============ ACHIEVEMENTS ============ */
function Ach({ logs, habits, xp, onBack }) {
  const totalLogs = logs.filter(l => !l.isSkip).length

  const achievements = useMemo(() => {
    const list = []
    habits.forEach(h => {
      const hL = logs.filter(l => l.habitId === h.id && !l.isSkip)
      const streak = calcStr(hL, h)
      const total = hL.length
      const now2 = new Date(); now2.setHours(0,0,0,0)
      const last7 = hL.filter(l => l.ts >= now2.getTime() - 6*86400000).length
      const last30 = hL.filter(l => l.ts >= now2.getTime() - 29*86400000).length

      // Серии
      if (streak >= 365) list.push({ icon: '🌟', title: `${h.name}: 365 дней!`, desc: 'Целый год без пропусков — феноменально!', color: '#f59e0b', cat: 'streak' })
      else if (streak >= 100) list.push({ icon: '🏆', title: `${h.name}: ${streak} дней`, desc: 'Серия 100+ дней подряд', color: '#f59e0b', cat: 'streak' })
      else if (streak >= 30) list.push({ icon: '🔥', title: `${h.name}: ${streak} дней`, desc: 'Месяц без пропусков!', color: '#ef4444', cat: 'streak' })
      else if (streak >= 7) list.push({ icon: '⚡', title: `${h.name}: ${streak} дней`, desc: 'Неделя подряд — отличный старт!', color: '#eab308', cat: 'streak' })

      // Количество
      if (total >= 500) list.push({ icon: '💎', title: `${h.name}: 500 записей`, desc: 'Полтысячи отметок!', color: '#a78bfa', cat: 'total' })
      else if (total >= 100) list.push({ icon: '💯', title: `${h.name}: 100 записей`, desc: 'Сотня выполнений!', color: '#60a5fa', cat: 'total' })
      else if (total >= 30) list.push({ icon: '🌱', title: `${h.name}: 30 записей`, desc: 'Привычка формируется!', color: '#34d399', cat: 'total' })

      // Лучшая неделя
      if (last7 >= 7) list.push({ icon: '🎯', title: `${h.name}: идеальная неделя`, desc: '7 из 7 дней на этой неделе', color: '#10b981', cat: 'week' })

      // Лучший месяц
      if (last30 >= 28) list.push({ icon: '🏅', title: `${h.name}: лучший месяц`, desc: `${last30} из 30 дней`, color: '#7c3aed', cat: 'month' })
    })

    // Общие ачивки
    if (totalLogs >= 1000) list.push({ icon: '🚀', title: '1000 записей!', desc: 'Вы настоящий профессионал привычек', color: '#f59e0b', cat: 'total' })
    else if (totalLogs >= 500) list.push({ icon: '⭐', title: '500 записей!', desc: 'Полпути к тысяче', color: '#eab308', cat: 'total' })
    else if (totalLogs >= 100) list.push({ icon: '✨', title: '100 записей!', desc: 'Уверенный старт!', color: '#60a5fa', cat: 'total' })
    else if (totalLogs >= 10) list.push({ icon: '🌿', title: '10 записей!', desc: 'Первые шаги сделаны', color: '#34d399', cat: 'total' })

    return list
  }, [logs, habits])

  // Лучшие серии по каждой привычке
  const streaks = useMemo(() => {
    return habits.map(h => {
      const hL = logs.filter(l => l.habitId === h.id && !l.isSkip)
      return { h, streak: calcStr(hL, h), total: hL.length }
    }).filter(x => x.streak > 0 || x.total > 0).sort((a,b) => b.streak - a.streak).slice(0, 5)
  }, [logs, habits])

  const cats = [
    { key: 'streak', label: '🔥 Серии', color: '#ef4444' },
    { key: 'week', label: '🎯 Неделя', color: '#10b981' },
    { key: 'month', label: '🏅 Месяц', color: '#7c3aed' },
    { key: 'total', label: '💯 Всего', color: '#60a5fa' },
  ]

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">🏆 Достижения</h1>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 mb-4">
        <div className="text-sm text-zinc-500 mb-1">Всего записей</div>
        <div className="text-4xl font-black tabular-nums">{totalLogs}</div>
        <div className="text-sm text-zinc-500 mt-1">Каждая запись — шаг к лучшей версии себя</div>
      </div>

      {streaks.length > 0 && <div className="mb-4">
        <SH text="Текущие серии" />
        <div className="space-y-2">
          {streaks.map(({h, streak, total}) => (
            <div key={h.id} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
              <span className="text-xl">{h.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{h.name}</div>
                <div className="text-xs text-zinc-500">{total} записей всего</div>
              </div>
              {streak > 0 && <div className="text-right"><div className="font-black tabular-nums text-lg" style={{color: h.color}}>{streak}</div><div className="text-[10px] text-zinc-500">дней 🔥</div></div>}
            </div>
          ))}
        </div>
      </div>}

      {cats.map(cat => {
        const catAchs = achievements.filter(a => a.cat === cat.key)
        if (!catAchs.length) return null
        return (
          <div key={cat.key} className="mb-4">
            <SH text={cat.label} />
            <div className="space-y-2">
              {catAchs.map((a, i) => (
                <div key={i} className="p-3.5 rounded-2xl border flex items-center gap-3 pop-in" style={{borderColor: a.color + '30', background: a.color + '08'}}>
                  <span className="text-2xl">{a.icon}</span>
                  <div><div className="font-semibold">{a.title}</div><div className="text-sm text-zinc-500">{a.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {achievements.length === 0 && <div className="text-center py-10 text-zinc-500">
        <div className="text-4xl mb-3">🌱</div>
        <div className="font-medium mb-1">Первые достижения близко!</div>
        <div className="text-sm">Записывайте привычки несколько дней подряд чтобы открыть значки</div>
      </div>}
    </div>
  )
}

/* ============ MOTIVATION ============ */
function Mot({ quotes, onBack, onSave }) {
  const [edit, setEdit] = useState(false)
  const text = Array.isArray(quotes) ? quotes.join('\n') : quotes
  const [t, setT] = useState(text)
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">💬 Мотивация</h1><button onClick={() => { if (edit) onSave(t.split('\n').filter(Boolean)); setEdit(!edit); }} className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-300 font-medium active:scale-95">{edit ? '💾' : '✏️'}</button></div>
      {edit
        ? <textarea value={t} onChange={e => setT(e.target.value)} rows={16} className="inp resize-none leading-relaxed" placeholder="Каждая фраза с новой строки..." />
        : <div className="space-y-2">{(Array.isArray(quotes) ? quotes : quotes.split('\n')).filter(Boolean).map((q, i) => <p key={i} className="pl-3 border-l-2 border-violet-500/30 py-1.5 leading-relaxed text-zinc-300">{q}</p>)}</div>}

    </div>
  )
}

/* ============ AFFIRMATIONS ============ */
function AffScr({ text, onBack, onSave }) {
  const [e, setE] = useState(false); const [t, setT] = useState(text);
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">🌟 Аффирмации</h1><button onClick={() => { if (e) onSave(t); setE(!e); }} className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-300 font-medium active:scale-95">{e ? '💾' : '✏️'}</button></div>
      <p className="text-sm text-zinc-500 mb-4 px-1">Читайте каждое утро вслух с чувством. Редактируйте под себя — это ваши утверждения.</p>
      {e ? <textarea value={t} onChange={e2 => setT(e2.target.value)} rows={14} className="inp resize-none leading-relaxed" />
        : <div className="space-y-3">{text.split('\n').filter(Boolean).map((l, i) => <p key={i} className="pl-3 border-l-2 border-violet-500/30 py-1.5 leading-relaxed">{l}</p>)}</div>}

    </div>
  );
}

/* ============ IDEAS (с редактированием, отменой удаления, вкладкой Сделано) ============ */
function IdeasScr({ ideas, onBack, onUpd, onAdd, onUpdate, onDelete, show }) {
  const [nT, setNT] = useState('')
  const [nC, setNC] = useState('')
  const [nP, setNP] = useState('medium')
  const [tab, setTab] = useState('active')
  const [eId, setEId] = useState(null); const [eT, setET] = useState(''); const [eC, setEC] = useState(''); const [eP, setEP] = useState('medium')
  const [cats, setCats] = useState(() => { try { return JSON.parse(localStorage.getItem('wh:ideaCats') || '["Работа","Личное","Творчество","Здоровье"]') } catch { return ["Работа","Личное","Творчество","Здоровье"] } })
  const [newCat, setNewCat] = useState('')
  const saveCats = (c) => { setCats(c); localStorage.setItem('wh:ideaCats', JSON.stringify(c)) }
  const pI = { high: '🔴', medium: '🟡', low: '🟢' }
  const pL = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
  const pLong = { high: '🔴 Высокий', medium: '🟡 Средний', low: '🟢 Низкий' }

  const activeIdeas = ideas.filter(i => !i.done)
  const doneIdeas = ideas.filter(i => i.done)
  const list = tab === 'active' ? activeIdeas : doneIdeas
  const sorted = [...list].sort((a,b) => { const po = {high:0,medium:1,low:2}; return (po[a.priority]||1)-(po[b.priority]||1) })

  const toggleDone = (id) => { onUpdate(id, { done: !ideas.find(x => x.id === id)?.done }); show('Обновлено ✓') }
  const saveEdit = () => { onUpdate(eId, { text: eT, category: eC, priority: eP }); setEId(null); show('Сохранено ✓') }

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">💡 Идеи</h1>
        <span className="text-sm text-zinc-500">{ideas.length}</span>
      </div>

      <div className="mb-3 space-y-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <input value={nT} onChange={e => setNT(e.target.value)} placeholder="Запишите идею..." className="inp" />
        <div>
          <div className="text-xs text-zinc-500 mb-1.5 font-semibold">Приоритет</div>
          <div className="flex gap-1.5">
            {['high','medium','low'].map(p => (
              <button key={p} onClick={() => setNP(p)} className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 ${nP === p ? 'bg-violet-500/20 border border-violet-500/40 text-zinc-100' : 'bg-zinc-800 border border-zinc-800 text-zinc-500'}`}>
                <span>{pI[p]}</span><span>{pL[p]}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1.5 font-semibold">Тема</div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map(c => <button key={c} onClick={() => setNC(c === nC ? '' : c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${nC === c ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-zinc-800 text-zinc-400'}`}>{c}</button>)}
          </div>
          <div className="flex gap-2 mt-1.5">
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Своя тема..." className="inp flex-1 text-sm" />
            {newCat && <button onClick={() => { if (newCat && !cats.includes(newCat)) { saveCats([...cats, newCat]); setNC(newCat) } setNewCat('') }} className="px-3 rounded-xl bg-zinc-700 text-zinc-300 active:scale-95">OK</button>}
          </div>
        </div>
        <button onClick={() => {
          if (!nT) return
          const idea = { id: Date.now(), date: tk(), time: new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}), text: nT, category: nC, priority: nP, done: false }
          onAdd(idea); setNT(''); setNC(''); setNP('medium'); show('Идея записана ✓')
        }} className="w-full p-3 rounded-xl bg-zinc-100 text-zinc-900 font-semibold active:scale-[0.98]">Записать</button>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('active')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'active' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>Активные ({activeIdeas.length})</button>
        <button onClick={() => setTab('done')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-400'}`}>Сделано ({doneIdeas.length})</button>
      </div>

      {sorted.length === 0 && <div className="text-center py-8 text-zinc-500">{tab === 'active' ? 'Запишите первую идею!' : 'Реализованных идей пока нет'}</div>}
      <div className="space-y-2">
        {sorted.map(idea => (
          <div key={idea.id} className="rounded-2xl bg-zinc-900/50 border border-zinc-800/40 overflow-hidden">
            {eId === idea.id ? (
              <div className="p-4 space-y-2">
                <textarea value={eT} onChange={e => setET(e.target.value)} rows={2} className="inp resize-none w-full" />
                <div className="flex gap-1.5">
                  {['high','medium','low'].map(p => <button key={p} onClick={() => setEP(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${eP === p ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500'}`}>{pI[p]} {pL[p]}</button>)}
                </div>
                <div className="flex gap-2"><button onClick={saveEdit} className="flex-1 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold active:scale-[0.98]">Сохранить</button><button onClick={() => setEId(null)} className="px-4 rounded-xl bg-zinc-800 text-zinc-400">Отмена</button></div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleDone(idea.id)} className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 ${idea.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600'}`}>{idea.done ? '✓' : ''}</button>
                  <div className="flex-1 min-w-0">
                    <p className={`leading-relaxed font-medium ${idea.done ? 'line-through text-zinc-500' : ''}`}>{idea.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{pLong[idea.priority]}</span>
                      {idea.category && <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{idea.category}</span>}
                      <span className="text-xs text-zinc-600">{idea.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/40">
                  <button onClick={() => { setEId(idea.id); setET(idea.text); setEC(idea.category||''); setEP(idea.priority||'medium') }} className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium active:scale-[0.98]">✏️ Изменить</button>
                  <button onClick={() => onDelete(idea.id)} className="px-4 py-1.5 rounded-lg bg-zinc-800 text-rose-400 text-xs font-medium active:scale-[0.98]">🗑 Удалить</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ REFLECTION HISTORY + SETTINGS (объединено) ============ */
function RefHist({ reflections, refSections, onBack, onUpd, onSaveSec }) {
  const [tab, setTab] = useState('history');
  const [es, setEs] = useState(null); const [esT, setEsT] = useState(''); const [esC, setEsC] = useState(3); const [esType, setEsType] = useState('simple');
  const sorted = [...reflections].sort((a, b) => b.date.localeCompare(a.date));

  const addSec = () => {
    const n = [...refSections, { id: `sec_${Date.now()}`, title: '📌 Новая секция', count: 3, type: 'simple' }];
    onSaveSec(n);
  };
  const delSec = id => onSaveSec(refSections.filter(s => s.id !== id));
  const saveSec = () => {
    onSaveSec(refSections.map(s => s.id === es ? { ...s, title: esT, count: esC, type: esType } : s));
    setEs(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">📝 Рефлексия</h1></div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('history')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'history' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>История</button>
        <button onClick={() => setTab('settings')} className={`flex-1 py-2.5 rounded-lg font-semibold ${tab === 'settings' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>Настройки</button>
      </div>

      {tab === 'history' && <>
        {sorted.length === 0 && <div className="text-center py-8 text-zinc-500">Записей пока нет — заполните рефлексию на главном экране</div>}
        {sorted.map(r => {
          const hasCont = Object.values(r.data || {}).some(sec => { const items = sec.items || []; return items.some(Boolean); });
          if (!hasCont) return null;
          return (
            <div key={r.date} className="mb-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between mb-2"><span className="font-semibold">{r.date}</span><button onClick={() => onUpd(reflections.filter(x => x.date !== r.date))} className="text-zinc-600 text-sm">🗑</button></div>
              {Object.entries(r.data || {}).map(([secId, secData]) => {
                const sec = refSections.find(s => s.id === secId);
                const items = secData.items || [];
                const filled = items.filter(Boolean);
                if (!filled.length) return null;
                return (
                  <div key={secId} className="mb-2">
                    <div className="text-sm text-zinc-500 mb-1">{sec?.title || secId}</div>
                    {filled.map((it, i) => {
                      const doneFlags = secData.done || [];
                      return <div key={i} className="flex items-center gap-2 py-0.5">
                        {sec?.type === 'tasks' && <span className={doneFlags[items.indexOf(it)] === true ? 'text-emerald-400' : doneFlags[items.indexOf(it)] === false ? 'text-rose-400' : 'text-zinc-500'}>{doneFlags[items.indexOf(it)] === true ? '✓' : doneFlags[items.indexOf(it)] === false ? '✗' : '·'}</span>}
                        <span className="text-sm">{it}</span>
                      </div>;
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </>}

      {tab === 'settings' && <>
        <p className="text-sm text-zinc-500 mb-3">Настройте секции рефлексии — они отображаются на главном экране.</p>
        <div className="space-y-2">
          {refSections.map(sec => (
            <div key={sec.id} className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
              {es === sec.id ? (
                <div className="space-y-2">
                  <input value={esT} onChange={e => setEsT(e.target.value)} placeholder="Название" className="inp" />
                  <div className="flex gap-2">
                    <div className="flex-1"><div className="text-xs text-zinc-500 mb-1">Кол-во строк</div><input type="number" min="1" max="10" value={esC} onChange={e => setEsC(parseInt(e.target.value) || 3)} className="inp tabular-nums" /></div>
                    <div className="flex-1"><div className="text-xs text-zinc-500 mb-1">Тип</div><select value={esType} onChange={e => setEsType(e.target.value)} className="inp"><option value="simple">Простой</option><option value="tasks">Задачи ✓/✗</option></select></div>
                  </div>
                  <div className="flex gap-2"><button onClick={saveSec} className="flex-1 p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium">Сохранить</button><button onClick={() => setEs(null)} className="px-3 p-2.5 rounded-lg bg-zinc-800 text-zinc-400">Отмена</button></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-medium">{sec.title}</span>
                  <span className="text-xs text-zinc-500">{sec.count} строк · {sec.type === 'tasks' ? 'задачи' : 'простой'}</span>
                  <button onClick={() => { setEs(sec.id); setEsT(sec.title); setEsC(sec.count); setEsType(sec.type); }} className="text-zinc-600 p-1">✏️</button>
                  <button onClick={() => delSec(sec.id)} className="text-zinc-600 p-1">🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={addSec} className="w-full mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold active:scale-[0.98]">+ Добавить секцию</button>
      </>}
    </div>
  );
}

/* ============ QUICK SETTINGS ============ */
function QkSet({ habits, quickIds, onBack, onSave }) {
  const [sel, setSel] = useState(quickIds);
  const special = [{ id: 'idea', icon: '💡', name: 'Идея' }, { id: 'unplanned', icon: '📋', name: 'Без плана' }, { id: 'H08', icon: '⚡', name: 'Энергия' }]
  const quickCompatible = habits.filter(h => ['check','count','rating'].includes(h.type))
  const all = [...special, ...quickCompatible.map(h => ({ id: h.id, icon: h.icon, name: h.name }))]
  const tog = id => { const n = sel.includes(id) ? sel.filter(x => x !== id) : sel.length < 4 ? [...sel, id] : sel; setSel(n); };
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">⚡ Быстрые записи</h1></div>
      <p className="text-sm text-zinc-500 mb-3">Выберите до 4 привычек для быстрого доступа с главного экрана.</p>
      <p className="text-xs text-zinc-500 mb-3 px-1">Выбор применяется сразу</p>
      <div className="space-y-1.5">{all.map(h => <button key={h.id} onClick={() => { const n = sel.includes(h.id) ? sel.filter(x => x !== h.id) : sel.length < 4 ? [...sel, h.id] : sel; setSel(n); onSave(n); }} className={`w-full p-3.5 rounded-xl flex items-center gap-3 ${sel.includes(h.id) ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-zinc-900/50 border border-zinc-800/40'}`}><span className="text-xl">{h.icon}</span><span className="flex-1 text-left font-medium">{h.name}</span>{sel.includes(h.id) && <span className="text-emerald-400 font-bold">✓</span>}</button>)}</div>
    </div>
  );
}

/* ============ ACCOUNT ============ */
function Acct({ user, onBack, onOut }) {
  const [avatar, setAvatar] = useState(() => localStorage.getItem('wh:avatar') || '')
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('wh:name') || user?.email?.split('@')[0] || '')
  const fileRef = useRef(null)

  const onFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Сжимаем через canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        const data = canvas.toDataURL('image/jpeg', 0.7)
        setAvatar(data)
        localStorage.setItem('wh:avatar', data)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">👤 Аккаунт</h1></div>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-24 h-24 rounded-full bg-violet-500/20 border-2 border-violet-500/30 flex items-center justify-center text-4xl overflow-hidden">
            {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : '👤'}
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-sm text-violet-400 font-medium">Изменить фото</button>
          {avatar && <button onClick={() => { setAvatar(''); localStorage.removeItem('wh:avatar'); }} className="text-xs text-zinc-600">Удалить фото</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Имя</div>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} onBlur={() => { localStorage.setItem('wh:name', displayName) }} className="inp" placeholder="Ваше имя" />
          </div>
          <div><div className="text-xs text-zinc-500 mb-1">Email</div><div className="text-zinc-300">{user.email}</div></div>
        </div>
        <button onClick={onOut} className="btn-primary bg-zinc-800 text-zinc-300 active:scale-[0.98]">Выйти</button>
      </div>
    </div>
  )
}

/* ============ EXPORT ============ */
function Exp({ logs, habits, skips, onBack }) {
  const [copied, setCopied] = useState(false)
  const csv = useMemo(() => {
    const rows = ['Дата,Время,Привычка,Значение,Единица,Заметка']
    logs.forEach(l => {
      const h = habits.find(x => x.id === l.habitId)
      const d = new Date(l.ts)
      rows.push([d.toLocaleDateString('ru-RU'), d.toLocaleTimeString('ru-RU'), h?.name || l.habitId, l.value, h?.unit || '', (l.note || '').replace(/,/g, ';')].join(','))
    })
    return rows.join('\n')
  }, [logs, habits])

  const dl = (type = 'habits') => {
    let data = csv
    if (type === 'all') {
      const rows = ['=== ПРИВЫЧКИ ===', ...csv.split('\n')]
      data = rows.join('\n')
    }
    const blob = new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = u; a.download = 'wildhabits_' + tk() + '.csv'; a.click(); URL.revokeObjectURL(u)
  }

  const aiText = 'Я загружу тебе CSV файл с данными моих привычек из WildHabits. Столбцы: Дата, Время, Привычка, Значение, Единица, Заметка.\n\nПроанализируй данные:\n1. Какие привычки выполняю чаще/реже всего?\n2. В какие дни недели наиболее продуктивен?\n3. Какие привычки имеют положительную/отрицательную динамику?\n4. Топ-3 инсайта из данных?\n5. Что стоит улучшить?\n\nОтвечай конкретно с цифрами из данных.'

  const copyAI = () => {
    navigator.clipboard.writeText(aiText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">📤 Экспорт данных</h1>
      </div>
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-3">
        <div className="grid grid-cols-3 gap-2 mb-3"><MStat l="Записей" v={logs.length} /><MStat l="Привычек" v={habits.length} /><MStat l="Пропусков" v={skips.length} /></div>
        <button onClick={() => dl('habits')} className="btn-primary bg-emerald-500 text-zinc-950 active:scale-[0.98]">📥 Скачать CSV (привычки)</button>
      </div>
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-3">
        <div className="font-semibold mb-2">📊 Google Sheets</div>
        <div className="space-y-1.5 text-sm text-zinc-400">
          {['Скачайте CSV файл выше', 'Откройте sheets.google.com → новая таблица', 'Файл → Импорт → Загрузить → выберите файл', 'Разделитель: запятая → Импортировать'].map((s,i) => <div key={i} className="flex gap-2"><span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0">{i+1}</span><span>{s}</span></div>)}
        </div>
      </div>
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-3">
        <div className="font-semibold mb-2">📱 Excel</div>
        <div className="space-y-1.5 text-sm text-zinc-400">
          {['Скачайте CSV файл', 'Excel → Данные → Из текстового/CSV файла', 'Кодировка UTF-8, разделитель — запятая'].map((s,i) => <div key={i} className="flex gap-2"><span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0">{i+1}</span><span>{s}</span></div>)}
        </div>
      </div>
      <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
        <div className="font-semibold mb-1">🤖 Промт для ИИ-анализа</div>
        <div className="text-xs text-zinc-500 mb-2">Скопируйте, вставьте в ChatGPT и приложите CSV файл</div>
        <div className="p-3 rounded-xl bg-zinc-900/50 text-xs text-zinc-400 leading-relaxed mb-3 max-h-28 overflow-y-auto whitespace-pre-wrap">{aiText}</div>
        <button onClick={copyAI} className="btn-primary active:scale-[0.98]" style={{background: copied ? '#10b981' : '#7c3aed', color:'white'}}>
          {copied ? '✓ Скопировано!' : '📋 Скопировать промт'}
        </button>
      </div>
    </div>
  )
}
/* ============ HELP ============ */
function HelpScr({ onBack }) {
  const sections = [
    { icon: '🏠', title: 'Привычки дня', desc: 'Главный экран — все ваши привычки на сегодня, сгруппированные по времени дня: утро, день, вечер. Нажмите на любую привычку чтобы открыть её и сделать запись. Выполненные привычки уходят вниз в раздел «Сделано».' },
    { icon: '📋', title: 'Все привычки', desc: 'Полный список всех привычек. Нажмите «+» чтобы добавить новую. Свайпните или нажмите иконку карандаша для редактирования. Можно архивировать привычку — она исчезнет с главного экрана но данные сохранятся.' },
    { icon: '⚡', title: 'Быстрые записи', desc: '4 кнопки в правом верхнем углу главного экрана — запись самых частых привычек в одно нажатие. Настройте какие привычки там показывать в разделе «Быстрые записи» в меню.' },
    { icon: '📅', title: 'План', desc: 'Календарь месяца. Цветные точки под датой показывают запланированные привычки. Нажмите на день чтобы увидеть список привычек на этот день.' },
    { icon: '📊', title: 'Статистика', desc: 'Графики и тепловая карта выполнения привычек. Выбирайте период: неделя, месяц, квартал, год. Фильтруйте по конкретной привычке чтобы видеть детальный график.' },
    { icon: '🏆', title: 'Ачивки и уровни', desc: 'Каждая запись даёт вам XP (опыт). Накапливайте XP и поднимайтесь по уровням: Новичок → Практик → Мастер → Гуру → Легенда. Серии без пропусков дают дополнительные достижения.' },
    { icon: '💡', title: 'Идеи', desc: 'Записывайте идеи которые приходят в голову. Добавляйте категорию и приоритет (высокий, средний, низкий). Когда идея реализована — отметьте галочкой, она перейдёт во вкладку «Сделано».' },
    { icon: '📅', title: 'События', desc: 'Отслеживайте важные даты — сколько времени прошло или осталось. Разовые события (путешествия, достижения) и повторяющиеся ежегодно (дни рождения, годовщины).' },
    { icon: '📝', title: 'Рефлексия', desc: 'Ежедневная рефлексия на главном экране: задачи дня с отметкой выполнено/не выполнено, благодарности, достижения. Настройте свои секции в разделе Рефлексия → Настройки.' },
    { icon: '💬', title: 'Мотивация и Аффирмации', desc: 'Мотивация — список вдохновляющих фраз, одна случайная показывается на главном экране. Аффирмации — утренние утверждения, читайте их вслух каждое утро.' },
    { icon: '📤', title: 'Экспорт', desc: 'Скачайте все ваши данные в формате CSV. Откройте в Google Sheets или Excel для анализа.' },
    { icon: '🔒', title: 'Ваши данные', desc: 'Все данные хранятся в защищённом облаке и не пропадут. Можете зайти с любого устройства через браузер.' },
  ];
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">❓ О приложении</h1></div>
      <div className="mb-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
        <img src="/logo.png" alt="WH" className="h-10 w-auto mx-auto mb-2" />
        <div className="font-bold text-violet-400">WildHabits {V}</div>
        <div className="text-sm text-zinc-400 mt-1">Трекер привычек для осознанной жизни</div>
      </div>
      <div className="space-y-2 mb-6">{sections.map((s, i) => <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"><div className="flex items-center gap-2 mb-1"><span className="text-lg">{s.icon}</span><span className="font-semibold">{s.title}</span></div><p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p></div>)}</div>
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
        <div className="text-sm text-zinc-500">Создатель приложения</div>
        <div className="font-semibold mt-1">Колесников Дмитрий</div>
        <a href="https://diko.top" target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm">diko.top</a>
      </div>
    </div>
  )
}



/* ============ СОБЫТИЯ ============ */
function EventsScr({ onBack, user, show }) {
  const [events, setEvents] = useState([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', icon: '📅', date: '', time: '00:00', repeats: false, units: ['years','months','days'] })
  const upd = (k, v) => setForm(f => ({...f, [k]: v}))

  useEffect(() => {
    if (!user) return
    supabase.from('events').select('*').eq('user_id', user.id).order('date')
      .then(({ data, error }) => {
        if (error) console.error('events load error:', error)
        setEvents(data || [])
        setLoading(false)
      })
  }, [user?.id])

  const UNIT_OPTS = [
    {v:'years', l:'Лет'}, {v:'months', l:'Месяцев'}, {v:'weeks', l:'Недель'},
    {v:'days', l:'Дней'}, {v:'hours', l:'Часов'}, {v:'minutes', l:'Минут'}
  ]
  const togUnit = (u) => upd('units', form.units.includes(u) ? form.units.filter(x => x !== u) : [...form.units, u])

  const calcDiff = (ev) => {
    const now = new Date()
    let target = new Date(ev.date + 'T' + (ev.time || '00:00'))
    if (ev.repeats_yearly) {
      target.setFullYear(now.getFullYear())
      if (target < now) target.setFullYear(now.getFullYear() + 1)
    }
    const diff = target - now
    const isPast = diff < 0
    const abs = Math.abs(diff)
    const totalSec = Math.floor(abs / 1000)
    const totalMin = Math.floor(totalSec / 60)
    const totalHours = Math.floor(totalMin / 60)
    const totalDays = Math.floor(totalHours / 24)
    const totalWeeks = Math.floor(totalDays / 7)
    const totalMonths = Math.floor(totalDays / 30.44)
    const totalYears = Math.floor(totalDays / 365.25)
    const units = ev.units || ['years','months','days']
    const parts = []
    if (units.includes('years') && totalYears > 0) parts.push(`${totalYears} ${totalYears === 1 ? 'год' : totalYears < 5 ? 'года' : 'лет'}`)
    if (units.includes('months') && totalMonths > 0) { const m = totalMonths % 12; if (m > 0) parts.push(`${m} мес`) }
    if (units.includes('weeks') && totalWeeks > 0 && !units.includes('years')) parts.push(`${totalWeeks} нед`)
    if (units.includes('days')) { const d = totalDays % 30; if (d > 0 || parts.length === 0) parts.push(`${d || totalDays} дн`) }
    if (units.includes('hours') && !units.includes('days')) parts.push(`${totalHours % 24} ч`)
    if (units.includes('minutes') && !units.includes('hours')) parts.push(`${totalMin % 60} мин`)
    return { text: parts.join(' ') || '0 дн', isPast }
  }

  const resetForm = () => setForm({ name: '', icon: '📅', date: '', time: '00:00', repeats: false, units: ['years','months','days'] })

  const save = async () => {
    if (!form.name || !form.date) return
    const payload = { user_id: user.id, name: form.name, icon: form.icon, date: form.date, time: form.time, repeats_yearly: form.repeats, units: form.units }
    if (editing) {
      const { data, error } = await supabase.from('events').update(payload).eq('id', editing).select().single()
      if (error) { show('Ошибка: ' + error.message); return }
      if (data) { setEvents(p => p.map(e => e.id === editing ? data : e)); show('Обновлено ✓') }
      setEditing(null)
    } else {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      if (error) { show('Ошибка сохранения: ' + error.message); return }
      if (data) { setEvents(p => [...p, data]); show('Событие добавлено ✓') }
    }
    resetForm(); setAdding(false)
  }

  const startEdit = (ev) => {
    setForm({ name: ev.name, icon: ev.icon || '📅', date: ev.date, time: ev.time || '00:00', repeats: ev.repeats_yearly, units: ev.units || ['years','months','days'] })
    setEditing(ev.id); setAdding(true)
  }

  const del = async (id) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents(p => p.filter(e => e.id !== id)); show('Удалено')
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">📅 События</h1>
        <button onClick={() => { resetForm(); setEditing(null); setAdding(!adding) }} className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl active:scale-95">{adding ? '✕' : '+'}</button>
      </div>

      {adding && (
        <div className="mb-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold text-zinc-400 mb-1">{editing ? 'Редактировать событие' : 'Новое событие'}</div>
          <div className="flex gap-2">
            <input value={form.icon} onChange={e => upd('icon', e.target.value)} className="inp text-center text-2xl" style={{width:56}} maxLength={4} placeholder="📅" />
            <input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Название события" className="inp flex-1" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><div className="text-xs text-zinc-500 mb-1">Дата</div><input type="date" value={form.date} onChange={e => upd('date', e.target.value)} className="inp w-full" /></div>
            <div><div className="text-xs text-zinc-500 mb-1">Время</div><TimeScroller hour={form.time.split(':')[0]} minute={form.time.split(':')[1]} onHour={h => upd('time', h + ':' + form.time.split(':')[1])} onMinute={m => upd('time', form.time.split(':')[0] + ':' + m)} /></div>
          </div>
          <button onClick={() => upd('repeats', !form.repeats)} className={`w-full p-3 rounded-xl border text-sm font-medium text-left ${form.repeats ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
            🔄 Повторяется каждый год {form.repeats ? '✓' : ''}
            <div className="text-xs mt-0.5 opacity-70">Дни рождения, годовщины</div>
          </button>
          <div>
            <div className="text-xs text-zinc-500 mb-1.5">Показывать:</div>
            <div className="flex flex-wrap gap-1.5">
              {UNIT_OPTS.map(u => (
                <button key={u.v} onClick={() => togUnit(u.v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${form.units.includes(u.v) ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500'}`}>{u.l}</button>
              ))}
            </div>
          </div>
          <button onClick={save} className="btn-primary bg-emerald-500 text-zinc-950 active:scale-[0.98]">{editing ? 'Сохранить' : 'Добавить'}</button>
        </div>
      )}

      {loading && <div className="text-center py-8 text-zinc-500">Загрузка...</div>}
      {!loading && events.length === 0 && <div className="text-center py-10 text-zinc-500"><div className="text-4xl mb-3">📅</div><div className="font-medium mb-1">Нет событий</div><div className="text-sm">Добавьте важные даты — свадьба,<br/>день рождения, бросил курить...</div></div>}

      <div className="space-y-3">
        {events.map(ev => {
          const { text, isPast } = calcDiff(ev)
          return (
            <div key={ev.id} className="rounded-2xl border border-zinc-800 overflow-hidden" style={{background: 'linear-gradient(135deg, #3730a315 0%, #1e1b4b10 100%)'}}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-base flex items-center gap-2">
                      {ev.icon} {ev.name}
                      {ev.repeats_yearly && <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">ежегодно</span>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{new Date(ev.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="text-3xl font-black tabular-nums" style={{color: isPast ? '#10b981' : '#f59e0b'}}>{text}</div>
                <div className="text-sm text-zinc-500 mt-0.5">{isPast ? '— прошло' : '— осталось'}</div>
              </div>
              <div className="flex border-t border-zinc-800/40">
                <button onClick={() => startEdit(ev)} className="flex-1 py-2.5 text-xs text-zinc-500 font-medium active:bg-zinc-800">✏️ Изменить</button>
                <button onClick={() => del(ev.id)} className="flex-1 py-2.5 text-xs text-rose-400 font-medium active:bg-zinc-800 border-l border-zinc-800/40">🗑 Удалить</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============ ВСЯ ИСТОРИЯ ============ */
function HistoryScr({ logs, habits, skips, onBack }) {
  const days = 7
  const now = new Date(); now.setHours(0,0,0,0)
  const allDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - i * 86400000)
    return { date: d.toISOString().slice(0,10), label: i === 0 ? 'Сегодня' : i === 1 ? 'Вчера' : d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' }) }
  })
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">📚 Вся история</h1></div>
      {allDays.map(({ date, label }) => {
        const dayLogs = logs.filter(l => new Date(l.ts).toISOString().slice(0,10) === date && !l.isSkip)
        const daySkips = skips.filter(s => s.date === date)
        if (!dayLogs.length && !daySkips.length) return null
        return (
          <div key={date} className="mb-4">
            <SH text={label} />
            <div className="space-y-1.5">
              {dayLogs.map(l => {
                const h = habits.find(x => x.id === l.habitId)
                return <div key={l.ts} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/40 flex items-center gap-3">
                  <span className="text-lg">{h?.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{l.habitName || h?.name || l.habitId}</div>
                    <div className="text-xs text-zinc-500 tabular-nums">{fmtV(l.value)} {l.habitUnit || h?.unit || ''}{l.note ? ` · ${l.note}` : ''}</div>
                  </div>
                  <div className="text-xs text-zinc-600">{new Date(l.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              })}
              {daySkips.map(s => {
                const h = habits.find(x => x.id === s.habitId)
                return <div key={s.ts || s.id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 flex items-center gap-3">
                  <span className="text-lg">{h?.icon || '❌'}</span>
                  <div className="flex-1"><div className="font-medium text-sm text-rose-400">{h?.name} — пропуск</div>{s.reason && <div className="text-xs text-zinc-500">{s.reason}</div>}</div>
                </div>
              })}
            </div>
          </div>
        )
      })}
      {logs.length === 0 && <div className="text-center py-8 text-zinc-500">Записей пока нет</div>}
    </div>
  )
}


/* ============ НАСТРОЙКИ ============ */
function SettingsScr({ onBack, theme, onToggleTheme }) {
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button>
        <h1 className="font-bold flex-1">⚙️ Настройки</h1>
      </div>
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">🌗 Тема оформления</div>
              <div className="text-sm text-zinc-500 mt-0.5">{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</div>
            </div>
            <button onClick={onToggleTheme} className={`w-14 h-7 rounded-full transition-all relative ${theme === 'light' ? 'bg-violet-500' : 'bg-zinc-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${theme === 'light' ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="font-semibold mb-1">🌍 Язык / Language</div>
          <div className="text-sm text-zinc-500">Русский · English — переключатель будет добавлен в следующем обновлении</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="font-semibold mb-1">📱 Установить приложение</div>
          <div className="text-sm text-zinc-400 leading-relaxed">
            <div className="mb-2 font-medium">iPhone (Safari):</div>
            <div className="text-zinc-500">Поделиться → На экран Домой → Добавить</div>
            <div className="mt-2 mb-1 font-medium">Android (Chrome):</div>
            <div className="text-zinc-500">⋮ → Добавить на главный экран → Добавить</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ FEEDBACK ============ */
function Feedback({ onBack, show, user }) {
  const [theme, setTheme] = useState('Предложение')
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [sending, setSending] = useState(false)
  const themes = ['Благодарность', 'Предложение', 'Ошибка', 'Сотрудничество']
  const send = async () => {
    if (!msg) return
    setSending(true)
    const ok = await db.sendFeedback(user?.id, theme, msg, email)
    setSending(false)
    if (ok) { show('Спасибо за обратную связь! 💌'); setMsg(''); }
    else show('Ошибка отправки, попробуйте позже')
  }
  return (
    <div className="max-w-md mx-auto px-4 pb-12">
      <div className="pt-5 pb-3 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95">←</button><h1 className="font-bold flex-1">💌 Обратная связь</h1></div>
      <div className="space-y-3">
        <Fld l="Тема"><div className="flex flex-wrap gap-1.5">{themes.map(t => <button key={t} onClick={() => setTheme(t)} className={`px-3 py-2.5 rounded-lg font-medium text-sm ${theme === t ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400'}`}>{t}</button>)}</div></Fld>
        <Fld l="Email для ответа"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="ваш@email.com" className="inp" type="email" /></Fld>
        <Fld l="Сообщение"><textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} className="inp resize-none" placeholder="Напишите здесь..." /></Fld>
        <button onClick={send} disabled={sending} className="btn-primary bg-violet-500 text-white active:scale-[0.98] disabled:opacity-50">{sending ? 'Отправляем...' : 'Отправить'}</button>
        <p className="text-sm text-zinc-500 text-center">Сообщение сохраняется в базе данных.<br/>Или напишите напрямую: <span className="text-violet-400">wildhabitsapp@gmail.com</span></p>
      </div>
    </div>
  )
}
