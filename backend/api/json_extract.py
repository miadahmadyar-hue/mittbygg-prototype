"""Robustly parse JSON from an LLM response.

Models sometimes wrap JSON in markdown fences (```json ... ```) or add a
line of prose even when asked for JSON only. This extracts the JSON payload
instead of failing on json.loads.
"""
import json
import re


def parse_model_json(text: str) -> dict:
    s = (text or "").strip()

    # Strip a leading/trailing markdown code fence if present.
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s).strip()

    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # Fall back to the outermost { ... } block.
        start, end = s.find("{"), s.rfind("}")
        if start != -1 and end > start:
            return json.loads(s[start : end + 1])
        raise
