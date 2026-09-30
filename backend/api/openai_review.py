"""Bounded OpenAI Responses requests shared by the two document reviewers."""
import json
from pathlib import Path
from typing import TypeVar

import httpx
from pydantic import BaseModel

Assessment = TypeVar("Assessment", bound=BaseModel)


def drawing_blocks(drawings: list[dict]) -> list[dict]:
    blocks = []
    for drawing in drawings:
        data_url = f"data:{drawing['media']};base64,{drawing['data']}"
        if drawing["media"] == "application/pdf":
            blocks.append({"type": "input_file", "filename": Path(drawing["path"]).name, "file_data": data_url})
        else:
            blocks.append({"type": "input_image", "image_url": data_url, "detail": "high"})
    return blocks


def _strict_schema(value):
    if isinstance(value, dict):
        value = {key: _strict_schema(item) for key, item in value.items()}
        if value.get("type") == "object":
            value["additionalProperties"] = False
        return value
    if isinstance(value, list):
        return [_strict_schema(item) for item in value]
    return value


def review(*, api_key: str, model: str, prompt: str, drawings: list[dict], schema: type[Assessment]) -> dict:
    payload = {
        "model": model,
        "store": False,
        "reasoning": {"effort": "low"},
        "max_output_tokens": 8192,
        "input": [{"role": "user", "content": [*drawing_blocks(drawings), {"type": "input_text", "text": prompt}]}],
        "text": {"format": {"type": "json_schema", "name": schema.__name__, "strict": True,
                            "schema": _strict_schema(schema.model_json_schema())}},
    }
    with httpx.Client(timeout=httpx.Timeout(70.0, connect=10.0)) as client:
        response = client.post("https://api.openai.com/v1/responses",
                               headers={"Authorization": f"Bearer {api_key}"}, json=payload)
        response.raise_for_status()
        data = response.json()
    if data.get("status") != "completed":
        raise ValueError("OpenAI review did not complete")
    parts = [part for item in data.get("output", []) if item.get("type") == "message"
             for part in item.get("content", [])]
    if any(part.get("type") == "refusal" for part in parts):
        raise ValueError("OpenAI declined the review")
    result = "".join(part.get("text", "") for part in parts if part.get("type") == "output_text")
    return schema.model_validate(json.loads(result)).model_dump()
