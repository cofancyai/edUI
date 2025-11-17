import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Missing Supabase credentials in .env file")
    exit(1)

# Create Supabase client
supabase = create_client(supabase_url, supabase_key)

print("=" * 60)
print("DATABASE CONTENT ANALYSIS")
print("=" * 60)

# Check total questions
try:
    response = supabase.table('questions').select('*', count='exact').execute()
    total_count = response.count if hasattr(response, 'count') else len(response.data)
    print(f"\nTotal Questions: {total_count}")
except Exception as e:
    print(f"Error counting questions: {e}")
    total_count = 0

if total_count > 0:
    # Get unique exams
    print("\n" + "=" * 60)
    print("UNIQUE EXAMS:")
    print("=" * 60)
    try:
        response = supabase.table('questions').select('exam').execute()
        exams = list(set([q['exam'] for q in response.data if q.get('exam')]))
        for exam in sorted(exams):
            count = len([q for q in response.data if q.get('exam') == exam])
            print(f"  - {exam}: {count} questions")
    except Exception as e:
        print(f"Error: {e}")

    # Get unique subjects
    print("\n" + "=" * 60)
    print("UNIQUE SUBJECTS:")
    print("=" * 60)
    try:
        response = supabase.table('questions').select('exam, subject').execute()
        subjects_by_exam = {}
        for q in response.data:
            exam = q.get('exam', 'Unknown')
            subject = q.get('subject', 'Unknown')
            if exam not in subjects_by_exam:
                subjects_by_exam[exam] = set()
            subjects_by_exam[exam].add(subject)
        
        for exam in sorted(subjects_by_exam.keys()):
            print(f"\n{exam}:")
            for subject in sorted(subjects_by_exam[exam]):
                count = len([q for q in response.data if q.get('exam') == exam and q.get('subject') == subject])
                print(f"  - {subject}: {count} questions")
    except Exception as e:
        print(f"Error: {e}")

    # Get unique years
    print("\n" + "=" * 60)
    print("UNIQUE YEARS:")
    print("=" * 60)
    try:
        response = supabase.table('questions').select('exam, year').execute()
        years_by_exam = {}
        for q in response.data:
            exam = q.get('exam', 'Unknown')
            year = q.get('year')
            if year is not None:
                if exam not in years_by_exam:
                    years_by_exam[exam] = set()
                years_by_exam[exam].add(year)
        
        for exam in sorted(years_by_exam.keys()):
            years = sorted(list(years_by_exam[exam]))
            print(f"{exam}: {years}")
    except Exception as e:
        print(f"Error: {e}")

    # Get unique difficulties
    print("\n" + "=" * 60)
    print("UNIQUE DIFFICULTIES:")
    print("=" * 60)
    try:
        response = supabase.table('questions').select('difficulty').execute()
        difficulties = [q.get('difficulty') for q in response.data if q.get('difficulty')]
        unique_difficulties = list(set(difficulties))
        for diff in sorted(unique_difficulties):
            count = difficulties.count(diff)
            print(f"  - {diff}: {count} questions")
    except Exception as e:
        print(f"Error: {e}")

    # Show sample questions
    print("\n" + "=" * 60)
    print("SAMPLE QUESTIONS (First 3):")
    print("=" * 60)
    try:
        response = supabase.table('questions').select('id, exam, subject, topic, year, difficulty').limit(3).execute()
        for i, q in enumerate(response.data, 1):
            print(f"\n{i}. ID: {q.get('id')}")
            print(f"   Exam: {q.get('exam')}")
            print(f"   Subject: {q.get('subject')}")
            print(f"   Topic: {q.get('topic')}")
            print(f"   Year: {q.get('year')}")
            print(f"   Difficulty: {q.get('difficulty')}")
    except Exception as e:
        print(f"Error: {e}")

else:
    print("\n⚠️ NO QUESTIONS FOUND IN DATABASE!")
    print("The questions table is empty. You need to import questions first.")
    print("\nTo import questions from PDF:")
    print("  python question_importer_cli.py full your_questions.pdf \\")
    print("    --exam UPSC --year 2024 --subject History \\")
    print("    --topic \"History\" --topic-id HIST")

print("\n" + "=" * 60)
