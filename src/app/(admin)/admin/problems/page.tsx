import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  easy:   { bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C' },
  medium: { bg: 'rgba(255,149,0,0.12)',  color: '#B86800' },
  hard:   { bg: 'rgba(255,59,48,0.12)',  color: '#C0281F' },
}

export default async function ProblemsPage({ searchParams }: { searchParams: { subject?: string; difficulty?: string } }) {
  const admin = createAdminClient()

  let query = admin
    .from('problems')
    .select('id, content, subject, topic, difficulty, correct_answer, created_at')
    .order('created_at', { ascending: false })

  if (searchParams.subject)    query = query.eq('subject', searchParams.subject)
  if (searchParams.difficulty) query = query.eq('difficulty', searchParams.difficulty)

  const { data: problems } = await query

  const { data: allProblems } = await admin.from('problems').select('subject, difficulty')
  const totalMath    = allProblems?.filter(p => p.subject === 'math').length ?? 0
  const totalEnglish = allProblems?.filter(p => p.subject === 'english').length ?? 0
  const totalEasy    = allProblems?.filter(p => p.difficulty === 'easy').length ?? 0
  const totalMed     = allProblems?.filter(p => p.difficulty === 'medium').length ?? 0
  const totalHard    = allProblems?.filter(p => p.difficulty === 'hard').length ?? 0

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Content</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Problem Bank</h1>
        </div>
        <Link href="/admin/problems/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Problem
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {[
          { label: 'Math',    value: totalMath,    color: '#1B4FD8', bg: 'rgba(27,79,216,0.08)' },
          { label: 'English', value: totalEnglish, color: '#AF52DE', bg: 'rgba(175,82,222,0.10)' },
          { label: 'Easy',    value: totalEasy,    color: '#1E8A3C', bg: 'rgba(52,199,89,0.10)' },
          { label: 'Medium',  value: totalMed,     color: '#B86800', bg: 'rgba(255,149,0,0.10)' },
          { label: 'Hard',    value: totalHard,    color: '#C0281F', bg: 'rgba(255,59,48,0.10)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[22px] font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { label: 'All',     href: '/admin/problems' },
          { label: 'Math',    href: '/admin/problems?subject=math' },
          { label: 'English', href: '/admin/problems?subject=english' },
          { label: 'Easy',    href: '/admin/problems?difficulty=easy' },
          { label: 'Medium',  href: '/admin/problems?difficulty=medium' },
          { label: 'Hard',    href: '/admin/problems?difficulty=hard' },
        ].map(f => {
          const active =
            f.href === '/admin/problems'
              ? !searchParams.subject && !searchParams.difficulty
              : f.href.includes('subject=math')    ? searchParams.subject    === 'math'
              : f.href.includes('subject=english') ? searchParams.subject    === 'english'
              : f.href.includes('difficulty=easy') ? searchParams.difficulty === 'easy'
              : f.href.includes('difficulty=medium') ? searchParams.difficulty === 'medium'
              : f.href.includes('difficulty=hard') ? searchParams.difficulty === 'hard'
              : false
          return (
            <Link key={f.href} href={f.href}
              className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
              style={{
                background: active ? '#1B4FD8' : 'white',
                color: active ? 'white' : 'rgba(60,60,67,0.55)',
                boxShadow: active ? '0 2px 8px rgba(27,79,216,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {!problems?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No problems yet</p>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(60,60,67,0.50)' }}>Add your first problem to the bank</p>
          <Link href="/admin/problems/new"
            className="inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-3 rounded-xl text-white"
            style={{ background: '#1B4FD8' }}>
            Add Problem
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {problems.map((p, i) => {
            const diff = DIFF_STYLE[p.difficulty] ?? DIFF_STYLE.medium
            return (
              <Link key={p.id} href={`/admin/problems/${p.id}/edit`}
                className="flex items-start gap-4 px-4 py-4 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Index */}
                <span className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5"
                  style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.45)' }}>
                  {i + 1}
                </span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#1C1C1E] leading-snug line-clamp-2">{p.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
                      style={{ background: p.subject === 'math' ? 'rgba(27,79,216,0.10)' : 'rgba(175,82,222,0.10)', color: p.subject === 'math' ? '#1B4FD8' : '#AF52DE' }}>
                      {p.subject}
                    </span>
                    {p.topic && (
                      <span className="text-[11px] capitalize" style={{ color: 'rgba(60,60,67,0.45)' }}>{p.topic}</span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: diff.bg, color: diff.color }}>
                      {p.difficulty}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(52,199,89,0.10)', color: '#1E8A3C' }}>
                      ✓ {p.correct_answer?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0 mt-1"
                  style={{ color: 'rgba(60,60,67,0.22)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
