import os
import httpx
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from dotenv import load_dotenv
from functools import lru_cache

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

@lru_cache(maxsize=1)
def get_jwks():
    if not CLERK_JWKS_URL:
        # Dummy behavior during dev without Clerk configured
        return None
    try:
        response = httpx.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return None

async def verify_token(request: Request):
    """
    Dependency to verify Clerk JWT token.
    Extracts the Bearer token, validates it against Clerk JWKS,
    and sets request.state.user_id.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        # Check if dummy dev user logic
        dev_mode = os.getenv("DEV_MODE", "").strip().lower()
        if dev_mode == "true" or dev_mode == "1":
            request.state.user_id = "dummy_user_123"
            request.state.email = "dummy@example.com"
            return
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]
    jwks = get_jwks()

    if not jwks:
        # Dummy bypass for missing JWKS in local dev
        dev_mode = os.getenv("DEV_MODE", "").strip().lower()
        if dev_mode == "true" or dev_mode == "1":
             request.state.user_id = "dummy_user_123"
             request.state.email = "dummy@example.com"
             return
        raise HTTPException(status_code=500, detail="Clerk JWKS not configured properly")

    try:
        # Decode the unverified header to get the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find the matching key in JWKS
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            # Key not found — JWKS may be stale (Clerk rotates keys). Refresh cache and retry.
            get_jwks.cache_clear()
            jwks_fresh = get_jwks()
            if jwks_fresh:
                for key in jwks_fresh.get("keys", []):
                    if key["kid"] == kid:
                        rsa_key = {
                            "kty": key["kty"], "kid": key["kid"],
                            "use": key["use"], "n": key["n"], "e": key["e"],
                        }
                        break
            if not rsa_key:
                raise HTTPException(status_code=401, detail="Invalid token: Key ID not found in JWKS")

        # Verify token using the fetched RSA key.
        # verify_nbf=False and verify_iat=False tolerate clock skew between client
        # and server (Clerk tokens can arrive with nbf slightly in the future).
        # The cryptographic signature is still fully verified via RS256 + JWKS.
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,
                "verify_iss": False,
                "verify_nbf": False,   # bypass "not before" clock-skew errors
                "verify_iat": False,   # bypass "issued at" clock-skew errors
            },
        )
        
        request.state.user_id = payload.get("sub")
        
        # Typically the email is found in standard claims or custom claims configured in Clerk
        # Assume an email property is available. If not, we might need a dummy one.
        request.state.email = payload.get("primary_email_address") or payload.get("email") or f"{request.state.user_id}@placeholder.com"

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please sign in again.")
    except JWTError as e:
        err_str = str(e)
        if "nbf" in err_str or "not yet valid" in err_str:
            raise HTTPException(
                status_code=401,
                detail="Token clock skew error (nbf). Please ensure your system clock is accurate."
            )
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except HTTPException:
        raise  # re-raise HTTPExceptions from inside the try block
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Auth error (unexpected): %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {type(e).__name__}: {e}")
