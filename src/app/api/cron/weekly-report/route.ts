import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'
import { formatUZS } from '@/lib/format'

// Called every Sunday at 18:00 Tashkent time (13:00 UTC) — see vercel.json
// Sends a weekly progress report to each active student's parent

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Window: last 7 days
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)

  // Fetch all active students with parent telegram IDs
  const { data: students } = await admin
    .from('students')
    .select('id, name, subject, current_score, target_score, exam_date, parent_telegram_id, telegram_id, group_id')
    .eq('status', 'active')
    .not('parent_telegram_id', 'is', null)

  if (!students?.length) return NextResponse.json({ ok: true, sent: 0 })

  const studentIds = students.map(s => s.id)

  // Fetch all data in parallel
  const [
    { data: attendance },
    { data: submissions },
    { data: payments },
  ] = await Promise.all([
    admin.from('attendance')
      .select('student_id, status, class_date')
      .in('student_id', studentIds)
      .gte('class_date', weekAgoStr)
      .lte('class_date', todayStr),
    admin.from('submissions')
      .select('student_id, score, total, submitted_at')
      .in('student_id', studentIds)
      .gte('submitted_at', weekAgo.toISOString()),
    admin.from('payments')
      .select('student_id, status, net_amount, month, due_date')
      .in('student_id', studentIds)
      .in('status', ['unpaid', 'overdue', 'paid'])
      .order('due_date', { ascending: false }),
  ])

  let sent = 0

  for (const student of students) {
    if (!student.parent_telegram_id) continue

    // Attendance this week
    const studentAtt = attendance?.filter(a => a.student_id === student.id) ?? []
    const totalClasses = studentAtt.length
    const presentCount = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length
    const absentCount  = studentAtt.filter(a => a.status === 'absent').length
    const attRate      = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : null

    // Homework this week
    const studentSubs = submissions?.filter(s => s.student_id === student.id) ?? []
    const hwDone     = studentSubs.length
    const hwAvgScore = hwDone > 0
      ? Math.round(studentSubs.reduce((acc, s) => acc + (s.total > 0 ? (s.score / s.total) * 100 : 0), 0) / hwDone)
      : null

    // Latest payment
    const latestPayment = payments?.find(p => p.student_id === student.id)

    // Exam countdown
    const examCountdown = student.exam_date
      ? Math.max(0, Math.ceil((new Date(student.exam_date).getTime() - Date.now()) / 86400000))
      : null

    // Build message
    const lines: string[] = []
    lines.push(`📊 <b>Weekly Report — ${student.name}</b>`)
    lines.push(`Week of ${weekAgoStr} → ${todayStr}\n`)

    // Attendance
    if (totalClasses > 0) {
      const attEmoji = attRate !== null && attRate >= 80 ? '✅' : attRate !== null && attRate >= 60 ? '⚠️' : '❌'
      lines.push(`${attEmoji} <b>Attendance:</b> ${presentCount}/${totalClasses} classes (${attRate}%)`)
      if (absentCount > 0) lines.push(`   └ ${absentCount} absence${absentCount > 1 ? 's' : ''} this week`)
    } else {
      lines.push(`📅 <b>Attendance:</b> No classes this week`)
    }

    // Score
    if (student.current_score) {
      const gap = student.target_score ? student.target_score - student.current_score : null
      lines.push(`\n📈 <b>SAT Score:</b> ${student.current_score}${student.target_score ? ` / ${student.target_score} target` : ''}`)
      if (gap !== null && gap > 0) lines.push(`   └ +${gap} points to goal`)
    }

    // Homework
    if (hwDone > 0) {
      const hwEmoji = hwAvgScore !== null && hwAvgScore >= 70 ? '✅' : '📝'
      lines.push(`\n${hwEmoji} <b>Homework:</b> ${hwDone} assignment${hwDone > 1 ? 's' : ''} submitted`)
      if (hwAvgScore !== null) lines.push(`   └ Average score: ${hwAvgScore}%`)
    }

    // Payment
    if (latestPayment) {
      if (latestPayment.status === 'overdue') {
        lines.push(`\n⚠️ <b>Payment:</b> OVERDUE — ${formatUZS(latestPayment.net_amount)} (${latestPayment.month})`)
      } else if (latestPayment.status === 'unpaid') {
        lines.push(`\n💳 <b>Payment:</b> Due — ${formatUZS(latestPayment.net_amount)} (${latestPayment.month})`)
      } else {
        lines.push(`\n✅ <b>Payment:</b> Paid — ${latestPayment.month}`)
      }
    }

    // Exam countdown
    if (examCountdown !== null) {
      lines.push(`\n🎯 <b>Exam in:</b> ${examCountdown} days (${student.exam_date})`)
    }

    lines.push(`\n📚 <i>SAT Samarkand — have a great week!</i>`)

    const msg = lines.join('\n')

    try {
      await sendTelegramMessage(student.parent_telegram_id, msg)
      // Also send to student if they have a telegram ID
      if (student.telegram_id) {
        await sendTelegramMessage(student.telegram_id, msg)
      }
      sent++
    } catch {
      // Skip failed sends
    }
  }

  return NextResponse.json({ ok: true, sent })
}
