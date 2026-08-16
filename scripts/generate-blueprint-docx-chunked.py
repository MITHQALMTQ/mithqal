#!/usr/bin/env python3
"""
MITHQAL v25.0 — Chunked .docx generator for the FINAL blueprint.

Splits the 73K-line markdown into chunks, generates a docx per chunk, then
merges them. This avoids the memory ceiling of holding the entire Document
object in memory at once.
"""
import os
import sys
import time
import shutil
import tempfile
import subprocess

INPUT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md"
OUTPUT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.docx"
GEN_SCRIPT = "/home/z/my-project/scripts/generate-blueprint-docx-v2.py"
CHUNK_SIZE = 5000  # lines per chunk — keep small to avoid memory ceiling
TMP_DIR = "/tmp/blueprint-chunks"


def split_blueprint():
    """Split the blueprint markdown into chunks of CHUNK_SIZE lines."""
    os.makedirs(TMP_DIR, exist_ok=True)
    # Clean previous chunks
    for f in os.listdir(TMP_DIR):
        if f.endswith(".md"):
            os.remove(os.path.join(TMP_DIR, f))

    with open(INPUT, "r", encoding="utf-8") as f:
        lines = f.readlines()

    total = len(lines)
    print(f"Splitting {total} lines into chunks of {CHUNK_SIZE}", flush=True)

    chunks = []
    chunk_idx = 0
    start = 0
    while start < total:
        end = min(start + CHUNK_SIZE, total)
        chunk_file = os.path.join(TMP_DIR, f"chunk-{chunk_idx:03d}.md")
        with open(chunk_file, "w", encoding="utf-8") as cf:
            cf.writelines(lines[start:end])
        chunks.append((chunk_file, end - start))
        print(f"  Chunk {chunk_idx}: lines {start}-{end} ({end - start} lines)", flush=True)
        chunk_idx += 1
        start = end
    return chunks


def generate_chunk_docx(chunk_md, chunk_docx):
    """Generate a docx for one chunk using the v2 generator."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("g", GEN_SCRIPT)
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    g.INPUT = chunk_md
    g.OUTPUT = chunk_docx
    g.main()


def merge_docx(chunk_docx_files, output_path):
    """Merge multiple docx files into one using python-docx-compose."""
    try:
        from docxcompose.composer import Composer
        from docx import Document
    except ImportError:
        print("Installing docxcompose...", flush=True)
        os.system(f"{sys.executable} -m pip install docxcompose --quiet")
        from docxcompose.composer import Composer
        from docx import Document

    print(f"Merging {len(chunk_docx_files)} docx files...", flush=True)
    master = Document(chunk_docx_files[0])
    composer = Composer(master)
    for i, chunk in enumerate(chunk_docx_files[1:], 1):
        print(f"  Appending chunk {i}: {os.path.basename(chunk)}", flush=True)
        composer.append(Document(chunk))
    print(f"Saving merged docx to: {output_path}", flush=True)
    master.save(output_path)
    final_size = os.path.getsize(output_path)
    print(f"Done. Size: {final_size:,} bytes ({final_size / 1024 / 1024:.1f} MB)", flush=True)


def main():
    start_time = time.time()
    chunks = split_blueprint()

    # Generate docx for each chunk
    chunk_docx_files = []
    for chunk_md, line_count in chunks:
        chunk_docx = chunk_md.replace(".md", ".docx")
        print(f"\n=== Generating docx for {os.path.basename(chunk_md)} ({line_count} lines) ===", flush=True)
        chunk_start = time.time()
        generate_chunk_docx(chunk_md, chunk_docx)
        chunk_elapsed = time.time() - chunk_start
        chunk_size = os.path.getsize(chunk_docx)
        print(f"  Chunk docx: {chunk_size:,} bytes, took {chunk_elapsed:.1f}s", flush=True)
        chunk_docx_files.append(chunk_docx)

    # Merge all chunk docx files into the final output
    print(f"\n=== Merging {len(chunk_docx_files)} chunk docx files ===", flush=True)
    merge_docx(chunk_docx_files, OUTPUT)

    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed:.1f}s", flush=True)
    print(f"Final output: {OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
