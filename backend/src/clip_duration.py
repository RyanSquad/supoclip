"""Task-specific clip length presets shared by selection and rendering."""

from dataclasses import dataclass
from typing import Any, List


@dataclass(frozen=True)
class ClipDuration:
    minimum: int
    maximum: int
    ideal_minimum: int
    ideal_maximum: int


CLIP_DURATIONS = {
    "auto": ClipDuration(15, 60, 25, 50),
    # Ideal maxima leave room for the sentence rewind/extension before the cap.
    "short": ClipDuration(15, 30, 18, 25),
    "medium": ClipDuration(30, 60, 35, 55),
    "long": ClipDuration(60, 120, 75, 110),
    "extra_long": ClipDuration(120, 300, 150, 280),
}

CLIP_LENGTH_CHOICES = ", ".join(CLIP_DURATIONS)


def validate_clip_length(value: Any) -> str:
    if not isinstance(value, str) or value not in CLIP_DURATIONS:
        raise ValueError(f"clip_length must be {CLIP_LENGTH_CHOICES}")
    return value


def normalize_clip_length(value: Any) -> str:
    """Stored task settings fall back to Auto instead of failing the job."""
    return value if isinstance(value, str) and value in CLIP_DURATIONS else "auto"


def validate_clip_lengths(value: Any = None) -> List[str]:
    """Require a non-empty list of valid presets (or a single valid string)."""
    if isinstance(value, str):
        return [validate_clip_length(value)]
    if not isinstance(value, (list, tuple)) or not value:
        raise ValueError(f"clip_lengths must be one or more of: {CLIP_LENGTH_CHOICES}")
    lengths: List[str] = []
    for item in value:
        name = validate_clip_length(item)
        if name not in lengths:
            lengths.append(name)
    if not lengths:
        raise ValueError(f"clip_lengths must be one or more of: {CLIP_LENGTH_CHOICES}")
    return lengths


def normalize_clip_lengths(value: Any = None, *, fallback: str = "auto") -> List[str]:
    """Return a de-duplicated list of valid length presets (never empty)."""
    default = fallback if fallback in CLIP_DURATIONS else "auto"
    if isinstance(value, str):
        # Preference storage may keep "short,medium" as a single string.
        if "," in value:
            candidates = [part.strip() for part in value.split(",") if part.strip()]
        else:
            candidates = [value]
    elif isinstance(value, (list, tuple)):
        candidates = list(value)
    else:
        candidates = []

    lengths: List[str] = []
    for item in candidates:
        if not isinstance(item, str):
            continue
        name = item.strip()
        if name in CLIP_DURATIONS and name not in lengths:
            lengths.append(name)
    return lengths or [default]


def clip_duration(value: str = "auto") -> ClipDuration:
    return CLIP_DURATIONS[validate_clip_length(value)]
