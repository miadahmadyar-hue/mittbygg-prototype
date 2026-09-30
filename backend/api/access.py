"""Short-lived demo sessions, upload ownership and bounded resource usage.

These sessions isolate anonymous demo visitors; they do not verify identity.
Limits are process-local. Multi-worker deployments need a shared gateway/store.
"""
import secrets
import time
from collections import deque
from threading import Lock
from fastapi import APIRouter, Header, HTTPException, Request

router = APIRouter()
_lock = Lock()
_sessions: dict[str, tuple[float, str]] = {}
_requests: dict[str, deque] = {}
TTL = 3600

def limit(key: str, count: int, window: int = 60):
    now = time.monotonic()
    with _lock:
        for name in list(_requests):
            if not _requests[name] or _requests[name][-1] <= now - 86400:
                del _requests[name]
        entries = _requests.setdefault(key, deque())
        while entries and entries[0] <= now - window:
            entries.popleft()
        if len(entries) >= count:
            raise HTTPException(429, "Too many requests. Please try later.", headers={"Retry-After": str(window)})
        entries.append(now)

@router.post("/auth/session")
def create_session(request: Request):
    host = request.client.host if request.client else "unknown"
    limit(f"session:{host}", 10)
    now = time.monotonic()
    with _lock:
        for token in list(_sessions):
            if _sessions[token][0] < now:
                del _sessions[token]
        if len(_sessions) >= 10000:
            raise HTTPException(503, "Demo capacity reached")
        token = secrets.token_urlsafe(32)
        _sessions[token] = (now + TTL, host)
    return {"token": token, "expires_in": TTL, "identity_verified": False}

def require_session(request: Request, x_session_token: str = Header(default="")) -> str:
    with _lock:
        session = _sessions.get(x_session_token)
    if not session or session[0] <= time.monotonic():
        raise HTTPException(401, "Demo session expired. Please retry.")
    host = request.client.host if request.client else "unknown"
    limit(f"resource:{host}", 20)
    if "/ai/" in request.url.path:
        limit(f"ai:{host}", 30, 86400)
        limit("ai:global", 300, 86400)
    return x_session_token
