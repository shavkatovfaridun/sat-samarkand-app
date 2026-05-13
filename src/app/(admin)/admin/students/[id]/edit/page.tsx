import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

async function updateStudent(id: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('students').update({
    name:                formData.get('name') as string,
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
  }).eq('id', id)
  redirect(`/admin/students/${id}`)
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const supabase = createClient()

  const { data: student } = await admin.from('students').select('*').eq('id', params.id).single()
  if (!student) notFound()

  const [{ data: groups }, { data: teachers }] = await Promise.all([
    supabase.from('groups').select('id, name, subject').eq('status', 'active').order('name'),
    supabase.from('users').select('telegram_id, name').eq('role', 'teacher').order('name'),
  ])

  const updateWithId = updateStudent.bind(null, params.id)

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href={`/admin/students/${params.id}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {student.name}
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Edit Student</h1>
      </div>

      <form action={updateWithId} className="space-y-4">
        {/* Identity */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Identity</p>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Full Name *</label>
            <input name="name" required defaultValue={student.name} className={INPUT} style={INPUT_STYLE} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Telegram ID</label>
              <input name="telegram_id" type="number" defaultValue={student.telegram_id ?? ''} placeholder="e.g. 123456789" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Parent Telegram ID</label>
              <input name="parent_telegram_id" type="number" defaultValue={student.parent_telegram_id ?? ''} className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Enrollment */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Enrollment</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Subject *</label>
              <select name="subject" required defaultValue={student.subject} className={INPUT} style={INPUT_STYLE}>
                <option value="math">Math only</option>
                <option value="english">English only</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Type *</label>
              <select name="type" required defaultValue={student.type} className={INPUT} style={INPUT_STYLE}>
                <option value="group">Group</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Phase *</label>
              <select name="phase" required defaultValue={student.phase} className={INPUT} style={INPUT_STYLE}>
                <option value="intensive">Intensive (Phase 1)</option>
                <option value="examPrep">Exam Prep (Phase 2)</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Group</label>
              <select name="group_id" defaultValue={student.group_id ?? ''} className={INPUT} style={INPUT_STYLE}>
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
              <input name="exam_date" type="date" defaultValue={student.exam_date ?? ''} className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Target Score</label>
              <input name="target_score" type="number" min="400" max="1600" defaultValue={student.target_score ?? ''} placeholder="e.g. 1400" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Fees & Teachers</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Fee — Math (UZS)</label>
              <input name="monthly_fee_math" type="number" defaultValue={student.monthly_fee_math ?? ''} placeholder="e.g. 800000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Fee — English (UZS)</label>
              <input name="monthly_fee_english" type="number" defaultValue={student.monthly_fee_english ?? ''} placeholder="e.g. 800000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Math Teacher</label>
              <select name="teacher_math_id" defaultValue={student.teacher_math_id ?? ''} className={INPUT} style={INPUT_STYLE}>
                <option value="">— None —</option>
                {teachers?.map(t => <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>English Teacher</label>
              <select name="teacher_english_id" defaultValue={student.teacher_english_id ?? ''} className={INPUT} style={INPUT_STYLE}>
                <option value="">— None —</option>
                {teachers?.map(t => <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className={`${LABEL} mb-2`} style={LABEL_STYLE}>Notes</label>
          <textarea name="notes" rows={3} defaultValue={student.notes ?? ''}
            className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href={`/admin/students/${params.id}`}
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
