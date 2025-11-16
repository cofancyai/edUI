# PDF to Database Question Importer Guide

Complete guide for extracting questions from PDF files and importing them to your Supabase database.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Quick Start](#quick-start)
4. [Detailed Usage](#detailed-usage)
5. [Database Schema](#database-schema)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

## Overview

This pipeline allows you to:
1. **Extract** questions from PDF files using AI (Mistral)
2. **Convert** to JSON format matching your database schema
3. **Import** to Supabase automatically

### Features

- 🤖 **AI-Powered Extraction**: Uses Mistral AI to intelligently parse questions
- 📊 **Automatic Formatting**: Converts to your exact database schema
- 🔄 **Batch Import**: Efficiently imports large question sets
- ✅ **Validation**: Validates data before import
- 🎯 **Flexible**: Supports multiple exams, subjects, topics

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements_question_importer.txt
```

Dependencies installed:
- `PyPDF2` - PDF text extraction
- `pdfplumber` - Alternative PDF library
- `mistralai` - Mistral AI SDK
- `supabase` - Supabase Python client
- `python-dotenv` - Environment variables

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key-here
```

**Where to get these:**

- **Supabase URL & Service Key**:
  - Go to your Supabase project
  - Settings → API → Project URL
  - Settings → API → Service Role Key (NOT anon key!)

- **Mistral API Key**:
  - Sign up at https://console.mistral.ai/
  - Create API key in dashboard
  - Or retrieve from your existing `credentials` table in Supabase

### 3. Make CLI Executable (Optional)

```bash
chmod +x question_importer_cli.py
```

### 4. Verify Setup

```bash
python question_importer_cli.py --help
```

You should see the help menu with all available commands.

## Quick Start

### Full Pipeline (Extract + Import in One Command)

```bash
python question_importer_cli.py full \
  path/to/questions.pdf \
  --exam UPSC \
  --year 2024 \
  --subject History \
  --topic "Modern Indian History" \
  --topic-id HIST \
  --subtopic "Freedom Movement" \
  --subtopic-id HIST-MOD-FREE
```

This will:
1. Extract questions from the PDF
2. Convert to JSON format
3. Import to Supabase
4. Clean up temporary files

## Detailed Usage

### Command Overview

The CLI has 5 main commands:

1. `extract` - Extract questions from PDF to JSON
2. `import` - Import questions from JSON to Supabase
3. `full` - Full pipeline (extract + import)
4. `create-topic` - Create a topic in the database
5. `create-subtopic` - Create a subtopic in the database

### 1. Extract Command

Extract questions from PDF and save to JSON file.

**Syntax:**

```bash
python question_importer_cli.py extract <pdf_file> \
  --exam <EXAM_NAME> \
  --year <YEAR> \
  --subject <SUBJECT> \
  --topic <TOPIC_NAME> \
  --topic-id <TOPIC_ID> \
  [--subtopic <SUBTOPIC_NAME>] \
  [--subtopic-id <SUBTOPIC_ID>] \
  [--output <OUTPUT_FILE>]
```

**Example:**

```bash
python question_importer_cli.py extract upsc_polity_2024.pdf \
  --exam UPSC \
  --year 2024 \
  --subject Polity \
  --topic "Indian Polity" \
  --topic-id POLY \
  --output polity_questions.json
```

**Output:**

```
📄 Extracting text from 15 pages...
  ✓ Extracted page 1/15
  ✓ Extracted page 2/15
  ...
✅ Extracted 12500 characters from PDF
🤖 Processing with Mistral AI...
📝 AI Response length: 8500 characters
✅ Extracted 25 questions
✅ Saved 25 questions to polity_questions.json

✅ Success! Extracted 25 questions to polity_questions.json
```

### 2. Import Command

Import questions from JSON file to Supabase.

**Syntax:**

```bash
python question_importer_cli.py import <json_file> \
  [--batch-size <SIZE>]
```

**Example:**

```bash
python question_importer_cli.py import polity_questions.json --batch-size 50
```

**Output:**

```
📤 Starting Import to Supabase
Total Questions: 25
Batch Size: 50

📦 Processing Batch 1/1 (25 questions)...
  ✅ Imported 25 questions

📊 Import Summary
✅ Successfully Imported: 25
⚠️  Skipped (Invalid): 0
❌ Errors: 0
📈 Total Processed: 25
```

### 3. Full Pipeline Command

Extract from PDF and import to Supabase in one command.

**Syntax:**

```bash
python question_importer_cli.py full <pdf_file> \
  --exam <EXAM_NAME> \
  --year <YEAR> \
  --subject <SUBJECT> \
  --topic <TOPIC_NAME> \
  --topic-id <TOPIC_ID> \
  [--subtopic <SUBTOPIC_NAME>] \
  [--subtopic-id <SUBTOPIC_ID>] \
  [--batch-size <SIZE>] \
  [--keep-json]
```

**Options:**
- `--keep-json` - Keep the temporary JSON file (default: delete after import)
- `--batch-size` - Number of questions per batch (default: 50)

**Example:**

```bash
python question_importer_cli.py full upsc_economy_2023.pdf \
  --exam UPSC \
  --year 2023 \
  --subject Economy \
  --topic "Indian Economy" \
  --topic-id ECON \
  --keep-json
```

### 4. Create Topic Command

Create a topic in the database before importing questions.

**Syntax:**

```bash
python question_importer_cli.py create-topic <TOPIC_ID> "<TOPIC_NAME>" \
  [--description "<DESCRIPTION>"]
```

**Example:**

```bash
python question_importer_cli.py create-topic HIST "Modern Indian History" \
  --description "Questions on modern Indian history from 1757 to 1947"
```

### 5. Create Subtopic Command

Create a subtopic under an existing topic.

**Syntax:**

```bash
python question_importer_cli.py create-subtopic <SUBTOPIC_ID> <TOPIC_ID> "<SUBTOPIC_NAME>"
```

**Example:**

```bash
python question_importer_cli.py create-subtopic HIST-MOD-FREE HIST "Freedom Movement"
```

## Database Schema

### Your Existing Database Structure

```
exam_categories
├── id (integer)
├── category_name (text) - e.g., "UPSC", "SSC", "Banking"
├── description (text)
├── is_active (boolean)
└── created_at (timestamp)

topics
├── id (text) - e.g., "HIST", "POLY", "ECON"
├── name (text) - e.g., "History", "Polity"
├── description (text)
├── created_at (timestamp)
└── updated_at (timestamp)

subtopics
├── id (text) - e.g., "HIST-MOD-FREE"
├── topic_id (text) - Foreign key to topics
├── name (text) - e.g., "Freedom Movement"
├── file (text)
├── icon (text)
├── created_at (timestamp)
└── updated_at (timestamp)

questions
├── id (text) - e.g., "UPSC_2024_HIST_001"
├── exam (text) - e.g., "UPSC"
├── year (integer) - e.g., 2024
├── topic (text) - e.g., "Modern Indian History"
├── subtopic (text) - e.g., "Freedom Movement"
├── topic_id (text) - e.g., "HIST"
├── subtopic_id (text) - e.g., "HIST-MOD-FREE"
├── question_number (integer)
├── question (text)
├── options (jsonb) - Array: ["Option A", "Option B", "Option C", "Option D"]
├── answer (text) - "A", "B", "C", or "D"
├── detailed_explanation (text)
├── difficulty (text) - "Easy", "Medium", "Hard"
├── subject (text) - e.g., "History", "Polity"
├── tags (jsonb) - Array: ["tag1", "tag2"]
├── time_estimate (integer) - Default: 90 seconds
├── file_source (text)
├── created_at (timestamp)
├── updated_at (timestamp)
└── question_type (text) - Default: "multiple_choice"
```

### JSON Output Format

The extraction tool produces JSON matching this schema:

```json
[
  {
    "id": "UPSC_2024_HIST_001",
    "exam": "UPSC",
    "year": 2024,
    "topic": "Modern Indian History",
    "subtopic": "Freedom Movement",
    "topic_id": "HIST",
    "subtopic_id": "HIST-MOD-FREE",
    "question_number": 1,
    "question": "Which of the following statements about the Quit India Movement is/are correct?...",
    "options": [
      "1 and 2 only",
      "1, 2 and 3 only",
      "1, 2 and 4 only",
      "All of the above"
    ],
    "answer": "A",
    "detailed_explanation": "Statements 1 and 2 are correct...",
    "difficulty": "Medium",
    "subject": "History",
    "tags": ["quit india", "gandhi", "1942"],
    "time_estimate": 90,
    "question_type": "multiple_choice",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
]
```

## Examples

### Example 1: UPSC History Questions

```bash
# Step 1: Create topic (if not exists)
python question_importer_cli.py create-topic HIST "Indian History"

# Step 2: Create subtopic
python question_importer_cli.py create-subtopic HIST-ANC HIST "Ancient India"

# Step 3: Extract and import
python question_importer_cli.py full upsc_ancient_india.pdf \
  --exam UPSC \
  --year 2024 \
  --subject History \
  --topic "Indian History" \
  --topic-id HIST \
  --subtopic "Ancient India" \
  --subtopic-id HIST-ANC
```

### Example 2: SSC Quantitative Aptitude

```bash
python question_importer_cli.py full ssc_quant_2023.pdf \
  --exam SSC \
  --year 2023 \
  --subject "Quantitative Aptitude" \
  --topic "Quantitative Aptitude" \
  --topic-id QUANT
```

### Example 3: Banking Awareness (Extract only)

```bash
# Extract to JSON without importing
python question_importer_cli.py extract banking_awareness.pdf \
  --exam Banking \
  --year 2024 \
  --subject "Banking Awareness" \
  --topic "Banking" \
  --topic-id BANK \
  --output banking_questions.json

# Review the JSON file
cat banking_questions.json

# Import later if satisfied
python question_importer_cli.py import banking_questions.json
```

### Example 4: Batch Processing Multiple PDFs

Create a shell script:

```bash
#!/bin/bash
# batch_import.sh

# UPSC History PDFs
python question_importer_cli.py full upsc_ancient_history.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "Indian History" --topic-id HIST \
  --subtopic "Ancient India" --subtopic-id HIST-ANC

python question_importer_cli.py full upsc_medieval_history.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "Indian History" --topic-id HIST \
  --subtopic "Medieval India" --subtopic-id HIST-MED

python question_importer_cli.py full upsc_modern_history.pdf \
  --exam UPSC --year 2024 --subject History \
  --topic "Indian History" --topic-id HIST \
  --subtopic "Modern India" --subtopic-id HIST-MOD

echo "✅ All imports complete!"
```

Run:

```bash
chmod +x batch_import.sh
./batch_import.sh
```

## Troubleshooting

### Issue 1: PDF Text Extraction Fails

**Symptoms:**
```
❌ Extracted 0 characters from PDF
```

**Solutions:**

1. **Try pdfplumber** (better for complex PDFs):

   Edit `pdf_to_json_extractor.py` and replace PyPDF2 with pdfplumber:

   ```python
   import pdfplumber

   def extract_text_from_pdf(pdf_path: str) -> str:
       text = ""
       with pdfplumber.open(pdf_path) as pdf:
           for page in pdf.pages:
               text += page.extract_text()
       return text
   ```

2. **Check PDF is not image-based** - If PDF contains scanned images, you'll need OCR:

   ```bash
   pip install pytesseract pdf2image
   ```

3. **Verify PDF file** is not corrupted:

   ```bash
   pdfinfo your_file.pdf
   ```

### Issue 2: AI Returns Invalid JSON

**Symptoms:**
```
❌ JSON Parse Error: Expecting value: line 1 column 1 (char 0)
```

**Solutions:**

1. **Check Mistral API Key** is valid
2. **Reduce PDF size** - Try with fewer pages first
3. **Manually review AI response** - The script prints the first 500 characters
4. **Adjust temperature** in `pdf_to_json_extractor.py`:

   ```python
   temperature=0.1  # Lower for more consistent output
   ```

### Issue 3: Import Fails - Validation Errors

**Symptoms:**
```
⚠️  Missing required field 'answer' in question UPSC_2024_HIST_001
```

**Solutions:**

1. **Review JSON file** manually before importing
2. **Fix invalid data** in JSON
3. **Check answer format** - Must be "A", "B", "C", or "D"
4. **Verify options array** has at least 2 options

### Issue 4: Duplicate Question IDs

**Symptoms:**
```
❌ Error importing batch: duplicate key value violates unique constraint
```

**Solutions:**

1. The script uses **upsert** which should handle duplicates
2. If you want to skip duplicates, modify `import_to_supabase.py`:

   ```python
   # Change from upsert to insert with ignore_duplicates
   response = supabase.table('questions').insert(
       valid_questions,
       upsert=False
   ).execute()
   ```

### Issue 5: Topic/Subtopic Not Found

**Symptoms:**
```
ℹ️  Topic HIST not found in database
```

**Solutions:**

1. **Create topic first**:

   ```bash
   python question_importer_cli.py create-topic HIST "History"
   ```

2. **Create subtopic**:

   ```bash
   python question_importer_cli.py create-subtopic HIST-MOD HIST "Modern History"
   ```

### Issue 6: Supabase Connection Error

**Symptoms:**
```
❌ Error: Invalid API key
```

**Solutions:**

1. **Check .env file** exists and has correct values
2. **Verify Service Key** (not anon key!) in Supabase dashboard
3. **Test connection**:

   ```python
   from supabase import create_client
   import os
   from dotenv import load_dotenv

   load_dotenv()
   supabase = create_client(
       os.getenv('SUPABASE_URL'),
       os.getenv('SUPABASE_SERVICE_KEY')
   )

   # Test query
   result = supabase.table('exam_categories').select('*').limit(1).execute()
   print(result)
   ```

## Advanced Features

### Custom Question ID Format

Edit the `generate_question_id` function in `pdf_to_json_extractor.py`:

```python
def generate_question_id(exam: str, year: int, subject_code: str, question_num: int) -> str:
    # Custom format: EXAM-YEAR-SUBJECT-NUM
    return f"{exam}-{year}-{subject_code}-{question_num:04d}"
```

### Adjust AI Prompt

Modify the prompt in `parse_questions_with_ai` function to:
- Extract different question formats
- Include additional metadata
- Handle special cases

### Add Custom Validation

Edit `validate_question` in `import_to_supabase.py`:

```python
def validate_question(question: Dict[str, Any]) -> bool:
    # Add your custom validation rules
    if question.get('difficulty') not in ['Easy', 'Medium', 'Hard']:
        return False

    # More rules...
    return True
```

## Best Practices

1. **Start Small** - Test with a few questions first
2. **Review JSON** - Always check the extracted JSON before importing
3. **Create Topics First** - Set up topics/subtopics before importing questions
4. **Use Batch Import** - Import in batches of 50-100 for better error handling
5. **Keep Backups** - Save JSON files for reference
6. **Validate Data** - Check question count in database after import:

   ```sql
   SELECT exam, COUNT(*) FROM questions GROUP BY exam;
   ```

7. **Use Version Control** - Track your JSON files in git

## Next Steps

After importing questions:

1. **Verify in Supabase Dashboard** - Check the questions table
2. **Test in ExamBot UI** - Browse and practice with imported questions
3. **Add More PDFs** - Continue importing questions
4. **Create Custom Tests** - Use the questions in mock tests

---

For issues or questions, refer to the code comments in:
- `pdf_to_json_extractor.py`
- `import_to_supabase.py`
- `question_importer_cli.py`
