"""
BankID authentication via Signicat OIDC.
If SIGNICAT_CLIENT_ID is not set, falls back to a demo redirect.
"""
import os
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()

SIGNICAT_BASE = os.getenv("SIGNICAT_BASE_URL", "https://preprod.signicat.com")
CLIENT_ID     = os.getenv("SIGNICAT_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SIGNICAT_CLIENT_SECRET", "")
REDIRECT_URI  = os.getenv("SIGNICAT_REDIRECT_URI", "")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:3000")

_states: dict[str, bool] = {}


@router.get("/auth/bankid/start")
def start_bankid():
    if not CLIENT_ID:
        # No Signicat credentials — jump straight to demo user
        return RedirectResponse(
            f"{FRONTEND_URL}/address?auth=ok&name=Demo+Bruker",
            status_code=302,
        )

    state = secrets.token_urlsafe(16)
    _states[state] = True

    qs = urlencode({
        "response_type": "code",
        "client_id":     CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "scope":         "openid profile",
        "state":         state,
        "acr_values":    "urn:signicat:oidc:method:nbid",
        "ui_locales":    "nb",
    })
    return RedirectResponse(f"{SIGNICAT_BASE}/oidc/authorize?{qs}", status_code=302)


@router.get("/auth/callback")
async def bankid_callback(code: str = "", state: str = "", error: str = ""):
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/bankid?error={error}", status_code=302)

    if state not in _states:
        return RedirectResponse(f"{FRONTEND_URL}/bankid?error=invalid_state", status_code=302)
    del _states[state]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                f"{SIGNICAT_BASE}/oidc/token",
                data={
                    "grant_type":   "authorization_code",
                    "code":         code,
                    "redirect_uri": REDIRECT_URI,
                },
                auth=(CLIENT_ID, CLIENT_SECRET),
            )
        if token_resp.status_code != 200:
            raise ValueError(f"token endpoint returned {token_resp.status_code}")

        access_token = token_resp.json().get("access_token", "")

        async with httpx.AsyncClient(timeout=10.0) as client:
            user_resp = await client.get(
                f"{SIGNICAT_BASE}/oidc/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        user = user_resp.json() if user_resp.status_code == 200 else {}
        name = (
            user.get("name")
            or f"{user.get('given_name', '')} {user.get('family_name', '')}".strip()
            or "Bruker"
        )
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/bankid?error=auth_failed", status_code=302)

    qs = urlencode({"auth": "ok", "name": name})
    return RedirectResponse(f"{FRONTEND_URL}/address?{qs}", status_code=302)
