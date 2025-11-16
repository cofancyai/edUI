# ExamBot Database Setup Guide

This guide will help you set up the Supabase database for the ExamBot question bank system.

## Overview

The ExamBot system is a comprehensive question bank platform with:
- Hierarchical organization: Exams → Subjects → Chapters → Topics → Questions
- User progress tracking and bookmarking
- Test session management
- Previous year papers (2015-2024)
- Performance analytics and weak topic identification

## Database Architecture

### Core Tables
- `exams` - Main exam categories (UPSC, SSC, Banking, etc.)
- `subjects` - Subjects within each exam
- `chapters` - Chapters within each subject
- `topics` - Optional sub-chapter topics
- `questions` - Main question bank with metadata

### User Tracking Tables
- `user_question_progress` - Tracks attempts, bookmarks, and performance per question
- `test_sessions` - Stores test session metadata
- `test_session_answers` - Individual answers within test sessions

### Views
- `vw_questions_full` - Complete question data with all metadata
- `vw_user_stats` - User statistics summary

## Setup Steps

### 1. Create Database Schema

Run the SQL scripts in your Supabase SQL Editor in this order:

```bash
# 1. First, create the main schema and tables
supabase_schema.sql

# 2. Then, create the helper functions
supabase_functions.sql

# 3. Finally, seed with sample data
seed_exambot_data.sql
```

**Via Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase_schema.sql`
5. Click "Run"
6. Repeat for `supabase_functions.sql` and `seed_exambot_data.sql`

### 2. Set Up Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings:
- Project Settings → API → Project URL
- Project Settings → API → Project API keys → anon/public

### 3. Install Required Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

### 4. Verify Setup

After running the SQL scripts, verify the setup:

```sql
-- Check that tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check exam data
SELECT * FROM exams;

-- Check subject data
SELECT * FROM subjects;

-- Check sample questions
SELECT COUNT(*) FROM questions;

-- Test the view
SELECT * FROM vw_questions_full LIMIT 5;
```

You should see:
- 3 exams (UPSC, SSC, Banking)
- Multiple subjects per exam
- Sample questions in the database

## Using the ExamBot Service

The `examBotService.ts` file provides a clean TypeScript interface to interact with the database.

### Basic Usage Examples

```typescript
import { examBotService } from '@/services/examBotService';

// Get all exams
const exams = await examBotService.getExams();

// Get subjects for UPSC
const subjects = await examBotService.getSubjectsByExamId(upscExamId);

// Get questions for a specific chapter
const questions = await examBotService.getQuestions({
  examId: upscExamId,
  subjectId: historySubjectId,
  chapterId: ancientIndiaChapterId,
  difficulty: 'medium',
  limit: 20
});

// Get previous year questions
const pyqs = await examBotService.getPreviousYearQuestions(upscExamId, 2023);

// Get bookmarked questions
const bookmarks = await examBotService.getBookmarkedQuestions(userId);

// Toggle bookmark
await examBotService.toggleBookmark(userId, questionId, true);

// Record user answer
await examBotService.recordAnswer(
  userId,
  questionId,
  'A',
  'B',
  45 // time spent in seconds
);

// Get user statistics
const stats = await examBotService.getUserStats(userId);
console.log(`Accuracy: ${stats.accuracy_percentage}%`);
```

## Data Model

### Question Structure

```typescript
{
  id: "uuid",
  question: "Question text",
  options: {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  correct_answer: "C",
  explanation: "Detailed explanation...",
  difficulty: "medium",
  year: 2023,
  exam_type: "upsc",
  subject: "history",
  chapter: "ancient_india",
  tags: ["indus-valley", "bronze-age"]
}
```

### User Progress Structure

```typescript
{
  user_id: "uuid",
  question_id: "uuid",
  bookmarked: true,
  attempt_count: 3,
  correct_count: 2,
  incorrect_count: 1,
  last_correct: true,
  time_spent_seconds: 135
}
```

## Adding More Questions

### Manual Entry

```sql
INSERT INTO questions (
  exam_id,
  subject_id,
  chapter_id,
  question,
  options,
  correct_answer,
  explanation,
  difficulty,
  year
) VALUES (
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'history' AND exam_id = (SELECT id FROM exams WHERE code = 'upsc')),
  (SELECT id FROM chapters WHERE code = 'ancient_india'),
  'Your question text here?',
  '{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}',
  'C',
  'Explanation for the correct answer...',
  'medium',
  2024
);
```

### Bulk Import

Create a CSV file with the following columns:
- exam_code
- subject_code
- chapter_code
- question
- option_a
- option_b
- option_c
- option_d
- correct_answer
- explanation
- difficulty
- year

Then use Supabase's CSV import feature or write a script to bulk insert.

## Security Considerations

### Row Level Security (RLS)

The schema includes RLS policies to ensure:
- Anyone can view active exam structure (exams, subjects, chapters)
- Only authenticated users can view questions
- Users can only access their own progress and test sessions
- Users cannot view other users' data

### Authentication

Make sure users are authenticated before accessing protected features:

```typescript
import { supabase } from '@/services/examBotService';

// Check authentication
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
}
```

## Advanced Features

### Adaptive Learning

Use the `get_recommended_difficulty` function to recommend questions based on user performance:

```sql
SELECT get_recommended_difficulty(
  'user-uuid',
  (SELECT id FROM exams WHERE code = 'upsc'),
  (SELECT id FROM subjects WHERE code = 'history')
);
-- Returns: 'easy', 'medium', or 'hard'
```

### Performance Analytics

Get weak topics for focused practice:

```sql
SELECT * FROM get_weak_topics('user-uuid', NULL, 3, 10);
```

Get performance timeline:

```sql
SELECT * FROM get_test_performance_timeline('user-uuid', 20);
```

## Troubleshooting

### Issue: RLS blocking queries

**Solution:** Make sure you're authenticated:
```typescript
await supabase.auth.signInWithPassword({ email, password });
```

### Issue: Foreign key violations when inserting questions

**Solution:** Ensure exam_id, subject_id, and chapter_id exist:
```sql
-- Verify IDs exist
SELECT id FROM exams WHERE code = 'upsc';
SELECT id FROM subjects WHERE code = 'history';
SELECT id FROM chapters WHERE code = 'ancient_india';
```

### Issue: "relation does not exist" error

**Solution:** Make sure you ran `supabase_schema.sql` first.

## Next Steps

1. **Add More Questions**: Import your question database
2. **Customize Exams**: Add more exam types (NEET, JEE, etc.)
3. **Implement Analytics Dashboard**: Use the views and functions for insights
4. **Add Question Import Tool**: Create an admin interface for bulk question upload
5. **Implement Spaced Repetition**: Use user progress data for intelligent question scheduling

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the schema comments in `supabase_schema.sql`
- Examine the service layer in `examBotService.ts`

## File Reference

- `supabase_schema.sql` - Main database schema with tables, indexes, and RLS policies
- `supabase_functions.sql` - Helper functions for advanced queries
- `seed_exambot_data.sql` - Sample data for testing
- `examBotService.ts` - TypeScript service layer for frontend integration
- `EXAMBOT_SETUP.md` - This file
