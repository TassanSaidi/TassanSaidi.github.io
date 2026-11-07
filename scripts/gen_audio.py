#!/usr/bin/env python3
"""Generate MP3 audio for Hugo posts using Kokoro TTS.

Setup:
    pip install kokoro-onnx soundfile
    sudo apt-get install espeak-ng ffmpeg   # Linux
    brew install espeak ffmpeg              # macOS

    Download model files (cached by CI):
      mkdir -p .kokoro
      curl -L -o .kokoro/kokoro-v1.0.onnx \
        https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
      curl -L -o .kokoro/voices-v1.0.bin \
        https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Usage:
    python scripts/gen_audio.py              # all posts
    python scripts/gen_audio.py --force      # re-generate all
    python scripts/gen_audio.py --changed    # only posts changed in last commit
    python scripts/gen_audio.py content/posts/my-post.md
"""

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

POSTS_DIR = Path("content/posts")
AUDIO_DIR = Path("static/audio/posts")
VOICE = "af_heart"   # warm, natural-sounding female voice
MODEL_DIR = Path(os.environ.get("KOKORO_MODEL_DIR", ".kokoro"))


def extract_text(md_path: Path) -> str:
    text = md_path.read_text(encoding="utf-8")

    # Extract title from frontmatter before stripping it
    title_match = re.search(
        r'^---\n.*?^title:\s*["\']?(.+?)["\']?\s*$.*?\n---\n',
        text, flags=re.DOTALL | re.MULTILINE
    )
    title = title_match.group(1).strip() if title_match else ""

    # Strip YAML frontmatter
    text = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.DOTALL)

    # Strip Hugo shortcodes (figures, embedded content markers)
    text = re.sub(r"\{\{<.*?>\}\}", " ", text, flags=re.DOTALL)

    # Strip "[embedded content: ...]" placeholders used on this site
    text = re.sub(r"\[embedded content:[^\]]*\]", " ", text)

    # Strip Markdown image syntax
    text = re.sub(r"!\[.*?\]\(.*?\)", " ", text)

    # Strip entire HTML block elements that should not be narrated
    for block_tag in ("figure", "svg", "aside", "table", "pre", "code"):
        text = re.sub(
            rf"<{block_tag}(?:\s[^>]*)?>.*?</{block_tag}>",
            " ", text, flags=re.DOTALL | re.IGNORECASE
        )
    # Strip self-closing img tags (alt text should not be read)
    text = re.sub(r"<img\s[^>]*/?>", " ", text, flags=re.IGNORECASE)
    # Strip remaining HTML tags (keep the text content between them)
    text = re.sub(r"<[^>]+>", " ", text)

    # Strip Markdown links but keep link text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)

    # Strip bold/italic markers
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}([^_]+)_{1,3}", r"\1", text)

    # Strip ATX heading markers; add trailing period so TTS pauses after each heading
    def _heading_with_pause(m):
        heading = m.group(1).strip()
        return heading if re.search(r"[.!?]$", heading) else heading + "."
    text = re.sub(r"^#{1,6}\s+(.+)$", _heading_with_pause, text, flags=re.MULTILINE)

    # Add period before paragraph breaks where paragraph doesn't end in punctuation,
    # so TTS pauses naturally between paragraphs
    text = re.sub(r"([^\S\n]*[^.!?,\n])(\n\n)", r"\1.\2", text)

    # Collapse excess whitespace
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    # Prepend title so it's read aloud before the body, with a pause after
    if title:
        text = title + ".\n\n" + text

    return text


def generate(md_path: Path, force: bool = False) -> Path:
    slug = md_path.stem
    out_path = AUDIO_DIR / f"{slug}.mp3"

    if out_path.exists() and not force:
        print(f"  skip {slug} (exists, use --force to regenerate)")
        return out_path

    print(f"  generating {slug} ...", flush=True)
    text = extract_text(md_path)
    if not text.strip():
        print(f"  skip {slug} (no readable text)")
        return out_path

    try:
        from kokoro_onnx import Kokoro
        import soundfile as sf
    except ImportError:
        sys.exit("Error: run  pip install kokoro-onnx soundfile  first")

    model_file = MODEL_DIR / "kokoro-v1.0.onnx"
    voices_file = MODEL_DIR / "voices-v1.0.bin"
    if not model_file.exists() or not voices_file.exists():
        sys.exit(
            f"Error: Kokoro model files not found in {MODEL_DIR}/\n"
            "See the script docstring for download instructions."
        )

    kokoro = Kokoro(str(model_file), str(voices_file))
    samples, sample_rate = kokoro.create(text, voice=VOICE, speed=1.0, lang="en-us")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    wav_path = out_path.with_suffix(".wav")
    sf.write(str(wav_path), samples, sample_rate)

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path),
         "-codec:a", "libmp3lame", "-qscale:a", "4", str(out_path)],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
    )
    wav_path.unlink(missing_ok=True)

    if result.returncode != 0:
        sys.exit(f"ffmpeg failed: {result.stderr.decode()}")

    size_kb = out_path.stat().st_size // 1024
    print(f"  → {out_path} ({size_kb} KB)")
    return out_path


def changed_posts() -> list[Path]:
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
        capture_output=True, text=True,
    )
    return [Path(p) for p in result.stdout.splitlines()
            if p.startswith("content/posts/") and p.endswith(".md")]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Kokoro TTS audio for Hugo posts")
    parser.add_argument("posts", nargs="*", metavar="FILE", help="Specific post .md files")
    parser.add_argument("--force", action="store_true", help="Re-generate existing audio")
    parser.add_argument("--changed", action="store_true",
                        help="Only posts changed in the last commit")
    args = parser.parse_args()

    if args.posts:
        paths = [Path(p) for p in args.posts]
    elif args.changed:
        paths = changed_posts()
        if not paths:
            print("No changed posts found.")
            return
    else:
        paths = sorted(p for p in POSTS_DIR.glob("*.md") if p.name != "_index.md")

    for p in paths:
        if not p.exists():
            print(f"  not found: {p}", file=sys.stderr)
            continue
        generate(p, force=args.force)


if __name__ == "__main__":
    main()
