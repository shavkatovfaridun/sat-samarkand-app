import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function createStudent(formData: FormData) {
  'use server'
  const admin  = (await import('@/lib/supabase/admin')).createAdminClient()
  const leadId = formData.get('lead_id') as string | null

  const { error, data } = await admin.from('students').insert({
    name:                formData.get('name')               as string,
    telegram_id:         formData.get('telegram_id')         ? parseInt(formData.get('telegram_id')         as string) : null,
    parent_telegram_id:  formData.get('parent_telegram_id')  ? parseInt(formData.get('parent_telegram_id')  as string) : null,
    subject:             formData.get('subject')              as string,
    type:                formData.get('type')                 as string,
    phase:               formData.get('phase')               as string,
    group_id:            (formData.get('group_id') as string) || null,
    exam_date:           (formData.get('exam_date') as string) || null,
    target_score:        formData.get('target_score')        ? parseInt(formData.get('target_score')        as string) : null,
    monthly_fee_math:    formData.get('monthly_fee_math')    ? parseInt(formData.get('monthly_fee_math')    as string) : 0,
    monthly_fee_english: formData.get('monthly_fee_english') ? parseInt(formData.get('monthly_fee_english') as string) : 0,
    teacher_math_id:     formData.get('teacher_math_id')     ? parseInt(formData.get('teacher_math_id')     as string) : null,
    teacher_english_id:  formData.get('teacher_english_id')  ? parseInt(formData.get('teacher_english_id')  as string) : null,
    notes:               (formData.get('notes') as string)   || null,
  }).select('id').single()

  if (error) throw new Error(error.message)

  // If converted from a lead — mark it ENROLLED
  if (leadId) {
    await admin.from('leads').update({ stage: 'ENROLLED' }).eq('id', leadId)
    await admin.from('interactions').insert({
      lead_id: leadId,
      type: 'note',
      content: `Converted to student (ID: ${data?.id})`,
    })
    redirect(`/admin/leads/${leadId}`)
  }

  redirect('/admin/students')
}

const INPUT       = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL       = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: { from_lead?: string; name?: string; phone?: string }
}) {
  const supabase = createClient()
  const isFromLead = !!searchParams.from_lead

  const [{ data: groups }, { data: teachers }] = await Promise.all([
    supabase.from('groups').select('id, name, subject').eq('status', 'active').order('name'),
    supabase.from('users').select('telegram_id, name').eq('role', 'teacher').order('name'),
  ])

  const backHref = isFromLead ? `/admin/leads/${searchParams.from_lead}` : '/admin/students'
  const backLabel = isFromLead ? 'Lead' : 'Students'

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href={backHref}
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {backLabel}
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>
          {isFromLead ? 'Convert to Student' : 'Add Student'}
        </h1>
      </div>

      {/* Lead conversion banner */}
      {isFromLead && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.20)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(52,199,89,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: '#34C759' }}>
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-[13px] font-medium" style={{ color: '#1E8A3C' }}>
            Submitting will mark this lead as <strong>Enrolled</strong> automatically.
          </p>
        </div>
      )}

      <form action={createStudent} className="space-y-4">
        {/* Hidden lead_id if converting */}
        {isFromLead && <input type="hidden" name="lead_id" value={searchParams.from_lead} />}

        {/* Identity */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Identity</p>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Full Name *</label>
            <input name="name" required defaultValue={searchParams.name ?? ''}
              placeholder="e.g. Amir Karimov" className={INPUT} style={INPUT_STYLE} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Telegram ID</label>
              <input name="telegram_id" type="number" placeholder="e.g. 123456789" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Parent Telegram ID</label>
              <input name="parent_telegram_id" type="number" placeholder="Parent's TG ID" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Enrollment */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Enrollment</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Subject *</label>
              <select name="subject" required className={INPUT} style={INPUT_STYLE}>
                <option value="math">Math only</option>
                <option value="english">English only</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Type *</label>
              <select name="type" required className={INPUT} style={INPUT_STYLE}>
                <option value="group">Group</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Phase *</label>
              <select name="phase" required className={INPUT} style={INPUT_STYLE}>
                <option value="intensive">Intensive (Phase 1)</option>
                <option value="examPrep">Exam Prep (Phase 2)</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Group</label>
              <select name="group_id" className={INPUT} style={INPUT_STYLE}>
                <option value="">— None —</option>
                {groups?.map(g => <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Academic */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Academic</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>SAT Exam Date</label>
              <input name="exam_date" type="date" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Target Score</label>
              <input name="target_score" type="number" min="400" max="1600" placeholder="e.g. 1400" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Fees & Teachers */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Fees & Teachers</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Fee — Math (UZS)</label>
              <input name="monthly_fee_math" type="number" placeholder="e.g. 800000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Fee — English (UZS)</label>
              <input name="monthly_fee_english" type="number" placeholder="e.g. 800000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Math Teacher</label>
              <select name="teacher_math_id" className={INPUT} style={INPUT_STYLE}>
                <option value="">— None —</option>
                {teachers?.map(t => <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>English Teacher</label>
              <select name="teacher_english_id" className={INPUT} style={INPUT_STYLE}>
                <option value="">— None —</option>
                {teachers?.map(t => <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className={`${LABEL} mb-2`} style={LABEL_STYLE}>Notes</label>
          <textarea name="notes" rows={3} placeholder="Any notes about this student…"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href={backHref}
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: isFromLead ? '#34C759' : '#1B4FD8' }}>
            {isFromLead ? 'Enroll Student ✓' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  )
}
