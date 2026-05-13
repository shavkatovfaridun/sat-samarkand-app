import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const STAGES = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']
const SOURCES = ['Instagram', 'Telegram', 'Referral', 'Walk-in', 'Website', 'Phone', 'Other']
const LANGUAGES = ['Uzbek', 'Russian', 'English']

async function updateLead(id: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('leads').update({
    name: formData.get('name') as string,
    phone: formData.get('phone') as string || null,
    stage: formData.get('stage') as string,
    temperature: formData.get('temperature') as string || null,
    source: formData.get('source') as string || null,
    language: formData.get('language') as string || null,
    grade: formData.get('grade') as string || null,
    school: formData.get('school') as string || null,
    current_score: formData.get('current_score') ? parseInt(formData.get('current_score') as string) : null,
    target_score: formData.get('target_score') ? parseInt(formData.get('target_score') as string) : null,
    notes: formData.get('notes') as string || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  redirect(`/admin/leads/${id}`)
}

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: lead } = await admin.from('leads').select('*').eq('id', params.id).single()
  if (!lead) notFound()

  const updateLeadWithId = updateLead.bind(null, params.id)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/leads/${params.id}`} className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← {lead.name}</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">Edit</span>
      </div>

      <form action={updateLeadWithId} className="space-y-4 max-w-lg">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Contact Info</p>
          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Full Name *</label>
            <input name="name" required defaultValue={lead.name}
              className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Phone</label>
            <input name="phone" type="tel" defaultValue={lead.phone ?? ''}
              className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Pipeline</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Stage</label>
              <select name="stage" defaultValue={lead.stage}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Temperature</label>
              <select name="temperature" defaultValue={lead.temperature ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="">—</option>
                <option value="HOT">🔥 Hot</option>
                <option value="WARM">🟡 Warm</option>
                <option value="COLD">❄️ Cold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Source</label>
              <select name="source" defaultValue={lead.source ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="">—</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Language</label>
              <select name="language" defaultValue={lead.language ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="">—</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Academic Info</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Current Score</label>
              <input name="current_score" type="number" min="400" max="1600" defaultValue={lead.current_score ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Target Score</label>
              <input name="target_score" type="number" min="400" max="1600" defaultValue={lead.target_score ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Grade</label>
              <input name="grade" defaultValue={lead.grade ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">School</label>
              <input name="school" defaultValue={lead.school ?? ''}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Notes</label>
          <textarea name="notes" rows={3} defaultValue={lead.notes ?? ''}
            className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] resize-none" />
        </div>

        <div className="flex gap-3">
          <Link href={`/admin/leads/${params.id}`}
            className="flex-1 text-center py-3 rounded-xl border border-[#E2E8F5] text-sm font-semibold text-[#6B7B9C]">
            Cancel
          </Link>
          <button type="submit"
            className="flex-1 bg-[#1B4FD8] text-white rounded-xl py-3 text-sm font-bold active:scale-95 transition-transform">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
