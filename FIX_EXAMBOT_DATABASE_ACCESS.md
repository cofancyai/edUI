# Fix ExamBot Database Access Issue

## Problem Identified

Your ExamBot is showing "No questions found for selected filters" because of a **Row Level Security (RLS) policy issue** in Supabase. The anonymous user (used by your frontend) doesn't have permission to read data from the `questions` table.

**Error:** `403 Access denied` when querying questions table

## Solution Steps

### Step 1: Fix RLS Policies in Supabase

1. **Open Supabase Dashboard**
   - Go to: https://bminlmgtoanbkilsnapc.supabase.co

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Fix Script**
   - Copy the contents of `fix_rls_policies.sql` (in this directory)
   - Paste into SQL Editor
   - Click "Run"

**What this does:**
- Enables Row Level Security on all ExamBot tables
- Creates policies allowing anonymous users to READ (but not modify) questions
- Applies the same read-only access to exam_categories, topics, and subtopics

### Step 2: Verify Database Has Questions

After fixing RLS, check if you have questions in the database:

```sql
-- Run this in Supabase SQL Editor
SELECT COUNT(*) as total_questions FROM questions;

-- See questions by exam
SELECT exam, COUNT(*) as count
FROM questions
GROUP BY exam
ORDER BY count DESC;

-- See questions by subject
SELECT exam, subject, COUNT(*) as count
FROM questions
GROUP BY exam, subject
ORDER BY exam, subject;
```

### Step 3: Import Questions (If Database is Empty)

If you have NO questions in the database, you need to import them:

#### Option A: Use the Question Importer (Recommended)

```bash
cd backend

# Install dependencies
pip install -r requirements_question_importer.txt

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env and add:
#   SUPABASE_URL=https://bminlmgtoanbkilsnapc.supabase.co
#   SUPABASE_SERVICE_KEY=your-service-role-key
#   MISTRAL_API_KEY=your-mistral-api-key

# Import questions from PDF
python question_importer_cli.py full your_questions.pdf \
  --exam UPSC \
  --year 2024 \
  --subject History \
  --topic "Indian History" \
  --topic-id HIST
```

See `QUESTION_IMPORTER_README.md` for full details.

#### Option B: Manual SQL Insert (For Testing)

```sql
-- Insert sample questions for testing
INSERT INTO questions (
  id, exam, subject, topic, topic_id, question, options, answer,
  difficulty, year, question_type, time_estimate
) VALUES
  (
    'UPSC_2024_HIST_001',
    'UPSC',
    'History',
    'Modern Indian History',
    'HIST',
    'Who led the Salt March in 1930?',
    '["Mahatma Gandhi", "Jawaharlal Nehru", "Subhash Chandra Bose", "Sardar Patel"]',
    'A',
    'Easy',
    2024,
    'multiple_choice',
    60
  ),
  (
    'UPSC_2024_HIST_002',
    'UPSC',
    'History',
    'Ancient Indian History',
    'HIST',
    'Which dynasty built the Qutub Minar?',
    '["Mughal Dynasty", "Slave Dynasty", "Khilji Dynasty", "Tughlaq Dynasty"]',
    'B',
    'Medium',
    2024,
    'multiple_choice',
    90
  ),
  (
    'UPSC_2021_CURR_001',
    'UPSC',
    'Current Affairs',
    'Current Affairs',
    'CURR',
    'Which country hosted the 2021 Climate Summit?',
    '["USA", "UK", "France", "Germany"]',
    'B',
    'Easy',
    2021,
    'multiple_choice',
    60
  );

-- Verify insertion
SELECT id, exam, subject, year, difficulty FROM questions;
```

### Step 4: Test ExamBot

After fixing RLS and ensuring questions exist:

```bash
cd frontend
npm run dev
```

Then:
1. Click on "ExamBot" in the navigation
2. Select an exam (e.g., "UPSC")
3. You should now see filtered options for:
   - Subjects (only subjects with questions)
   - Topics (only topics with questions)
   - Years (only years with questions)
   - Difficulty levels
4. Click "Start Practice"
5. You should see questions!

## Understanding the Issue

### What is Row Level Security (RLS)?

RLS is Supabase's security feature that controls which rows users can access in a table. By default, when RLS is enabled, **NO ONE** can access the data unless you create specific policies.

### Why Did This Happen?

When you created the `questions` table, RLS was likely enabled but no policies were added, so even though your app has the anon key, it couldn't read the data.

### The Fix

The SQL script creates a policy that says:
```sql
"Anyone (anonymous or authenticated) can SELECT (read) from questions"
```

This is safe because:
- Users can only READ, not write/update/delete
- Questions are public educational content
- No sensitive user data is exposed

## Verification Checklist

After running the fix:

- [ ] RLS policies created (check SQL Editor output)
- [ ] Questions table has data (run count query)
- [ ] Frontend .env file exists with correct Supabase credentials
- [ ] ExamBot loads without errors
- [ ] Exam dropdown shows only exams with questions
- [ ] Subject/Topic filters show only available options
- [ ] Questions display when you click "Start Practice"

## Common Issues

### Issue: Still getting "No questions found"

**Causes:**
1. RLS policies not applied correctly
2. Database truly has no questions matching your filter combination
3. Questions exist but filters are too restrictive

**Debug:**
```sql
-- Check what questions exist
SELECT exam, subject, topic, year, difficulty, COUNT(*)
FROM questions
GROUP BY exam, subject, topic, year, difficulty;

-- Check specific filter combination
SELECT * FROM questions
WHERE exam = 'UPSC'
  AND subject = 'Current Affairs'
  AND year = 2021
  AND difficulty = 'Easy';
```

### Issue: Filters showing all options instead of filtered

This would indicate a different bug in the ExamBot component. The current implementation correctly filters based on available data.

### Issue: "Access denied" error persists

**Causes:**
1. RLS policies not created
2. Wrong Supabase anon key in .env

**Fix:**
1. Re-run the SQL script
2. Verify .env has correct `VITE_SUPABASE_ANON_KEY`
3. Restart the dev server (`npm run dev`)

## Files Updated

1. ✅ `/home/user/edUI/frontend/.env` - Created with Supabase credentials
2. ✅ `/home/user/edUI/fix_rls_policies.sql` - SQL script to fix RLS
3. ✅ `/home/user/edUI/FIX_EXAMBOT_DATABASE_ACCESS.md` - This guide

## Next Steps

1. **Immediate:** Run the SQL script in Supabase to fix RLS
2. **Verify:** Check if questions exist in database
3. **Import:** If needed, import questions using the question importer
4. **Test:** Verify ExamBot works in the browser

## Need More Help?

- Check Supabase logs for detailed error messages
- Verify all table structures match the schema in `README_EXAMBOT.md`
- Ensure you're using the service role key (not anon key) for the backend question importer

---

**Status:** Ready to fix! Run the SQL script and test.
