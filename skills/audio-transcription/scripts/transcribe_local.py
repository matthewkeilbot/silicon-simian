#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    p = argparse.ArgumentParser(description="Local audio transcription with faster-whisper")
    p.add_argument("--input", required=True, help="Path to audio file")
    p.add_argument("--model", default="small.en", help="Model name: tiny.en|base.en|small.en|medium.en|large-v3")
    p.add_argument("--device", default="cpu", help="cpu or cuda")
    p.add_argument("--compute-type", default="int8", help="int8/int8_float16/float16/float32")
    p.add_argument("--beam-size", type=int, default=5)
    p.add_argument("--language", default="en")
    p.add_argument("--json", action="store_true", help="Output JSON")
    args = p.parse_args()

    audio = Path(args.input)
    if not audio.exists():
        raise SystemExit(f"Input not found: {audio}")

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(
        str(audio),
        beam_size=args.beam_size,
        language=args.language,
        vad_filter=True,
    )

    segs = []
    full = []
    for s in segments:
        text = s.text.strip()
        if not text:
            continue
        segs.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": text})
        full.append(text)

    result = {
        "input": str(audio),
        "model": args.model,
        "detected_language": info.language,
        "language_probability": info.language_probability,
        "duration_seconds": round(getattr(info, "duration", 0.0) or 0.0, 2),
        "segments": segs,
        "transcript": " ".join(full).strip(),
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Model: {result['model']}")
        print(f"Detected language: {result['detected_language']} ({result['language_probability']:.2f})")
        print(f"Duration: {result['duration_seconds']}s")
        print("\nTranscript:\n")
        print(result["transcript"])


if __name__ == "__main__":
    main()
