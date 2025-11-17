#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env"
    exit 1
fi

echo "============================================================"
echo "DATABASE CONTENT ANALYSIS"
echo "============================================================"

# Get total count
echo -e "\nChecking total questions..."
response=$(curl -s "${SUPABASE_URL}/rest/v1/questions?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: count=exact")

count=$(echo "$response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
if [ -z "$count" ]; then
    count=0
fi

echo "Total Questions: $count"

if [ "$count" -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "⚠️  NO QUESTIONS FOUND IN DATABASE!"
    echo "============================================================"
    echo "The questions table is empty. You need to import questions first."
    echo ""
    echo "To import questions from PDF:"
    echo "  python question_importer_cli.py full your_questions.pdf \\"
    echo "    --exam UPSC --year 2024 --subject History \\"
    echo "    --topic \"History\" --topic-id HIST"
    exit 0
fi

# Get sample questions
echo ""
echo "============================================================"
echo "SAMPLE QUESTIONS (First 5):"
echo "============================================================"
sample=$(curl -s "${SUPABASE_URL}/rest/v1/questions?select=id,exam,subject,topic,year,difficulty&limit=5" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

echo "$sample" | python3 -m json.tool 2>/dev/null || echo "$sample"

# Get unique exams
echo ""
echo "============================================================"
echo "UNIQUE EXAMS:"
echo "============================================================"
exams=$(curl -s "${SUPABASE_URL}/rest/v1/questions?select=exam" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

echo "$exams" | python3 -c "
import sys
import json
data = json.load(sys.stdin)
exams = {}
for item in data:
    exam = item.get('exam', 'Unknown')
    exams[exam] = exams.get(exam, 0) + 1

for exam, count in sorted(exams.items()):
    print(f'  - {exam}: {count} questions')
" 2>/dev/null || echo "Could not parse exams"

echo ""
echo "============================================================"
