#!/bin/bash

SUPABASE_URL="https://bminlmgtoanbkilsnapc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw"

echo "============================================================"
echo "DATABASE CONTENT ANALYSIS"
echo "============================================================"

echo -e "\nFetching questions data..."

# Get all questions
response=$(curl -s "${SUPABASE_URL}/rest/v1/questions?select=id,exam,subject,topic,year,difficulty&limit=100" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

# Check if response is empty array
if [ "$response" = "[]" ]; then
    echo ""
    echo "============================================================"
    echo "⚠️  NO QUESTIONS FOUND IN DATABASE!"
    echo "============================================================"
    echo "The questions table is empty or has no data."
    echo ""
    echo "To import questions from PDF, use the question importer:"
    echo "  cd backend"
    echo "  python question_importer_cli.py full your_questions.pdf \\"
    echo "    --exam UPSC --year 2024 --subject History \\"
    echo "    --topic \"History\" --topic-id HIST"
    echo ""
    exit 0
fi

# Parse and display the data
echo "$response" | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    
    if not data:
        print('\n⚠️  NO QUESTIONS FOUND!')
        sys.exit(0)
    
    print(f'\nTotal Questions Retrieved: {len(data)}')
    
    # Count by exam
    print('\n' + '='*60)
    print('QUESTIONS BY EXAM:')
    print('='*60)
    exams = {}
    for q in data:
        exam = q.get('exam', 'Unknown')
        exams[exam] = exams.get(exam, 0) + 1
    for exam, count in sorted(exams.items()):
        print(f'  {exam}: {count} questions')
    
    # Count by subject per exam
    print('\n' + '='*60)
    print('QUESTIONS BY SUBJECT:')
    print('='*60)
    subjects_by_exam = {}
    for q in data:
        exam = q.get('exam', 'Unknown')
        subject = q.get('subject', 'Unknown')
        key = f'{exam} - {subject}'
        subjects_by_exam[key] = subjects_by_exam.get(key, 0) + 1
    for key, count in sorted(subjects_by_exam.items()):
        print(f'  {key}: {count} questions')
    
    # Count by year per exam
    print('\n' + '='*60)
    print('QUESTIONS BY YEAR:')
    print('='*60)
    years_by_exam = {}
    for q in data:
        exam = q.get('exam', 'Unknown')
        year = q.get('year', 'No Year')
        key = f'{exam} - {year}'
        years_by_exam[key] = years_by_exam.get(key, 0) + 1
    for key, count in sorted(years_by_exam.items()):
        print(f'  {key}: {count} questions')
    
    # Count by difficulty
    print('\n' + '='*60)
    print('QUESTIONS BY DIFFICULTY:')
    print('='*60)
    difficulties = {}
    for q in data:
        diff = q.get('difficulty', 'No Difficulty')
        difficulties[diff] = difficulties.get(diff, 0) + 1
    for diff, count in sorted(difficulties.items()):
        print(f'  {diff}: {count} questions')
    
    # Show first 3 questions
    print('\n' + '='*60)
    print('SAMPLE QUESTIONS (First 3):')
    print('='*60)
    for i, q in enumerate(data[:3], 1):
        print(f'\n{i}. ID: {q.get(\"id\", \"N/A\")}')
        print(f'   Exam: {q.get(\"exam\", \"N/A\")}')
        print(f'   Subject: {q.get(\"subject\", \"N/A\")}')
        print(f'   Topic: {q.get(\"topic\", \"N/A\")}')
        print(f'   Year: {q.get(\"year\", \"N/A\")}')
        print(f'   Difficulty: {q.get(\"difficulty\", \"N/A\")}')

except json.JSONDecodeError as e:
    print(f'\nError parsing JSON: {e}')
    print('Raw response:')
    print(sys.stdin.read())
except Exception as e:
    print(f'\nError: {e}')
"

echo ""
echo "============================================================"
