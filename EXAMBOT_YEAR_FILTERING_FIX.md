# ExamBot Year Filtering Fix

## Problem Solved

**Before:** When you selected a subject, the year dropdown still showed ALL years available for that exam, even if the selected subject didn't have questions from those years.

**Example:**
1. Select UPSC → Year shows 2021, 2024
2. Select "Current Affairs" → Year still shows 2021, 2024
3. Select year 2021 + difficulty Easy → **"No questions found"** ❌

This happened because Current Affairs only has 2024 questions, not 2021.

**After:** Year dropdown now filters based on selected subject.

**Example:**
1. Select UPSC → Year shows 2021, 2024
2. Select "Current Affairs" → Year updates to show ONLY 2024 ✓
3. Select year 2024 + difficulty Easy → **Shows 3 questions** ✓

## How It Works Now

### Filter Cascade Logic

```
1. Select Exam (e.g., UPSC)
   ↓
   - Loads ALL years for UPSC (2021, 2024)
   - Loads ALL subjects for UPSC

2. Select Subject (e.g., Current Affairs)
   ↓
   - RE-FILTERS years to only show years with Current Affairs questions
   - Year dropdown updates to: 2024 only
   - Resets year selection (clears previously selected year)

3. Select Year (e.g., 2024)
   ↓
   - Can now select difficulty

4. Click "Start Practice"
   ↓
   - Shows questions matching: UPSC + Current Affairs + 2024 + Easy
```

### Dynamic Filtering

All filters now update dynamically:

| Filter | Filtered By | Shows Only |
|--------|------------|------------|
| Exam | Questions table | Exams that have questions |
| Subject | Selected exam | Subjects with questions for that exam |
| Topic | Selected exam + subject | Topics with questions for that combo |
| Subtopic | Selected topic | Subtopics with questions for that topic |
| **Year** | **Selected exam + subject** | **Years with questions for that combo** |
| Difficulty | N/A | All difficulties (Easy, Medium, Hard) |

## Testing the Fix

### Test Case 1: UPSC Current Affairs (Year filtering)

1. Open http://localhost:3000
2. Click "ExamBot"
3. Select exam: **UPSC**
   - ✅ Year dropdown shows: 2021, 2024
4. Select subject: **Current Affairs**
   - ✅ Year dropdown updates to show ONLY: 2024
   - ✅ If you had selected 2021, it gets cleared
5. Select year: **2024**
6. Select difficulty: **Easy**
7. Click "Start Practice"
   - ✅ Shows 3 questions

### Test Case 2: UPSC Geography

1. Select exam: **UPSC**
2. Select subject: **Geography**
   - ✅ Year dropdown shows: 2024 (only year with Geography questions)
3. Select year: **2024**
4. Select difficulty: **Medium**
5. Click "Start Practice"
   - ✅ Shows 3 questions

### Test Case 3: IAS 2021 Prelims (Subject and Year)

1. Select exam: **IAS 2021 Prelims Test Series PT CRT**
2. Select subject: **Polity**
   - ✅ Year dropdown shows: 2021 (only)
3. Select difficulty: **Medium**
4. Click "Start Practice"
   - ✅ Shows 26 questions

### Test Case 4: Changing Subjects (Year resets)

1. Select exam: **UPSC**
2. Select subject: **History**
3. Select year: **2024**
4. Now change subject to: **Current Affairs**
   - ✅ Year selection is cleared (reset to "All Years")
   - ✅ Year dropdown updates to show: 2024
5. Select year: **2024** again
6. Click "Start Practice"
   - ✅ Shows Current Affairs questions, not History

## Your Database Content Summary

Based on the data you provided:

### UPSC Questions by Subject & Year

| Subject | Year 2021 | Year 2024 |
|---------|-----------|-----------|
| Current Affairs | - | 3 questions |
| Economics | - | 4 questions |
| Environment | - | 4 questions |
| General Studies | 3 questions | - |
| Geography | - | 5 questions |
| History | - | 5 questions |
| Polity | - | 5 questions |
| Science | - | 5 questions |

### Other Exams

| Exam | Subjects | Total Questions |
|------|----------|-----------------|
| IAS 2021 Prelims Test Series PT CRT | Polity | 50 questions (2021) |
| UPSC Mock Test | Various (no difficulty) | 10 questions (2024) |
| Aptitude | Aptitude | 1 question (2024) |

## Code Changes

### 1. New Service Method

**File:** `frontend/src/services/examBotService.ts`

Added `getAvailableYearsByExamAndSubject()`:

```typescript
async getAvailableYearsByExamAndSubject(exam: string, subject: string): Promise<number[]> {
  let query = supabase
    .from('questions')
    .select('year')
    .eq('exam', exam)
    .not('year', 'is', null)
    .order('year', { ascending: false });

  // Only filter by subject if provided
  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;
  if (error) throw error;

  const years = [...new Set(data?.map((q) => q.year).filter((y) => y !== null))];
  return years as number[];
}
```

### 2. ExamBot Component Updates

**File:** `frontend/src/components/examBot/ExamBot.tsx`

**Added useEffect to watch subject changes:**

```typescript
// Update years when subject changes
useEffect(() => {
  if (filters.exam && filters.subject) {
    loadYearsForSubject(filters.exam, filters.subject);
  } else if (filters.exam && !filters.subject) {
    loadYearsForExam(filters.exam);
  }
}, [filters.subject]);
```

**Added helper methods:**

```typescript
const loadYearsForExam = async (exam: string) => {
  const years = await examBotService.getAvailableYears(exam);
  setAvailableYears(years);
};

const loadYearsForSubject = async (exam: string, subject: string) => {
  const years = await examBotService.getAvailableYearsByExamAndSubject(exam, subject);
  setAvailableYears(years);
};
```

**Updated filter reset logic:**

```typescript
const handleFilterChange = (key: keyof Filters, value: any) => {
  setFilters(prev => {
    const newFilters = { ...prev, [key]: value };

    if (key === 'exam') {
      // Reset all dependent filters
      newFilters.topic = '';
      newFilters.subtopic = '';
      newFilters.subject = '';
      newFilters.year = null;
    } else if (key === 'subject') {
      // Reset year when subject changes (NEW!)
      newFilters.year = null;
    } else if (key === 'topic') {
      newFilters.subtopic = '';
    }

    return newFilters;
  });
};
```

## Benefits

1. **Better UX**: Users won't select year/subject combos that have no questions
2. **Fewer "No questions found" errors**: Filter options are always valid
3. **Faster discovery**: Users can see which years have content for each subject
4. **Data-driven**: All filters show only what exists in the database

## Next Steps

### Recommended Improvements

1. **Add question count badges** to filters:
   ```
   [UPSC ▼] [Current Affairs (3) ▼] [2024 (3) ▼] [Easy (3) ▼]
   ```

2. **Disable filters** instead of hiding them:
   - Show greyed out "No years available" if a subject has no year data
   - Better feedback than completely hiding the filter

3. **Add tooltips** explaining why filters update:
   - "Year filter updated based on selected subject"

4. **Persist filter state** in localStorage:
   - Remember user's last filter selections
   - Restore on next visit

5. **Add "Clear Filters" button** confirmation:
   - Ask before clearing all filters
   - Or add individual × buttons on each filter tag

## Troubleshooting

### Issue: Year dropdown still shows all years

**Cause:** useEffect might not be triggering

**Fix:**
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R)
3. Check console for errors

### Issue: Year gets cleared when I don't want it to

**Cause:** By design - year resets when subject changes

**Explanation:** This is intentional. When you change subjects, the previously selected year might not have questions for the new subject. We reset it to avoid "No questions found" errors.

### Issue: No years showing after selecting subject

**Cause:** That subject truly has no year data in database

**Check:**
```sql
SELECT year, COUNT(*)
FROM questions
WHERE exam = 'YOUR_EXAM' AND subject = 'YOUR_SUBJECT'
GROUP BY year;
```

If no results, that subject has no year-tagged questions.

---

**Status:** ✅ Fixed and tested

**Dev Server:** Running on http://localhost:3000

**Branch:** `claude/restructure-premium-edtech-014nXqfwLPERBuHyCPhrVrnG`
