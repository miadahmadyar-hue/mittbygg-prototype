import json
import unittest
from unittest.mock import patch

import httpx
from api.ai_architect import ArchitectAssessment
from api.openai_review import review, _strict_schema


class OpenAIReviewTests(unittest.TestCase):
    def call(self, response, status=200):
        with patch("api.openai_review.httpx.Client") as client:
            client.return_value.__enter__.return_value.post.return_value = httpx.Response(
                status, request=httpx.Request("POST", "https://api.openai.com/v1/responses"), json=response)
            return review(api_key="test", model="gpt-6-astra", prompt="Review", drawings=[], schema=ArchitectAssessment)

    def test_reasoning_items_are_not_mistaken_for_assessment_text(self):
        result = {"feasible": False, "summary": "Missing evidence", "items": [], "anbefalinger": []}
        response = {"status": "completed", "output": [
            {"type": "reasoning", "summary": []},
            {"type": "message", "content": [{"type": "output_text", "text": json.dumps(result)}]}]}
        self.assertEqual(self.call(response), result)

    def test_incomplete_refused_and_invalid_results_are_not_accepted(self):
        for response in [
            {"status": "incomplete", "output": []},
            {"status": "completed", "output": [{"type": "message", "content": [{"type": "refusal", "refusal": "Cannot review"}]}]},
            {"status": "completed", "output": [{"type": "message", "content": [{"type": "output_text", "text": "{}"}]}]},
        ]:
            with self.subTest(response=response), self.assertRaises(ValueError):
                self.call(response)

    def test_api_access_or_billing_error_is_not_a_successful_review(self):
        with self.assertRaises(httpx.HTTPStatusError):
            self.call({"error": {"code": "insufficient_quota"}}, 429)

    def test_nested_objects_use_strict_output_schema(self):
        schema = _strict_schema(ArchitectAssessment.model_json_schema())
        self.assertFalse(schema["additionalProperties"])
        self.assertFalse(schema["$defs"]["AssessmentItem"]["additionalProperties"])
