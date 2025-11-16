"""
PDF Question Extractor using AI
Extracts questions from PDF files and converts to JSON format matching the database schema
"""

import os
import json
import re
from typing import List, Dict, Any
from datetime import datetime
import PyPDF2
from mistralai import Mistral

# Initialize Mistral AI client
# TODO: Replace with your actual API key or get from Supabase credentials
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY', 'your_mistral_api_key_here')
client = Mistral(api_key=MISTRAL_API_KEY)

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text content from PDF file
    """
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)

            print(f"📄 Extracting text from {total_pages} pages...")

            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                text += f"\n--- Page {page_num} ---\n{page_text}"
                print(f"  ✓ Extracted page {page_num}/{total_pages}")

            print(f"✅ Extracted {len(text)} characters from PDF")
            return text

    except Exception as e:
        print(f"❌ Error extracting text from PDF: {e}")
        return ""

def parse_questions_with_ai(pdf_text: str, exam_type: str, year: int, subject: str, topic: str, topic_id: str, subtopic: str = None, subtopic_id: str = None) -> List[Dict[str, Any]]:
    """
    Use Mistral AI to parse questions from PDF text
    """

    prompt = f"""You are an expert at extracting questions from exam preparation materials.

Extract all questions from the following text and return them in STRICT JSON format.

IMPORTANT OUTPUT RULES:
1. Return ONLY a valid JSON array, nothing else
2. Do not include any markdown formatting, backticks, or code blocks
3. Do not include any explanatory text before or after the JSON
4. The entire response should be parseable as JSON

Each question object must have this EXACT structure:
{{
  "question": "The full question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "answer": "A" or "B" or "C" or "D",
  "detailed_explanation": "Detailed explanation of the correct answer",
  "difficulty": "Easy" or "Medium" or "Hard",
  "tags": ["relevant", "tags", "here"]
}}

EXTRACTION RULES:
1. Extract ALL questions from the text
2. For multiple choice questions, extract all options
3. Identify the correct answer (A, B, C, or D)
4. If explanation is provided, include it; otherwise generate a brief one
5. Assess difficulty based on question complexity
6. Generate relevant tags based on question content
7. If answer is given as "1 and 2 only" or similar, keep the option text as-is
8. Maintain the original question formatting and numbering if present

CONTEXT:
- Exam: {exam_type}
- Year: {year}
- Subject: {subject}
- Topic: {topic}
{f"- Subtopic: {subtopic}" if subtopic else ""}

TEXT TO PARSE:
{pdf_text}

Return the JSON array now:"""

    try:
        print("🤖 Processing with Mistral AI...")

        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent output
            max_tokens=16000
        )

        ai_response = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present (despite instructions)
        ai_response = re.sub(r'^```json\s*\n?', '', ai_response)
        ai_response = re.sub(r'\n?```\s*$', '', ai_response)
        ai_response = ai_response.strip()

        print(f"📝 AI Response length: {len(ai_response)} characters")

        # Parse the JSON response
        questions_data = json.loads(ai_response)

        if not isinstance(questions_data, list):
            print("⚠️  AI returned non-list response, wrapping in array")
            questions_data = [questions_data]

        print(f"✅ Extracted {len(questions_data)} questions")

        # Add metadata to each question
        for idx, q in enumerate(questions_data, 1):
            q['exam'] = exam_type
            q['year'] = year
            q['subject'] = subject
            q['topic'] = topic
            q['topic_id'] = topic_id
            q['subtopic'] = subtopic or topic
            q['subtopic_id'] = subtopic_id or topic_id
            q['question_number'] = idx
            q['question_type'] = 'multiple_choice'
            q['time_estimate'] = 90  # Default 90 seconds

        return questions_data

    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {e}")
        print(f"AI Response: {ai_response[:500]}...")
        return []
    except Exception as e:
        print(f"❌ Error processing with AI: {e}")
        return []

def generate_question_id(exam: str, year: int, subject_code: str, question_num: int) -> str:
    """
    Generate unique question ID in format: UPSC_2024_HIST_001
    """
    subject_abbrev = subject_code[:4].upper()
    return f"{exam}_{year}_{subject_abbrev}_{question_num:03d}"

def format_questions_for_database(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format questions to match the database schema
    """
    formatted_questions = []

    for q in questions:
        formatted_q = {
            'id': generate_question_id(
                q['exam'],
                q['year'],
                q.get('topic_id', 'GEN'),
                q['question_number']
            ),
            'exam': q['exam'],
            'year': q['year'],
            'topic': q['topic'],
            'subtopic': q['subtopic'],
            'topic_id': q['topic_id'],
            'subtopic_id': q['subtopic_id'],
            'question_number': q['question_number'],
            'question': q['question'],
            'options': q['options'],  # Already a JSON array
            'answer': q['answer'],
            'detailed_explanation': q.get('detailed_explanation', ''),
            'difficulty': q.get('difficulty', 'Medium'),
            'subject': q['subject'],
            'tags': q.get('tags', []),
            'time_estimate': q.get('time_estimate', 90),
            'question_type': q.get('question_type', 'multiple_choice'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        formatted_questions.append(formatted_q)

    return formatted_questions

def save_to_json(questions: List[Dict[str, Any]], output_file: str):
    """
    Save questions to JSON file
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved {len(questions)} questions to {output_file}")
    except Exception as e:
        print(f"❌ Error saving to JSON: {e}")

def process_pdf(
    pdf_path: str,
    exam_type: str,
    year: int,
    subject: str,
    topic: str,
    topic_id: str,
    subtopic: str = None,
    subtopic_id: str = None,
    output_file: str = None
) -> List[Dict[str, Any]]:
    """
    Main function to process PDF and extract questions

    Args:
        pdf_path: Path to PDF file
        exam_type: Exam name (e.g., "UPSC", "SSC")
        year: Year of questions
        subject: Subject name (e.g., "History", "Polity")
        topic: Topic name (e.g., "Modern Indian History")
        topic_id: Topic ID (e.g., "HIST", "POLY")
        subtopic: Subtopic name (optional)
        subtopic_id: Subtopic ID (optional)
        output_file: Output JSON file path (optional)

    Returns:
        List of formatted questions ready for database import
    """

    print(f"\n{'='*60}")
    print(f"🚀 Starting PDF Question Extraction")
    print(f"{'='*60}")
    print(f"📁 PDF File: {pdf_path}")
    print(f"📚 Exam: {exam_type} {year}")
    print(f"📖 Subject: {subject}")
    print(f"📑 Topic: {topic} ({topic_id})")
    if subtopic:
        print(f"📌 Subtopic: {subtopic} ({subtopic_id})")
    print(f"{'='*60}\n")

    # Step 1: Extract text from PDF
    pdf_text = extract_text_from_pdf(pdf_path)

    if not pdf_text:
        print("❌ Failed to extract text from PDF")
        return []

    # Step 2: Parse questions using AI
    questions = parse_questions_with_ai(
        pdf_text,
        exam_type,
        year,
        subject,
        topic,
        topic_id,
        subtopic,
        subtopic_id
    )

    if not questions:
        print("❌ No questions extracted")
        return []

    # Step 3: Format for database
    formatted_questions = format_questions_for_database(questions)

    # Step 4: Save to JSON
    if output_file:
        save_to_json(formatted_questions, output_file)
    else:
        default_output = f"questions_{exam_type}_{year}_{topic_id}.json"
        save_to_json(formatted_questions, default_output)

    print(f"\n{'='*60}")
    print(f"✅ Extraction Complete!")
    print(f"{'='*60}")
    print(f"Total Questions: {len(formatted_questions)}")
    print(f"{'='*60}\n")

    return formatted_questions

# Example usage
if __name__ == "__main__":
    # Example: Extract UPSC History questions from PDF
    questions = process_pdf(
        pdf_path="upsc_history_2024.pdf",
        exam_type="UPSC",
        year=2024,
        subject="History",
        topic="Modern Indian History",
        topic_id="HIST",
        subtopic="Freedom Movement",
        subtopic_id="HIST-MOD-FREE",
        output_file="upsc_history_2024_questions.json"
    )

    print(f"Extracted {len(questions)} questions")

    # Print first question as sample
    if questions:
        print("\n📝 Sample Question:")
        print(json.dumps(questions[0], indent=2))
