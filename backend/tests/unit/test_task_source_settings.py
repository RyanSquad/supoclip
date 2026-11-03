import pytest

from src.api.routes.tasks import _merge_task_source_metadata
from src.services.task_service import TaskService


class _FailingRedisClient:
    async def get(self, _key: str):
        raise RuntimeError("redis unavailable")

    async def aclose(self):
        return None


class _RedisClient:
    def __init__(self, payload: str):
        self.payload = payload

    async def get(self, _key: str):
        return self.payload

    async def aclose(self):
        return None


@pytest.mark.asyncio
async def test_load_task_source_settings_falls_back_when_redis_fails(monkeypatch):
    monkeypatch.setattr(
        "src.services.clip_service.redis.Redis",
        lambda **_kwargs: _FailingRedisClient(),
    )

    service = TaskService(db=None)
    settings = await service._load_task_source_settings("task-123")

    assert settings["output_format"] == "vertical"
    assert settings["output_formats"] == ["vertical"]
    assert settings["add_subtitles"] is True
    assert settings["clip_length"] == "auto"
    assert settings["clip_lengths"] == ["auto"]
    assert settings["cut_long_pauses"] is False
    assert settings["pause_threshold_ms"] == 1200
    assert settings["remove_filler_words"] is False
    assert settings["filtered_words"] == []


def test_merge_task_source_metadata_backfills_required_fields():
    merged = _merge_task_source_metadata(
        {},
        source_url="upload://demo.mp4",
        source_type="video_url",
        output_format="vertical",
        add_subtitles=True,
        cleanup_settings={
            "cut_long_pauses": True,
            "pause_threshold_ms": 900,
            "remove_filler_words": False,
            "filtered_words": [],
        },
    )

    assert merged == {
        "url": "upload://demo.mp4",
        "source_type": "video_url",
        "output_format": "vertical",
        "output_formats": ["vertical"],
        "add_subtitles": True,
        "cut_long_pauses": True,
        "pause_threshold_ms": 900,
        "remove_filler_words": False,
        "filtered_words": [],
    }


def test_merge_task_source_metadata_preserves_existing_render_settings():
    merged = _merge_task_source_metadata(
        {
            "url": "upload://demo.mp4",
            "source_type": "video_url",
            "output_format": "original",
            "add_subtitles": False,
        },
        cleanup_settings={
            "cut_long_pauses": True,
            "pause_threshold_ms": 1200,
            "remove_filler_words": True,
            "filtered_words": ["basically"],
        },
    )

    assert merged["output_format"] == "original"
    assert merged["add_subtitles"] is False
    assert merged["cut_long_pauses"] is True
    assert merged["pause_threshold_ms"] == 1200
    assert merged["remove_filler_words"] is True
    assert merged["filtered_words"] == ["basically"]


@pytest.mark.parametrize("output_format", ["vertical_split", "vertical_fit"])
def test_merge_task_source_metadata_accepts_smart_vertical_modes(output_format):
    merged = _merge_task_source_metadata(
        {},
        source_url="upload://demo.mp4",
        source_type="video_url",
        output_format=output_format,
        add_subtitles=True,
    )

    assert merged["output_format"] == output_format
    assert merged["output_formats"] == [output_format]


def test_merge_task_source_metadata_accepts_multiple_formats():
    merged = _merge_task_source_metadata(
        {},
        source_url="upload://demo.mp4",
        source_type="video_url",
        output_formats=["vertical", "vertical_fit", "original", "vertical"],
        add_subtitles=True,
    )

    assert merged["output_format"] == "vertical"
    assert merged["output_formats"] == ["vertical", "vertical_fit", "original"]


@pytest.mark.asyncio
async def test_load_task_source_settings_accepts_multiple_clip_lengths(monkeypatch):
    import json

    payload = json.dumps({
        "clip_lengths": ["short", "extra_long"],
        "output_formats": ["vertical", "original"],
        "add_subtitles": True,
    })
    monkeypatch.setattr(
        "src.services.clip_service.redis.Redis",
        lambda **_kwargs: _RedisClient(payload),
    )

    service = TaskService(db=None)
    settings = await service._load_task_source_settings("task-123")

    assert settings["clip_length"] == "short"
    assert settings["clip_lengths"] == ["short", "extra_long"]
    assert settings["output_formats"] == ["vertical", "original"]


@pytest.mark.asyncio
@pytest.mark.parametrize("output_format", ["vertical_pan", "vertical_fit"])
async def test_load_task_source_settings_accepts_smart_vertical_mode(monkeypatch, output_format):
    import json

    payload = json.dumps({"output_format": output_format, "add_subtitles": True})
    monkeypatch.setattr(
        "src.services.clip_service.redis.Redis",
        lambda **_kwargs: _RedisClient(payload),
    )

    service = TaskService(db=None)
    settings = await service._load_task_source_settings("task-123")

    assert settings["output_format"] == output_format
