#!/usr/bin/env python3
"""
Question Importer CLI
Easy-to-use command line tool for extracting questions from PDFs and importing to Supabase
"""

import argparse
import sys
import os
from pdf_to_json_extractor import process_pdf
from import_to_supabase import import_from_json, create_topic_if_not_exists, create_subtopic_if_not_exists

def main():
    parser = argparse.ArgumentParser(
        description='Extract questions from PDF and import to Supabase',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract questions from PDF and save to JSON
  python question_importer_cli.py extract upsc_history.pdf --exam UPSC --year 2024 --subject History --topic "Modern Indian History" --topic-id HIST

  # Import questions from JSON to Supabase
  python question_importer_cli.py import questions.json

  # Full pipeline: Extract and import in one command
  python question_importer_cli.py full upsc_history.pdf --exam UPSC --year 2024 --subject History --topic "Modern Indian History" --topic-id HIST --subtopic "Freedom Movement" --subtopic-id HIST-MOD-FREE

  # Create topic in database
  python question_importer_cli.py create-topic HIST "Modern Indian History" --description "Questions on modern Indian history"

  # Create subtopic in database
  python question_importer_cli.py create-subtopic HIST-MOD-FREE HIST "Freedom Movement"
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Extract command
    extract_parser = subparsers.add_parser('extract', help='Extract questions from PDF to JSON')
    extract_parser.add_argument('pdf_file', help='Path to PDF file')
    extract_parser.add_argument('--exam', required=True, help='Exam name (e.g., UPSC, SSC)')
    extract_parser.add_argument('--year', type=int, required=True, help='Year')
    extract_parser.add_argument('--subject', required=True, help='Subject name (e.g., History, Polity)')
    extract_parser.add_argument('--topic', required=True, help='Topic name')
    extract_parser.add_argument('--topic-id', required=True, help='Topic ID (e.g., HIST, POLY)')
    extract_parser.add_argument('--subtopic', help='Subtopic name (optional)')
    extract_parser.add_argument('--subtopic-id', help='Subtopic ID (optional)')
    extract_parser.add_argument('--output', '-o', help='Output JSON file (default: auto-generated)')

    # Import command
    import_parser = subparsers.add_parser('import', help='Import questions from JSON to Supabase')
    import_parser.add_argument('json_file', help='Path to JSON file')
    import_parser.add_argument('--batch-size', type=int, default=50, help='Batch size for import (default: 50)')

    # Full pipeline command
    full_parser = subparsers.add_parser('full', help='Extract from PDF and import to Supabase')
    full_parser.add_argument('pdf_file', help='Path to PDF file')
    full_parser.add_argument('--exam', required=True, help='Exam name (e.g., UPSC, SSC)')
    full_parser.add_argument('--year', type=int, required=True, help='Year')
    full_parser.add_argument('--subject', required=True, help='Subject name (e.g., History, Polity)')
    full_parser.add_argument('--topic', required=True, help='Topic name')
    full_parser.add_argument('--topic-id', required=True, help='Topic ID (e.g., HIST, POLY)')
    full_parser.add_argument('--subtopic', help='Subtopic name (optional)')
    full_parser.add_argument('--subtopic-id', help='Subtopic ID (optional)')
    full_parser.add_argument('--batch-size', type=int, default=50, help='Batch size for import (default: 50)')
    full_parser.add_argument('--keep-json', action='store_true', help='Keep JSON file after import')

    # Create topic command
    create_topic_parser = subparsers.add_parser('create-topic', help='Create topic in database')
    create_topic_parser.add_argument('topic_id', help='Topic ID (e.g., HIST)')
    create_topic_parser.add_argument('topic_name', help='Topic name (e.g., "Modern Indian History")')
    create_topic_parser.add_argument('--description', help='Topic description')

    # Create subtopic command
    create_subtopic_parser = subparsers.add_parser('create-subtopic', help='Create subtopic in database')
    create_subtopic_parser.add_argument('subtopic_id', help='Subtopic ID (e.g., HIST-MOD-FREE)')
    create_subtopic_parser.add_argument('topic_id', help='Parent topic ID (e.g., HIST)')
    create_subtopic_parser.add_argument('subtopic_name', help='Subtopic name (e.g., "Freedom Movement")')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    if args.command == 'extract':
        handle_extract(args)
    elif args.command == 'import':
        handle_import(args)
    elif args.command == 'full':
        handle_full_pipeline(args)
    elif args.command == 'create-topic':
        handle_create_topic(args)
    elif args.command == 'create-subtopic':
        handle_create_subtopic(args)

def handle_extract(args):
    """Handle extract command"""
    print(f"\n🚀 Extracting questions from {args.pdf_file}")

    if not os.path.exists(args.pdf_file):
        print(f"❌ Error: PDF file '{args.pdf_file}' not found")
        sys.exit(1)

    output_file = args.output or f"questions_{args.exam}_{args.year}_{args.topic_id}.json"

    questions = process_pdf(
        pdf_path=args.pdf_file,
        exam_type=args.exam,
        year=args.year,
        subject=args.subject,
        topic=args.topic,
        topic_id=args.topic_id,
        subtopic=args.subtopic,
        subtopic_id=args.subtopic_id,
        output_file=output_file
    )

    if questions:
        print(f"\n✅ Success! Extracted {len(questions)} questions to {output_file}")
    else:
        print(f"\n❌ Failed to extract questions")
        sys.exit(1)

def handle_import(args):
    """Handle import command"""
    print(f"\n📤 Importing questions from {args.json_file}")

    if not os.path.exists(args.json_file):
        print(f"❌ Error: JSON file '{args.json_file}' not found")
        sys.exit(1)

    stats = import_from_json(args.json_file, batch_size=args.batch_size)

    if stats['imported'] > 0:
        print(f"\n✅ Success! Imported {stats['imported']} questions")
    else:
        print(f"\n❌ No questions imported")
        sys.exit(1)

def handle_full_pipeline(args):
    """Handle full pipeline command"""
    print(f"\n🚀 Starting Full Pipeline: Extract → Import")

    if not os.path.exists(args.pdf_file):
        print(f"❌ Error: PDF file '{args.pdf_file}' not found")
        sys.exit(1)

    # Step 1: Extract
    temp_json = f"temp_questions_{args.exam}_{args.year}_{args.topic_id}.json"

    print(f"\n{'='*60}")
    print(f"STEP 1: Extracting from PDF")
    print(f"{'='*60}")

    questions = process_pdf(
        pdf_path=args.pdf_file,
        exam_type=args.exam,
        year=args.year,
        subject=args.subject,
        topic=args.topic,
        topic_id=args.topic_id,
        subtopic=args.subtopic,
        subtopic_id=args.subtopic_id,
        output_file=temp_json
    )

    if not questions:
        print(f"\n❌ Failed to extract questions")
        sys.exit(1)

    # Step 2: Import
    print(f"\n{'='*60}")
    print(f"STEP 2: Importing to Supabase")
    print(f"{'='*60}")

    stats = import_from_json(temp_json, batch_size=args.batch_size)

    # Step 3: Cleanup
    if not args.keep_json:
        try:
            os.remove(temp_json)
            print(f"\n🗑️  Cleaned up temporary file: {temp_json}")
        except:
            pass
    else:
        print(f"\n💾 Kept JSON file: {temp_json}")

    # Summary
    print(f"\n{'='*60}")
    print(f"🎉 PIPELINE COMPLETE!")
    print(f"{'='*60}")
    print(f"Extracted: {len(questions)} questions")
    print(f"Imported: {stats['imported']} questions")
    print(f"Skipped: {stats['skipped']} questions")
    print(f"Errors: {stats['errors']} questions")
    print(f"{'='*60}")

def handle_create_topic(args):
    """Handle create topic command"""
    print(f"\n📝 Creating topic: {args.topic_name} ({args.topic_id})")

    success = create_topic_if_not_exists(
        args.topic_id,
        args.topic_name,
        args.description
    )

    if success:
        print(f"\n✅ Topic created successfully!")
    else:
        print(f"\n❌ Failed to create topic")
        sys.exit(1)

def handle_create_subtopic(args):
    """Handle create subtopic command"""
    print(f"\n📝 Creating subtopic: {args.subtopic_name} ({args.subtopic_id})")

    success = create_subtopic_if_not_exists(
        args.subtopic_id,
        args.topic_id,
        args.subtopic_name
    )

    if success:
        print(f"\n✅ Subtopic created successfully!")
    else:
        print(f"\n❌ Failed to create subtopic")
        sys.exit(1)

if __name__ == '__main__':
    main()
