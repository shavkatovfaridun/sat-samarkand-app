-- Vocab words table
CREATE TABLE IF NOT EXISTS vocab_words (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  word           text        NOT NULL,
  definition     text        NOT NULL,
  example        text,
  part_of_speech text,                         -- noun, verb, adjective, adverb, etc.
  difficulty     text        DEFAULT 'medium', -- easy | medium | hard
  subject        text        DEFAULT 'english',
  created_at     timestamptz DEFAULT now()
);

-- Per-student vocab progress
CREATE TABLE IF NOT EXISTS vocab_progress (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid        REFERENCES students(id)    ON DELETE CASCADE,
  word_id       uuid        REFERENCES vocab_words(id) ON DELETE CASCADE,
  correct_count int         DEFAULT 0,
  wrong_count   int         DEFAULT 0,
  last_seen     timestamptz,
  mastered      boolean     DEFAULT false,
  UNIQUE(student_id, word_id)
);

-- Seed a handful of SAT vocab words
INSERT INTO vocab_words (word, definition, example, part_of_speech, difficulty) VALUES
  ('Aberrant',    'Departing from an accepted standard; abnormal',                'The scientist noted the aberrant behavior of the specimen.', 'adjective', 'hard'),
  ('Benevolent',  'Well-meaning and kindly',                                       'The benevolent teacher stayed late to help struggling students.', 'adjective', 'medium'),
  ('Cacophony',   'A harsh, discordant mixture of sounds',                        'The cacophony of car horns filled the busy street.', 'noun', 'hard'),
  ('Diligent',    'Having or showing care and conscientious effort',              'She was diligent in her SAT preparation, studying every day.', 'adjective', 'easy'),
  ('Eloquent',    'Fluent or persuasive in speaking or writing',                  'His eloquent speech moved the entire audience.', 'adjective', 'medium'),
  ('Frivolous',   'Not having any serious purpose or value',                      'The judge dismissed the frivolous lawsuit.', 'adjective', 'medium'),
  ('Gregarious',  'Fond of company; sociable',                                    'The gregarious student quickly made friends in her new school.', 'adjective', 'hard'),
  ('Hackneyed',   'Lacking originality; overused',                               'The essay was full of hackneyed phrases.', 'adjective', 'hard'),
  ('Innate',      'Inborn; natural',                                              'She had an innate talent for mathematics.', 'adjective', 'medium'),
  ('Judicious',   'Having or showing good judgment',                              'A judicious choice of words can defuse any argument.', 'adjective', 'hard'),
  ('Kindle',      'To arouse or inspire a feeling or emotion',                    'The teacher tried to kindle a love of reading in her students.', 'verb', 'easy'),
  ('Lament',      'To express passionate grief or sorrow',                        'She lamented the loss of her favorite book.', 'verb', 'easy'),
  ('Meticulous',  'Showing great attention to detail or exact procedures',        'The meticulous student checked every answer twice.', 'adjective', 'medium'),
  ('Nonchalant',  'Feeling or appearing casually calm and relaxed',               'He was nonchalant about his perfect score on the exam.', 'adjective', 'hard'),
  ('Obscure',     'Not discovered or known about; uncertain',                     'The professor referenced an obscure 19th-century text.', 'adjective', 'medium'),
  ('Pragmatic',   'Dealing with things sensibly and realistically',               'A pragmatic approach to studying involves regular breaks.', 'adjective', 'medium'),
  ('Quell',       'Put an end to; calm or suppress',                              'The teacher quelled the classroom noise with a single look.', 'verb', 'hard'),
  ('Resilient',   'Able to recover quickly from difficult conditions',            'Resilient students bounce back from a poor test score.', 'adjective', 'easy'),
  ('Subtle',      'So delicate or precise as to be difficult to analyse',        'The difference between the two definitions was subtle.', 'adjective', 'medium'),
  ('Tenacious',   'Tending to keep a firm hold; persistent',                     'Her tenacious study habits led to a 200-point improvement.', 'adjective', 'medium')
ON CONFLICT DO NOTHING;
