from types import SimpleNamespace
from pathlib import Path

import pytest

from src.media import transcription as transcription_module


def test_normalize_transcription_provider_accepts_elevenlabs(monkeypatch):
    from src.config import Config

    monkeypatch.setenv("TRANSCRIPTION_PROVIDER", "elevenlabs")
    assert Config().transcription_provider == "elevenlabs"


def test_elevenlabs_result_to_transcript_data_converts_seconds_and_speakers():
    payload = {
        "language_code": "eng",
        "text": "Hello world. Hi there.",
        "words": [
            {"text": "Hello", "type": "word", "start": 0.0, "end": 0.4, "speaker_id": "speaker_0"},
            {"text": " ", "type": "spacing", "start": 0.4, "end": 0.45},
            {"text": "world.", "type": "word", "start": 0.45, "end": 0.9, "speaker_id": "speaker_0"},
            {"text": "Hi", "type": "word", "start": 1.0, "end": 1.2, "speaker_id": "speaker_1"},
            {"text": "there.", "type": "word", "start": 1.2, "end": 1.6, "speaker_id": "speaker_1"},
            {"text": "(laughter)", "type": "audio_event", "start": 1.6, "end": 1.8},
        ],
    }

    cache = transcription_module._elevenlabs_result_to_transcript_data(payload)

    assert cache["language_code"] == "en"
    assert [word["text"] for word in cache["words"]] == ["Hello", "world.", "Hi", "there."]
    assert cache["words"][0]["start"] == 0
    assert cache["words"][0]["end"] == 400
    assert len(cache["utterances"]) == 2
    assert cache["utterances"][0]["speaker"] == "speaker_0"
    assert cache["utterances"][1]["speaker"] == "speaker_1"
    assert "Hello" in cache["utterances"][0]["text"]


def test_format_cache_transcript_splits_long_speaker_turns():
    """A single-speaker monologue must become many analysis lines."""
    words = [
        {
            "text": word,
            "start": index * 400,
            "end": index * 400 + 350,
            "confidence": 1.0,
            "speaker": "speaker_0",
        }
        for index, word in enumerate(
            (
                ["Hello"] * 20
                + ["world."]
                + ["This"] * 20
                + ["works."]
                + ["Really"] * 20
                + ["well."]
            )
        )
    ]
    cache = {
        "version": 1,
        "words": words,
        "utterances": [
            {
                "text": " ".join(word["text"] for word in words),
                "start": words[0]["start"],
                "end": words[-1]["end"],
                "speaker": "speaker_0",
                "words": words,
            }
        ],
        "text": " ".join(word["text"] for word in words),
        "language_code": "en",
    }

    lines = transcription_module._format_cache_transcript_for_analysis(cache)
    assert len(lines) > 1
    assert all(line.startswith("[") for line in lines)
    assert any("Speaker speaker_0:" in line for line in lines)


def test_elevenlabs_falls_back_to_whisper(monkeypatch, tmp_path: Path):
    video_path = tmp_path / "clip.mp4"
    video_path.write_bytes(b"fake")

    monkeypatch.setattr(
        transcription_module,
        "transcribe_with_elevenlabs",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("api down")),
    )
    monkeypatch.setattr(
        transcription_module,
        "_get_transcript_with_whisper",
        lambda video_path, runtime_config: "whisper fallback",
    )

    result = transcription_module._get_transcript_with_elevenlabs(
        video_path,
        SimpleNamespace(
            elevenlabs_api_key="test-key",
            elevenlabs_stt_model="scribe_v2",
            elevenlabs_stt_timeout_seconds=30,
            transcription_language="",
        ),
    )
    assert result == "whisper fallback"


def test_get_video_transcript_dispatches_to_elevenlabs(monkeypatch, tmp_path: Path):
    video_path = tmp_path / "clip.mp4"
    video_path.write_bytes(b"fake")
    called = {}

    monkeypatch.setattr(
        transcription_module,
        "get_config",
        lambda: SimpleNamespace(transcription_provider="elevenlabs"),
    )

    def fake_elevenlabs(path, runtime_config):
        called["path"] = path
        return "elevenlabs transcript"

    monkeypatch.setattr(
        transcription_module, "_get_transcript_with_elevenlabs", fake_elevenlabs
    )

    assert transcription_module.get_video_transcript(video_path) == "elevenlabs transcript"
    assert called["path"] == video_path
