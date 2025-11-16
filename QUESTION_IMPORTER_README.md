# Question Importer - Quick Reference

Complete pipeline for importing questions from PDF to Supabase database.

## 🚀 Quick Start

### 1. Setup (One-time)

```bash
# Install Python dependencies
cd backend
pip install -r requirements_question_importer.txt

# Configure environment
cp .env.example .env
# Edit .env and add your Supabase and Mistral API keys
```

### 2. Import Questions from PDF

```bash
# Full pipeline (extract + import)
python question_importer_cli.py full your_questions.pdf \
  --exam UPSC \
  --year 2024 \
  --subject History \
  --topic "Modern Indian History" \
  --topic-id HIST \
  --subtopic "Freedom Movement" \
  --subtopic-id HIST-MOD-FREE
```

### 3. Verify in Database

Check your Supabase dashboard → Questions table to see imported questions.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `pdf_to_json_extractor.py` | Extracts questions from PDF using AI |
| `import_to_supabase.py` | Imports JSON questions to Supabase |
| `question_importer_cli.py` | Easy CLI for all operations |
| `requirements_question_importer.txt` | Python dependencies |
| `PDF_TO_DATABASE_GUIDE.md` | Complete documentation |
| `.env.example` | Environment variables template |

## 🛠️ CLI Commands

### Extract Only (PDF → JSON)

```bash
python question_importer_cli.py extract questions.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "History" --topic-id HIST \
  --output my_questions.json
```

### Import Only (JSON → Database)

```bash
python question_importer_cli.py import my_questions.json
```

### Full Pipeline (PDF → Database)

```bash
python question_importer_cli.py full questions.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "History" --topic-id HIST
```

### Create Topic

```bash
python question_importer_cli.py create-topic HIST "Indian History"
```

### Create Subtopic

```bash
python question_importer_cli.py create-subtopic HIST-MOD HIST "Modern History"
```

## 📊 Your Database Schema

```
questions table:
├── id (text) - "UPSC_2024_HIST_001"
├── exam (text) - "UPSC"
├── year (integer) - 2024
├── topic (text) - "Modern Indian History"
├── subtopic (text) - "Freedom Movement"
├── topic_id (text) - "HIST"
├── subtopic_id (text) - "HIST-MOD-FREE"
├── question (text)
├── options (jsonb array) - ["A", "B", "C", "D"]
├── answer (text) - "A", "B", "C", or "D"
├── detailed_explanation (text)
├── difficulty (text) - "Easy", "Medium", "Hard"
├── subject (text)
├── tags (jsonb array)
└── ... more fields
```

## 🎯 Common Use Cases

### Import UPSC History Questions

```bash
python question_importer_cli.py full upsc_history_2024.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "Indian History" --topic-id HIST
```

### Import SSC Quantitative Aptitude

```bash
python question_importer_cli.py full ssc_quant.pdf \
  --exam SSC --year 2024 --subject "Quantitative Aptitude" \
  --topic "Quantitative Aptitude" --topic-id QUANT
```

### Import Banking Awareness

```bash
python question_importer_cli.py full banking_awareness.pdf \
  --exam Banking --year 2024 --subject "Banking Awareness" \
  --topic "Banking" --topic-id BANK
```

### Batch Import Multiple PDFs

Create `batch_import.sh`:

```bash
#!/bin/bash

FILES=(
  "upsc_ancient_history.pdf:HIST-ANC:Ancient India"
  "upsc_medieval_history.pdf:HIST-MED:Medieval India"
  "upsc_modern_history.pdf:HIST-MOD:Modern India"
)

for file_info in "${FILES[@]}"; do
  IFS=':' read -r pdf subtopic_id subtopic <<< "$file_info"

  python question_importer_cli.py full "$pdf" \
    --exam UPSC --year 2024 --subject History \
    --topic "Indian History" --topic-id HIST \
    --subtopic "$subtopic" --subtopic-id "$subtopic_id"
done

echo "✅ All imports complete!"
```

Run: `bash batch_import.sh`

## 🔧 Environment Variables

Required in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
MISTRAL_API_KEY=your-mistral-api-key
```

**Where to get:**
- **Supabase**: Project Settings → API
- **Mistral AI**: https://console.mistral.ai/

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| PDF text not extracted | Try pdfplumber or check if PDF is image-based |
| JSON parse error | Review AI response, adjust temperature in code |
| Import validation fails | Check JSON format, verify answer is A/B/C/D |
| Duplicate question IDs | Script uses upsert, duplicates are updated |
| Topic not found | Create topic first with `create-topic` command |
| Supabase connection error | Verify .env has correct SERVICE_KEY (not anon) |

## 📖 Full Documentation

See `backend/PDF_TO_DATABASE_GUIDE.md` for:
- Detailed setup instructions
- Complete command reference
- Database schema details
- Advanced features
- Best practices

## 🎓 Example Workflow

1. **Prepare Topics** (one-time per topic):
   ```bash
   python question_importer_cli.py create-topic HIST "Indian History"
   python question_importer_cli.py create-subtopic HIST-MOD HIST "Modern History"
   ```

2. **Import Questions**:
   ```bash
   python question_importer_cli.py full questions.pdf \
     --exam UPSC --year 2024 --subject History \
     --topic "Indian History" --topic-id HIST \
     --subtopic "Modern History" --subtopic-id HIST-MOD
   ```

3. **Verify**:
   - Check Supabase dashboard
   - Test in ExamBot UI

4. **Repeat** for more PDFs!

## 💡 Tips

- Start with a small PDF (1-2 pages) to test
- Review JSON output before importing to database
- Use `--keep-json` flag to save extraction results
- Batch size of 50-100 is optimal for imports
- Create topics/subtopics before importing questions

## 🔗 Related Files

- **ExamBot UI**: `frontend/src/components/examBot/ExamBot.tsx`
- **Service Layer**: `frontend/src/services/examBotService_updated.ts`
- **Previous Schema**: `backend/supabase_schema.sql` (reference design)

## 📈 Progress Tracking

Track your question imports:

```sql
-- Check total questions
SELECT COUNT(*) FROM questions;

-- Questions by exam
SELECT exam, COUNT(*) as count FROM questions GROUP BY exam;

-- Questions by year
SELECT year, COUNT(*) as count FROM questions
WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC;

-- Questions by difficulty
SELECT difficulty, COUNT(*) as count FROM questions
WHERE difficulty IS NOT NULL GROUP BY difficulty;
```

---

**Ready to import?** Run:

```bash
python question_importer_cli.py full your_pdf.pdf \
  --exam UPSC --year 2024 --subject YourSubject \
  --topic "Your Topic" --topic-id TOPIC
```

For help:

```bash
python question_importer_cli.py --help
```
