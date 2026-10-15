"""LLM provider interface.

The planner only depends on LLMProvider.complete_json(). To add another
provider, write a class with that one method and register it in get_provider().
API keys are read from environment variables on the server and never sent to the browser.
"""

import os
import time
from typing import Protocol

import httpx


class LLMError(Exception):
    """The model call failed (network, rate limit, bad response)."""


class LLMUnavailable(LLMError):
    """No provider is configured, so demo mode should be used."""


class LLMProvider(Protocol):
    name: str

    def complete_json(self, system: str, user: str) -> str:
        """Return the model's raw text reply, which should contain one JSON object."""
        ...


RETRY_STATUSES = (429, 500, 502, 503, 504)
RETRY_WAITS = (2.0, 5.0)  # seconds to wait before retry 1 and retry 2


def _detail(response: httpx.Response) -> str:
    try:
        body = response.json()
        if isinstance(body, list) and body:
            body = body[0]
        message = body.get("error", {}).get("message", "")
    except (ValueError, AttributeError):
        message = ""
    return f" ({message[:160]})" if message else ""


def _check(response: httpx.Response) -> None:
    if response.status_code == 429:
        raise LLMError("The AI service is rate limited right now.")
    if response.status_code in (401, 403):
        raise LLMError("The AI service rejected the API key.")
    if response.status_code >= 400:
        raise LLMError(f"The AI service returned HTTP {response.status_code}.{_detail(response)}")


class OpenAICompatibleProvider:
    """Works with any API that implements POST {base_url}/chat/completions."""

    name = "openai_compatible"

    def __init__(self, base_url: str, api_key: str, model: str, timeout: float = 45.0, transport=None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.transport = transport

    def complete_json(self, system: str, user: str) -> str:
        payload = {
            "model": self.model,
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        response = self._post(payload)
        if response.status_code == 400:
            # Some providers do not support JSON mode. Our validator copes with plain text
            # replies, so try once more without it before giving up.
            payload.pop("response_format")
            response = self._post(payload)
        _check(response)
        try:
            return response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError, TypeError) as error:
            raise LLMError("The AI service sent an unexpected reply.") from error

    def _post(self, payload: dict) -> httpx.Response:
        response = None
        for wait in (*RETRY_WAITS, None):
            try:
                with httpx.Client(timeout=self.timeout, transport=self.transport) as client:
                    response = client.post(
                        f"{self.base_url}/chat/completions",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json=payload,
                    )
            except httpx.HTTPError as error:
                if wait is None:
                    raise LLMError("Could not reach the AI service.") from error
                time.sleep(wait)
                continue
            if response.status_code not in RETRY_STATUSES or wait is None:
                return response
            time.sleep(wait)
        return response


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str, model: str, timeout: float = 45.0, transport=None):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.transport = transport

    def complete_json(self, system: str, user: str) -> str:
        payload = {
            "model": self.model,
            "max_tokens": 4000,
            "temperature": 0.4,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        try:
            with httpx.Client(timeout=self.timeout, transport=self.transport) as client:
                response = client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01"},
                    json=payload,
                )
        except httpx.HTTPError as error:
            raise LLMError("Could not reach the AI service.") from error
        _check(response)
        try:
            return "".join(b.get("text", "") for b in response.json()["content"])
        except (KeyError, ValueError, TypeError, AttributeError) as error:
            raise LLMError("The AI service sent an unexpected reply.") from error


def get_provider() -> LLMProvider:
    """Build the provider chosen in the environment, or raise LLMUnavailable."""
    name = os.getenv("LLM_PROVIDER", "none").strip().lower()
    api_key = os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("LLM_MODEL", "").strip()
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "45"))

    if name in ("", "none"):
        raise LLMUnavailable("No LLM provider is configured (demo mode).")
    if not api_key or not model:
        raise LLMUnavailable("LLM_API_KEY or LLM_MODEL is not set.")
    if name == "anthropic":
        return AnthropicProvider(api_key, model, timeout)
    if name == "openai_compatible":
        base_url = os.getenv("LLM_BASE_URL", "").strip()
        if not base_url:
            raise LLMUnavailable("LLM_BASE_URL is not set.")
        return OpenAICompatibleProvider(base_url, api_key, model, timeout)
    raise LLMUnavailable(f"Unknown LLM_PROVIDER: {name}")