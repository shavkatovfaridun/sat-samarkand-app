import { createClient } from '@/lib/supabase/server'
import VocabQuiz from './VocabQuiz'

export default async function StudentVocabPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  const [{ data: words }, { data: progress }] = await Promise.all([
    supabase.from('vocab_words').select('id, word, definition, example, part_of_speech, difficulty').order('word'),
    student
      ? supabase.from('vocab_progress').select('word_id, correct_count, wrong_count, mastered').eq('student_id', student.id)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <VocabQuiz
      words={words ?? []}
      progress={progress ?? []}
      studentId={student?.id ?? ''}
    />
  )
}
