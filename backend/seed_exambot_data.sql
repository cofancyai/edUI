-- Seed data for ExamBot Question Bank
-- Insert sample exam structure and questions

-- Insert Exams
INSERT INTO exams (code, name, icon, description) VALUES
('upsc', 'UPSC CSE', '🏛️', 'Union Public Service Commission - Civil Services Examination'),
('ssc', 'SSC CGL/CHSL', '📝', 'Staff Selection Commission - Combined Graduate Level & Combined Higher Secondary Level'),
('banking', 'Banking (IBPS/SBI)', '🏦', 'Institute of Banking Personnel Selection & State Bank of India exams');

-- Insert Subjects for UPSC
INSERT INTO subjects (exam_id, code, name, icon, display_order) VALUES
((SELECT id FROM exams WHERE code = 'upsc'), 'history', 'History', '📜', 1),
((SELECT id FROM exams WHERE code = 'upsc'), 'geography', 'Geography', '🌍', 2),
((SELECT id FROM exams WHERE code = 'upsc'), 'polity', 'Polity', '⚖️', 3),
((SELECT id FROM exams WHERE code = 'upsc'), 'economy', 'Economy', '💰', 4),
((SELECT id FROM exams WHERE code = 'upsc'), 'science', 'Science & Tech', '🔬', 5),
((SELECT id FROM exams WHERE code = 'upsc'), 'environment', 'Environment', '🌱', 6);

-- Insert Subjects for SSC
INSERT INTO subjects (exam_id, code, name, icon, display_order) VALUES
((SELECT id FROM exams WHERE code = 'ssc'), 'reasoning', 'Reasoning', '🧠', 1),
((SELECT id FROM exams WHERE code = 'ssc'), 'quantitative', 'Quantitative Aptitude', '🔢', 2),
((SELECT id FROM exams WHERE code = 'ssc'), 'english', 'English', '📖', 3),
((SELECT id FROM exams WHERE code = 'ssc'), 'gk', 'General Awareness', '💡', 4);

-- Insert Subjects for Banking
INSERT INTO subjects (exam_id, code, name, icon, display_order) VALUES
((SELECT id FROM exams WHERE code = 'banking'), 'reasoning', 'Reasoning Ability', '🧠', 1),
((SELECT id FROM exams WHERE code = 'banking'), 'quantitative', 'Quantitative Aptitude', '🔢', 2),
((SELECT id FROM exams WHERE code = 'banking'), 'english', 'English Language', '📖', 3),
((SELECT id FROM exams WHERE code = 'banking'), 'banking_awareness', 'Banking Awareness', '💳', 4),
((SELECT id FROM exams WHERE code = 'banking'), 'computer', 'Computer Knowledge', '💻', 5);

-- Insert Chapters for UPSC History
INSERT INTO chapters (subject_id, code, name, display_order) VALUES
((SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'ancient_india', 'Ancient India', 1),
((SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'medieval_india', 'Medieval India', 2),
((SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'modern_india', 'Modern India', 3),
((SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'world_history', 'World History', 4);

-- Insert Chapters for UPSC Geography
INSERT INTO chapters (subject_id, code, name, display_order) VALUES
((SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'physical', 'Physical Geography', 1),
((SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'human', 'Human Geography', 2),
((SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'indian', 'Indian Geography', 3),
((SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')), 'world', 'World Geography', 4);

-- Insert sample questions for UPSC History - Ancient India
INSERT INTO questions (exam_id, subject_id, chapter_id, question, options, correct_answer, explanation, difficulty, year) VALUES
(
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'ancient_india'),
  'The Indus Valley Civilization belonged to which age?',
  '{"A": "Paleolithic Age", "B": "Mesolithic Age", "C": "Bronze Age", "D": "Iron Age"}',
  'C',
  'The Indus Valley Civilization flourished during the Bronze Age (c. 3300-1300 BCE). They used bronze tools and weapons extensively.',
  'easy',
  2023
),
(
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'ancient_india'),
  'Which of the following Vedas contains hymns about creation of the universe?',
  '{"A": "Rig Veda", "B": "Sama Veda", "C": "Yajur Veda", "D": "Atharva Veda"}',
  'A',
  'The Rig Veda, the oldest of the four Vedas, contains the Nasadiya Sukta (Hymn of Creation) which discusses the origin of the universe.',
  'medium',
  2022
),
(
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'ancient_india'),
  'The concept of Anuvrata was advocated by which of the following religions?',
  '{"A": "Buddhism", "B": "Jainism", "C": "Hinduism", "D": "Zoroastrianism"}',
  'B',
  'Anuvrata (minor vows) is a concept in Jainism meant for laypeople, as opposed to Mahavrata (great vows) meant for monks and nuns.',
  'hard',
  2021
);

-- Insert sample questions for UPSC Geography - Physical Geography
INSERT INTO questions (exam_id, subject_id, chapter_id, question, options, correct_answer, explanation, difficulty, year) VALUES
(
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'physical'),
  'Which layer of the atmosphere contains the ozone layer?',
  '{"A": "Troposphere", "B": "Stratosphere", "C": "Mesosphere", "D": "Thermosphere"}',
  'B',
  'The ozone layer is located in the stratosphere, approximately 15-35 km above Earth''s surface, protecting us from harmful UV radiation.',
  'easy',
  2023
),
(
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'geography' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'physical'),
  'Which type of rocks are formed by the cooling and solidification of magma?',
  '{"A": "Sedimentary rocks", "B": "Metamorphic rocks", "C": "Igneous rocks", "D": "Crystalline rocks"}',
  'C',
  'Igneous rocks are formed when molten rock (magma or lava) cools and solidifies. Examples include granite and basalt.',
  'medium',
  2022
);

-- Insert sample questions for SSC Reasoning
INSERT INTO questions (exam_id, subject_id, chapter_id, question, options, correct_answer, explanation, difficulty) VALUES
(
  (SELECT id FROM exams WHERE code = 'ssc'),
  (SELECT id FROM subjects WHERE code = 'reasoning' AND exam_id = (SELECT id FROM exams WHERE code = 'ssc')),
  NULL,
  'If DELHI is coded as 73541 and CALCUTTA as 82589662, then how can CALICUT be coded?',
  '{"A": "5279431", "B": "5978213", "C": "8251896", "D": "8543691"}',
  'C',
  'By mapping the letters: C=8, A=2, L=5, I=1, C=8, U=9, T=6. Therefore CALICUT = 8251896.',
  'medium'
),
(
  (SELECT id FROM exams WHERE code = 'ssc'),
  (SELECT id FROM subjects WHERE code = 'reasoning' AND exam_id = (SELECT id FROM exams WHERE code = 'ssc')),
  NULL,
  'Find the odd one out: 3, 5, 11, 14, 17, 21',
  '{"A": "3", "B": "5", "C": "14", "D": "21"}',
  'C',
  'All numbers except 14 are prime numbers. 14 is composite (2 × 7).',
  'easy'
);

-- Insert sample questions for Banking Quantitative Aptitude
INSERT INTO questions (exam_id, subject_id, chapter_id, question, options, correct_answer, explanation, difficulty, year) VALUES
(
  (SELECT id FROM exams WHERE code = 'banking'),
  (SELECT id FROM subjects WHERE code = 'quantitative' AND exam_id = (SELECT id FROM exams WHERE code = 'banking')),
  NULL,
  'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?',
  '{"A": "10%", "B": "12.5%", "C": "15%", "D": "20%"}',
  'B',
  'If principal = P, then amount after 8 years = 2P. Interest = P. Using SI = (P × R × T)/100: P = (P × R × 8)/100. Therefore R = 12.5%.',
  'medium',
  2023
),
(
  (SELECT id FROM exams WHERE code = 'banking'),
  (SELECT id FROM subjects WHERE code = 'quantitative' AND exam_id = (SELECT id FROM exams WHERE code = 'banking')),
  NULL,
  'The average of 5 consecutive odd numbers is 27. What is the largest number?',
  '{"A": "29", "B": "31", "C": "33", "D": "35"}',
  'B',
  'If average of 5 consecutive odd numbers is 27, the middle number is 27. The numbers are 23, 25, 27, 29, 31. Largest is 31.',
  'easy',
  2022
);

-- Insert sample questions for Banking - Banking Awareness
INSERT INTO questions (exam_id, subject_id, chapter_id, question, options, correct_answer, explanation, difficulty, year) VALUES
(
  (SELECT id FROM exams WHERE code = 'banking'),
  (SELECT id FROM subjects WHERE code = 'banking_awareness' AND exam_id = (SELECT id FROM exams WHERE code = 'banking')),
  NULL,
  'What is the minimum capital requirement for small finance banks in India?',
  '{"A": "Rs. 100 crore", "B": "Rs. 200 crore", "C": "Rs. 300 crore", "D": "Rs. 500 crore"}',
  'B',
  'As per RBI guidelines, the minimum paid-up equity capital for small finance banks shall be Rs. 200 crore.',
  'medium',
  2024
),
(
  (SELECT id FROM exams WHERE code = 'banking'),
  (SELECT id FROM subjects WHERE code = 'banking_awareness' AND exam_id = (SELECT id FROM exams WHERE code = 'banking')),
  NULL,
  'What does RTGS stand for in banking?',
  '{"A": "Real Time Gross Settlement", "B": "Rapid Transfer of Gross Sums", "C": "Real Time General System", "D": "Reserve Transaction Gateway System"}',
  'A',
  'RTGS stands for Real Time Gross Settlement - a funds transfer system where transfer of money takes place from one bank to another on a real time basis.',
  'easy',
  2023
);

-- Create a view for easy question fetching with all metadata
CREATE OR REPLACE VIEW vw_questions_full AS
SELECT
  q.id,
  q.question,
  q.options,
  q.correct_answer,
  q.explanation,
  q.difficulty,
  q.year,
  q.marks,
  q.negative_marks,
  q.time_seconds,
  q.question_type,
  q.tags,
  q.active,
  q.view_count,
  q.attempt_count,
  q.correct_count,
  e.code as exam_code,
  e.name as exam_name,
  s.code as subject_code,
  s.name as subject_name,
  c.code as chapter_code,
  c.name as chapter_name,
  t.code as topic_code,
  t.name as topic_name
FROM questions q
JOIN exams e ON q.exam_id = e.id
JOIN subjects s ON q.subject_id = s.id
LEFT JOIN chapters c ON q.chapter_id = c.id
LEFT JOIN topics t ON q.topic_id = t.id
WHERE q.active = true;

-- Create a view for user statistics
CREATE OR REPLACE VIEW vw_user_stats AS
SELECT
  user_id,
  COUNT(*) as total_questions_attempted,
  SUM(CASE WHEN bookmarked THEN 1 ELSE 0 END) as bookmarked_questions,
  SUM(correct_count) as total_correct,
  SUM(incorrect_count) as total_incorrect,
  ROUND(
    CASE
      WHEN SUM(attempt_count) > 0
      THEN (SUM(correct_count)::DECIMAL / SUM(attempt_count)::DECIMAL) * 100
      ELSE 0
    END,
    2
  ) as accuracy_percentage
FROM user_question_progress
GROUP BY user_id;

COMMENT ON TABLE exams IS 'Main exam categories (UPSC, SSC, Banking, etc.)';
COMMENT ON TABLE subjects IS 'Subjects within each exam (History, Geography, etc.)';
COMMENT ON TABLE chapters IS 'Chapters within each subject';
COMMENT ON TABLE topics IS 'Optional sub-chapter topics';
COMMENT ON TABLE questions IS 'Question bank with all metadata';
COMMENT ON TABLE user_question_progress IS 'Tracks user progress, bookmarks, and performance per question';
COMMENT ON TABLE test_sessions IS 'Stores information about user test sessions';
COMMENT ON TABLE test_session_answers IS 'Stores individual answers within each test session';
