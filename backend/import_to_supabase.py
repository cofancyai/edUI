"""
Import Questions to Supabase
Imports JSON questions to Supabase database
"""

import json
import os
from typing import List, Dict, Any
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your_supabase_service_key_here')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_json_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Load questions from JSON file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        print(f"✅ Loaded {len(questions)} questions from {file_path}")
        return questions
    except Exception as e:
        print(f"❌ Error loading JSON file: {e}")
        return []

def validate_question(question: Dict[str, Any]) -> bool:
    """
    Validate question data before import
    """
    required_fields = [
        'id', 'exam', 'topic', 'subtopic', 'question',
        'options', 'answer', 'subject'
    ]

    for field in required_fields:
        if field not in question or not question[field]:
            print(f"⚠️  Missing required field '{field}' in question {question.get('id', 'UNKNOWN')}")
            return False

    # Validate options is a list
    if not isinstance(question['options'], list) or len(question['options']) < 2:
        print(f"⚠️  Invalid options format in question {question['id']}")
        return False

    # Validate answer is A, B, C, or D
    if question['answer'] not in ['A', 'B', 'C', 'D']:
        print(f"⚠️  Invalid answer '{question['answer']}' in question {question['id']}")
        return False

    return True

def check_topic_exists(topic_id: str) -> bool:
    """
    Check if topic exists in database, create if not
    """
    try:
        response = supabase.table('topics').select('id').eq('id', topic_id).execute()

        if response.data:
            return True

        print(f"ℹ️  Topic {topic_id} not found in database")
        return False

    except Exception as e:
        print(f"⚠️  Error checking topic: {e}")
        return False

def check_subtopic_exists(subtopic_id: str, topic_id: str) -> bool:
    """
    Check if subtopic exists in database, create if not
    """
    try:
        response = supabase.table('subtopics').select('id').eq('id', subtopic_id).execute()

        if response.data:
            return True

        print(f"ℹ️  Subtopic {subtopic_id} not found in database")
        return False

    except Exception as e:
        print(f"⚠️  Error checking subtopic: {e}")
        return False

def import_questions_batch(questions: List[Dict[str, Any]], batch_size: int = 50) -> Dict[str, int]:
    """
    Import questions to Supabase in batches
    """
    total = len(questions)
    imported = 0
    skipped = 0
    errors = 0

    print(f"\n{'='*60}")
    print(f"📤 Starting Import to Supabase")
    print(f"{'='*60}")
    print(f"Total Questions: {total}")
    print(f"Batch Size: {batch_size}")
    print(f"{'='*60}\n")

    for i in range(0, total, batch_size):
        batch = questions[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size

        print(f"📦 Processing Batch {batch_num}/{total_batches} ({len(batch)} questions)...")

        # Validate batch
        valid_questions = []
        for q in batch:
            if validate_question(q):
                # Remove created_at and updated_at as they have defaults
                q_clean = {k: v for k, v in q.items() if k not in ['created_at', 'updated_at']}
                valid_questions.append(q_clean)
            else:
                skipped += 1

        if not valid_questions:
            print(f"⚠️  No valid questions in batch {batch_num}, skipping...")
            continue

        try:
            # Use upsert to handle duplicates
            response = supabase.table('questions').upsert(
                valid_questions,
                on_conflict='id'  # Update if ID exists
            ).execute()

            batch_imported = len(valid_questions)
            imported += batch_imported
            print(f"  ✅ Imported {batch_imported} questions")

        except Exception as e:
            print(f"  ❌ Error importing batch {batch_num}: {e}")
            errors += len(valid_questions)

    print(f"\n{'='*60}")
    print(f"📊 Import Summary")
    print(f"{'='*60}")
    print(f"✅ Successfully Imported: {imported}")
    print(f"⚠️  Skipped (Invalid): {skipped}")
    print(f"❌ Errors: {errors}")
    print(f"📈 Total Processed: {total}")
    print(f"{'='*60}\n")

    return {
        'imported': imported,
        'skipped': skipped,
        'errors': errors,
        'total': total
    }

def import_from_json(json_file: str, batch_size: int = 50) -> Dict[str, int]:
    """
    Main function to import questions from JSON file to Supabase

    Args:
        json_file: Path to JSON file with questions
        batch_size: Number of questions to import per batch

    Returns:
        Dictionary with import statistics
    """
    # Load questions
    questions = load_json_file(json_file)

    if not questions:
        return {'imported': 0, 'skipped': 0, 'errors': 0, 'total': 0}

    # Import to Supabase
    stats = import_questions_batch(questions, batch_size)

    return stats

def verify_import(question_ids: List[str]) -> Dict[str, Any]:
    """
    Verify imported questions in database
    """
    print(f"\n🔍 Verifying {len(question_ids)} questions in database...")

    try:
        response = supabase.table('questions').select('id').in_('id', question_ids).execute()

        found = len(response.data)
        missing = len(question_ids) - found

        print(f"✅ Found: {found}")
        print(f"❌ Missing: {missing}")

        return {
            'found': found,
            'missing': missing,
            'found_ids': [q['id'] for q in response.data]
        }

    except Exception as e:
        print(f"❌ Error verifying: {e}")
        return {'found': 0, 'missing': len(question_ids), 'found_ids': []}

def create_topic_if_not_exists(topic_id: str, topic_name: str, description: str = None):
    """
    Create topic in database if it doesn't exist
    """
    try:
        # Check if exists
        response = supabase.table('topics').select('id').eq('id', topic_id).execute()

        if response.data:
            print(f"ℹ️  Topic {topic_id} already exists")
            return True

        # Create topic
        topic_data = {
            'id': topic_id,
            'name': topic_name,
            'description': description or f"{topic_name} - Questions"
        }

        supabase.table('topics').insert(topic_data).execute()
        print(f"✅ Created topic: {topic_name} ({topic_id})")
        return True

    except Exception as e:
        print(f"❌ Error creating topic: {e}")
        return False

def create_subtopic_if_not_exists(subtopic_id: str, topic_id: str, subtopic_name: str):
    """
    Create subtopic in database if it doesn't exist
    """
    try:
        # Check if exists
        response = supabase.table('subtopics').select('id').eq('id', subtopic_id).execute()

        if response.data:
            print(f"ℹ️  Subtopic {subtopic_id} already exists")
            return True

        # Create subtopic
        subtopic_data = {
            'id': subtopic_id,
            'topic_id': topic_id,
            'name': subtopic_name,
            'file': 'exambot_question'
        }

        supabase.table('subtopics').insert(subtopic_data).execute()
        print(f"✅ Created subtopic: {subtopic_name} ({subtopic_id})")
        return True

    except Exception as e:
        print(f"❌ Error creating subtopic: {e}")
        return False

# Example usage
if __name__ == "__main__":
    # Example: Import questions from JSON file

    # Optional: Create topics/subtopics first
    # create_topic_if_not_exists('HIST', 'History', 'History questions')
    # create_subtopic_if_not_exists('HIST-MOD-FREE', 'HIST', 'Freedom Movement')

    # Import questions
    stats = import_from_json(
        json_file="upsc_history_2024_questions.json",
        batch_size=50
    )

    print(f"\n✅ Import completed!")
    print(f"Imported: {stats['imported']} questions")
