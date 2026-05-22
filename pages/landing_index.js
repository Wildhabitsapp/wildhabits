import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

const T = {
  ru: {
    title: 'WildHabits — Трекер привычек и лайфстайл-помощник',
    desc: 'Одно приложение вместо пяти. Привычки, рефлексия, идеи, события, мотивация — всё в одном месте.',
    hero: 'Дикие привычки,\nдикие результаты',
    heroSub: 'Одно приложение вместо пяти. Трекер привычек, рефлексия, идеи и многое другое — в одном удобном месте на телефоне.',
    cta: 'Войти в приложение',
    features: 'Что умеет WildHabits',
    featureList: [
      { icon: '✅', title: 'Трекер привычек', desc: '24 привычки по умолчанию + создавайте свои. Спорт, сон, вода, медитация, БАД и многое другое.' },
      { icon: '📝', title: 'Рефлексия', desc: 'Задачи дня, благодарности, достижения. Настройте под себя.' },
      { icon: '💡', title: 'Идеи', desc: 'Записывайте идеи на ходу с категориями и приоритетами.' },
      { icon: '📅', title: 'События', desc: 'Отслеживайте важные даты — сколько прошло и сколько осталось.' },
      { icon: '📊', title: 'Статистика', desc: 'Графики, тепловые карты, серии без пропусков.' },
      { icon: '🏆', title: 'Геймификация', desc: 'Уровни, XP и ачивки — делать привычки интереснее.' },
    ],
    howTitle: 'Как добавить на телефон',
    iosTitle: '📱 iPhone (iOS)',
    iosSteps: ['Откройте wildhabits.ru в Safari', 'Нажмите кнопку «Поделиться» (квадрат со стрелкой)', 'Выберите «На экран Домой»', 'Нажмите «Добавить»'],
    androidTitle: '🤖 Android',
    androidSteps: ['Откройте wildhabits.ru в Chrome', 'Нажмите три точки (⋮) в правом верхнем углу', 'Выберите «Добавить на главный экран»', 'Нажмите «Добавить»'],
    authorTitle: 'Об авторе',
    authorText: 'Меня зовут Колесников Дмитрий. Я предприниматель. В день много задач по бизнесу, а на проект «Жизнь» иногда нет времени. Мне захотелось, чтобы у меня был трекер привычек и помощник по лайфстайлу в одном удобном месте. У меня было на телефоне 5 разных приложений, и они выполняли каждое свою цель. Я решил сделать удобное для себя приложение, чтобы оно отвечало всем моим требованиям. Теперь вместо 5 приложений у меня одно, и оно умеет многое. Я стал более дисциплинированным.',
    authorLink: 'Сайт автора: diko.pro',
    footer: '© 2026 WildHabits · Создано с ❤️ Колесниковым Дмитрием',
  },
  en: {
    title: 'WildHabits — Habit Tracker & Lifestyle Assistant',
    desc: 'One app instead of five. Habits, reflection, ideas, events, motivation — all in one place.',
    hero: 'Wild habits,\nwild results',
    heroSub: 'One app instead of five. Habit tracker, daily reflection, ideas and more — all in one convenient place on your phone.',
    cta: 'Open App',
    features: 'What WildHabits can do',
    featureList: [
      { icon: '✅', title: 'Habit Tracker', desc: '24 default habits + create your own. Sport, sleep, water, meditation and more.' },
      { icon: '📝', title: 'Reflection', desc: "Daily tasks, gratitude, achievements. Customize to your needs." },
      { icon: '💡', title: 'Ideas', desc: 'Capture ideas on the go with categories and priorities.' },
      { icon: '📅', title: 'Events', desc: 'Track important dates — how much time has passed or remains.' },
      { icon: '📊', title: 'Statistics', desc: 'Charts, heatmaps, streaks.' },
      { icon: '🏆', title: 'Gamification', desc: 'Levels, XP and achievements — make habits more fun.' },
    ],
    howTitle: 'How to install on your phone',
    iosTitle: '📱 iPhone (iOS)',
    iosSteps: ['Open wildhabits.ru in Safari', 'Tap the Share button (square with arrow)', 'Select "Add to Home Screen"', 'Tap "Add"'],
    androidTitle: '🤖 Android',
    androidSteps: ['Open wildhabits.ru in Chrome', 'Tap three dots (⋮) in top right corner', 'Select "Add to Home Screen"', 'Tap "Add"'],
    authorTitle: 'About the Author',
    authorText: 'My name is Dmitrii Kolesnikov. I am an entrepreneur. Every day is packed with business tasks, and there is often no time for the "Life" project. I wanted a habit tracker and lifestyle assistant all in one convenient place. I had 5 different apps on my phone, each serving its own purpose. I decided to build one app that meets all my requirements. Now instead of 5 apps I have one — and it does a lot. I became more disciplined.',
    authorLink: 'Author\'s website: diko.pro',
    footer: '© 2026 WildHabits · Made with ❤️ by Dmitrii Kolesnikov',
  }
}

export default function Landing() {
  const [lang, setLang] = useState('ru')
  const router = useRouter()
  const t = T[lang]

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.desc} />
        <meta property="og:image" content="https://wildhabits.ru/icon-512.png" />
        <meta property="og:url" content="https://wildhabits.ru" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://wildhabits.ru" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "WildHabits",
          "description": T.ru.desc,
          "applicationCategory": "LifestyleApplication",
          "operatingSystem": "iOS, Android, Web",
          "author": { "@type": "Person", "name": "Колесников Дмитрий", "url": "https://diko.pro" },
          "url": "https://wildhabits.ru",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" }
        })}} />
      </Head>

      <div style={{ fontFamily: "'Montserrat', system-ui, sans-serif", background: '#09090b', color: '#fafafa', minHeight: '100vh' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

        {/* Хедер */}
        <header style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, background: '#09090b', zIndex: 10 }}>
          <img src="/logo.png" alt="WildHabits" style={{ height: 32, width: 'auto' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} style={{ padding: '6px 14px', borderRadius: 10, background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{lang === 'ru' ? 'EN' : 'RU'}</button>
            <button onClick={() => router.push('/app')} style={{ padding: '8px 20px', borderRadius: 12, background: '#7c3aed', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>{t.cta}</button>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <img src="/logo.png" alt="WH" style={{ height: 72, width: 'auto', marginBottom: 24 }} />
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20, whiteSpace: 'pre-line' }}>{t.hero}</h1>
          <p style={{ fontSize: 'clamp(15px, 4vw, 18px)', color: '#a1a1aa', lineHeight: 1.7, marginBottom: 36 }}>{t.heroSub}</p>
          <button onClick={() => router.push('/app')} style={{ padding: '18px 48px', borderRadius: 16, background: '#7c3aed', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 18, display: 'inline-block' }}>{t.cta} →</button>
        </section>

        {/* Функции */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, marginBottom: 32 }}>{t.features}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {t.featureList.map((f, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 16, background: '#18181b', border: '1px solid #27272a' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Как установить */}
        <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, marginBottom: 32 }}>{t.howTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[{ title: t.iosTitle, steps: t.iosSteps }, { title: t.androidTitle, steps: t.androidSteps }].map((os, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 16, background: '#18181b', border: '1px solid #27272a' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{os.title}</div>
                {os.steps.map((step, j) => (
                  <div key={j} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{j + 1}</div>
                    <div style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Об авторе */}
        <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, marginBottom: 32 }}>{t.authorTitle}</h2>
          <div style={{ padding: 32, borderRadius: 20, background: '#18181b', border: '1px solid #27272a', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>👨‍💼</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Колесников Дмитрий</div>
            <a href="https://diko.pro" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontSize: 14 }}>diko.pro</a>
            <p style={{ marginTop: 20, color: '#a1a1aa', lineHeight: 1.8, fontSize: 15 }}>{t.authorText}</p>
          </div>
        </section>

        {/* CTA финальный */}
        <section style={{ textAlign: 'center', padding: '0 24px 80px' }}>
          <button onClick={() => router.push('/app')} style={{ padding: '18px 48px', borderRadius: 16, background: '#7c3aed', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>{t.cta} →</button>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #27272a', padding: '24px', textAlign: 'center', color: '#52525b', fontSize: 13 }}>
          {t.footer}
        </footer>
      </div>
    </>
  )
}
