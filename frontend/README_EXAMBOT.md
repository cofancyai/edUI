# ExamBot - Dynamic Database-Driven Question Bank

Updated ExamBot component that works with your existing Supabase database schema.

## Features

✅ **Dynamic Filters** - All filters populate from real database data
✅ **Multi-level Filtering** - Exam → Subject → Topic → Subtopic → Year → Difficulty
✅ **Real-time Data** - Fetches questions from Supabase based on selected filters
✅ **Practice Mode** - Browse and study questions with instant answer reveal
✅ **Test Mode** - Timed tests with question navigation and flagging
✅ **Results & Review** - Detailed performance analysis and answer review
✅ **Bookmarking** - Save questions for later (localStorage-based, upgradeable to DB)

## Database Integration

The ExamBot now integrates with your existing database tables:

### Tables Used

1. **exam_categories** - Exam types (UPSC, SSC, Banking, etc.)
2. **topics** - Main topics (History, Geography, etc.)
3. **subtopics** - Sub-topics under each topic
4. **questions** - Question bank with all metadata

### Question Schema

```typescript
interface Question {
  id: string;                    // "UPSC_2024_HIST_001"
  exam: string;                  // "UPSC"
  year: number | null;           // 2024
  topic: string;                 // "Modern Indian History"
  subtopic: string;              // "Freedom Movement"
  topic_id: string;              // "HIST"
  subtopic_id: string;           // "HIST-MOD-FREE"
  question_number: number | null;
  question: string;              // Question text
  options: string[];             // ["Option A", "Option B", ...]
  answer: string;                // "A", "B", "C", or "D"
  detailed_explanation: string | null;
  difficulty: string | null;     // "Easy", "Medium", "Hard"
  subject: string;               // "History"
  tags: string[] | null;         // ["tag1", "tag2"]
  time_estimate: number;         // Seconds
  file_source: string | null;
  created_at: string;
  updated_at: string;
  question_type: string;         // "multiple_choice"
}
```

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create or update `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from Supabase Dashboard → Project Settings → API

### 3. Verify Database Structure

Make sure your Supabase has these tables:
- `exam_categories` (with active exams)
- `topics` (with topic IDs and names)
- `subtopics` (linked to topics)
- `questions` (with all fields as per schema above)

## How It Works

### Filter Flow

```
1. User selects Exam (e.g., "UPSC")
   ↓
2. ExamBot fetches available subjects for UPSC
   ↓
3. ExamBot fetches available years for UPSC
   ↓
4. User optionally selects Subject (e.g., "History")
   ↓
5. ExamBot fetches topics for UPSC + History
   ↓
6. User selects Topic (e.g., topic_id: "HIST")
   ↓
7. ExamBot fetches subtopics for HIST
   ↓
8. User selects Subtopic, Year, Difficulty (all optional)
   ↓
9. User clicks "Start Practice"
   ↓
10. ExamBot queries questions with all selected filters
```

### Data Fetching

All data is fetched using the `examBotService`:

```typescript
import { examBotService } from '../../services/examBotService';

// Get all exams
const exams = await examBotService.getExamCategories();

// Get topics
const topics = await examBotService.getTopics();

// Get subtopics for a topic
const subtopics = await examBotService.getSubtopics('HIST');

// Get questions with filters
const questions = await examBotService.getQuestions({
  exam: 'UPSC',
  subject: 'History',
  topicId: 'HIST',
  subtopicId: 'HIST-MOD-FREE',
  year: 2024,
  difficulty: 'Medium'
});

// Get available years for an exam
const years = await examBotService.getAvailableYears('UPSC');

// Get subjects for an exam
const subjects = await examBotService.getSubjectsByExam('UPSC');
```

## Service Layer

The `examBotService.ts` provides these methods:

### Exam & Category Methods
- `getExamCategories()` - Get all active exam categories
- `getTopics()` - Get all topics
- `getSubtopics(topicId)` - Get subtopics for a topic
- `getSubjectsByExam(exam)` - Get unique subjects for an exam
- `getTopicsByExamAndSubject(exam, subject)` - Get topics filtered by exam and subject
- `getSubtopicsByTopic(topicId)` - Get subtopics from questions table
- `getAvailableYears(exam)` - Get available years for an exam

### Question Methods
- `getQuestions(filters)` - Get questions with filters
- `getPreviousYearQuestions(exam, year, limit)` - Get PYQ for a specific year
- `getQuestionById(id)` - Get single question
- `searchQuestions(keyword, exam, limit)` - Search questions by keyword
- `getRandomQuestions(filters)` - Get random questions for practice
- `getQuestionCount(filters)` - Count questions matching filters

### Statistics
- `getExamStats(exam)` - Get statistics for an exam (total questions, subjects, topics, year range)

## Usage Examples

### Basic Practice Mode

1. User opens ExamBot
2. Selects "UPSC" from Exam dropdown
3. Selects "History" from Subject dropdown (auto-populated)
4. Selects "Indian History" from Topic dropdown (auto-populated)
5. Optionally selects Subtopic, Year, Difficulty
6. Clicks "Start Practice"
7. Views questions with filters applied
8. Can reveal answers and explanations
9. Can bookmark questions

### Test Mode

1. After loading questions in Practice mode
2. Click "Start Timed Test"
3. Set time limit (default: 1 hour)
4. Answer questions with timer running
5. Navigate between questions
6. Flag important questions
7. Submit test
8. View results with detailed analytics
9. Review all answers with explanations

### Filter Combinations

#### Example 1: All UPSC History Questions
```typescript
{
  exam: "UPSC",
  subject: "History"
}
```

#### Example 2: Previous Year Papers
```typescript
{
  exam: "UPSC",
  year: 2024
}
```

#### Example 3: Specific Topic & Difficulty
```typescript
{
  exam: "UPSC",
  topicId: "HIST",
  subtopicId: "HIST-MOD-FREE",
  difficulty: "Medium"
}
```

#### Example 4: Subject + Year
```typescript
{
  exam: "UPSC",
  subject: "Geography",
  year: 2023
}
```

## UI Views

### 1. Home View
- Welcome banner
- Statistics cards (total questions, attempted, bookmarked)
- Dynamic filter selection
- "Start Practice" button

### 2. Practice View
- Applied filters display
- Question list with metadata
- Bookmark buttons
- Expandable answer/explanation
- "Start Timed Test" button

### 3. Test View
- Timer (countdown or elapsed)
- Current question display
- Multiple choice options
- Question navigation grid
- Flag questions
- Submit test button

### 4. Results View
- Score summary (correct, incorrect, skipped, accuracy)
- Detailed statistics
- "Review Answers" button
- "New Test" button

### 5. Review View
- All questions with user answers
- Correct/Incorrect indicators
- Explanations for each question
- Color-coded feedback

## Bookmarking

Currently uses localStorage for bookmarks:

```typescript
// Bookmark data is stored in localStorage
localStorage.getItem('exambot_bookmarks') // Returns ["question_id_1", "question_id_2"]
```

**Upgrade to Database:**

To store bookmarks in Supabase, create a table:

```sql
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  bookmarked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);
```

Then update `toggleBookmark` method in ExamBot component.

## Customization

### Change Colors

Edit the component styles:

```typescript
// Primary color (gold)
style={{ color: '#FFD700' }}

// Background gradient
background: 'linear-gradient(135deg, #1a1a4e 0%, #2E1A47 100%)'

// Glassmorphism
background: 'rgba(255, 255, 255, 0.05)',
backdropFilter: 'blur(10px)'
```

### Add More Filters

To add a new filter (e.g., "question_type"):

1. Update `Filters` interface:
   ```typescript
   interface Filters {
     // ... existing filters
     questionType: string;
   }
   ```

2. Add filter UI in `renderHome()`:
   ```typescript
   <select
     value={filters.questionType}
     onChange={(e) => handleFilterChange('questionType', e.target.value)}
   >
     <option value="">All Types</option>
     <option value="multiple_choice">Multiple Choice</option>
     <option value="true_false">True/False</option>
   </select>
   ```

3. Update `loadQuestions()` to include new filter:
   ```typescript
   if (filters.questionType) queryFilters.question_type = filters.questionType;
   ```

### Change Question Display

Edit `renderPractice()` to customize how questions are displayed.

## Troubleshooting

### Issue: No exams showing in dropdown

**Solution:** Check that `exam_categories` table has data with `is_active = true`

```sql
SELECT * FROM exam_categories WHERE is_active = true;
```

### Issue: No questions loading

**Solution:**
1. Check that questions exist in database
2. Verify filters match database data exactly
3. Check browser console for errors

```sql
SELECT exam, COUNT(*) FROM questions GROUP BY exam;
```

### Issue: Options not displaying correctly

**Solution:** Ensure `options` field in database is a JSON array:

```json
["Option A", "Option B", "Option C", "Option D"]
```

NOT an object:
```json
{"A": "Option A", "B": "Option B"}
```

### Issue: Supabase connection error

**Solution:**
1. Verify `.env` file exists and has correct credentials
2. Check Supabase URL and anon key in Project Settings
3. Test connection:

```typescript
import { supabase } from './services/examBotService';

const test = await supabase.from('questions').select('*').limit(1);
console.log(test);
```

## Performance Tips

1. **Pagination**: For large question sets, implement pagination:

```typescript
const questions = await examBotService.getQuestions({
  exam: 'UPSC',
  limit: 20,
  offset: pageNumber * 20
});
```

2. **Caching**: Cache exam categories and topics in component state (already done)

3. **Lazy Loading**: Load subtopics only when topic is selected (already done)

4. **Indexes**: Ensure database has indexes on frequently queried columns:

```sql
CREATE INDEX idx_questions_exam ON questions(exam);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_year ON questions(year);
```

## Files

- `frontend/src/components/examBot/ExamBot.tsx` - Main component
- `frontend/src/services/examBotService.ts` - Supabase integration service
- `frontend/src/components/examBot/ExamBot_old.tsx` - Backup of old component (with mock data)

## Next Steps

1. **Add User Authentication** - Link bookmarks and progress to user accounts
2. **Progress Tracking** - Create a `user_progress` table to track:
   - Questions attempted
   - Correct/incorrect answers
   - Time spent per question
   - Test history
3. **Analytics Dashboard** - Show user performance over time
4. **Spaced Repetition** - Show questions user got wrong more frequently
5. **Social Features** - Discussion forums, doubt clearing
6. **Question Recommendations** - AI-based question suggestions based on weak areas

## Support

For issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check database has required data
4. Review this README for setup steps

---

**You're all set!** The ExamBot is now fully integrated with your Supabase database and shows dynamic filters based on real data.
