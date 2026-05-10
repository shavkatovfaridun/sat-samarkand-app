import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewStudentPage() {
  const supabase = createClient()

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject')
    .eq('status', 'active')
    .order('name')

  const { data: teachers } = await supabase
    .from('users')
    .select('telegram_id, name')
    .eq('role', 'teacher')
    .order('name')

  async function createStudent(formData: FormData) {
    'use server'

    const admin = (await import('@/lib/supabase/admin')).createAdminClient()

    const telegram_id = formData.get('telegram_id')
    const name = formData.get('name') as string
    const subject = formData.get('subject') as string
    const type = formData.get('type') as string
    const group_id = formData.get('group_id') as string || null
    const phase = formData.get('phase') as string
    const exam_date = formData.get('exam_date') as string || null
    const target_score = formData.get('target_score') ? parseInt(formData.get('target_score') as string) : null
    const monthly_fee_math = formData.get('monthly_fee_math') ? parseInt(formData.get('monthly_fee_math') as string) : 0
    const monthly_fee_english = formData.get('monthly_fee_english') ? parseInt(formData.get('monthly_fee_english') as string) : 0
    const teacher_math_id = formData.get('teacher_math_id') ? parseInt(formData.get('teacher_math_id') as string) : null
    const teacher_english_id = formData.get('teacher_english_id') ? parseInt(formData.get('teacher_english_id') as string) : null
    const parent_telegram_id = formData.get('parent_telegram_id') ? parseInt(formData.get('parent_telegram_id') as string) : null
    const notes = formData.get('notes') as string || null

    const { error } = await admin.from('students').insert({
      telegram_id: telegram_id ? parseInt(telegram_id as string) : null,
      name,
      subject,
      type,
      group_id,
      phase,
      exam_date,
      target_score,
      monthly_fee_math,
      monthly_fee_english,
      teacher_math_id,
      teacher_english_id,
      parent_telegram_id,
      notes,
    })

    if (error) throw new Error(error.message)

    redirect('/admin/students')
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Add Student</h1>

      <form action={createStudent} className="space-y-4 bg-white rounded-xl p-6 border border-gray-100">
        <Field label="Full Name *" name="name" required />
        <Field label="Telegram ID" name="telegram_id" type="number" placeholder="e.g. 123456789" />
        <Field label="Parent Telegram ID" name="parent_telegram_id" type="number" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <select name="subject" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="math">Math only</option>
            <option value="english">English only</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select name="type" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="group">Group</option>
            <option value="individual">Individual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group (if group student)</label>
          <select name="group_id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">— None —</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phase *</label>
          <select name="phase" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="intensive">Intensive (Phase 1)</option>
            <option value="examPrep">Exam Prep (Phase 2)</option>
          </select>
        </div>

        <Field label="SAT Exam Date" name="exam_date" type="date" />
        <Field label="Target Score" name="target_score" type="number" placeholder="e.g. 1400" />
        <Field label="Monthly Fee — Math (UZS)" name="monthly_fee_math" type="number" placeholder="e.g. 800000" />
        <Field label="Monthly Fee — English (UZS)" name="monthly_fee_english" type="number" placeholder="e.g. 800000" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Math Teacher</label>
          <select name="teacher_math_id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">— None —</option>
            {teachers?.map((t) => (
              <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">English Teacher</label>
          <select name="teacher_english_id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">— None —</option>
            {teachers?.map((t) => (
              <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium"
        >
          Add Student
        </button>
      </form>
    </div>
  )
}

function Field({ label, name, type = 'text', required = false, placeholder = '' }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  )
}
