"""Firebase Admin SDK initialisation and token verification."""

import json
import os

import firebase_admin
from firebase_admin import auth, credentials

# ---------------------------------------------------------------------------
# Initialise Firebase Admin — prefer env-var (production/Render), fall back
# to the local service-account JSON file (local development).
# ---------------------------------------------------------------------------

if not firebase_admin._apps:
    _sa_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")

    if _sa_json_str:
        # Production: credentials supplied as a JSON string in an env variable
        _sa_dict = json.loads(_sa_json_str)
        _cred = credentials.Certificate(_sa_dict)
    else:
        # Local dev: read from the JSON file in the project root
        _service_account_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),  # app/utils/
                "..",  # app/
                "..",  # backend/
                "firebase-service-account.json",
            )
        )
        _cred = credentials.Certificate(_service_account_path)

    firebase_admin.initialize_app(_cred)


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.

    Raises:
        firebase_admin.auth.InvalidIdTokenError: if the token is invalid or expired.
    """
    decoded = auth.verify_id_token(id_token)
    return decoded
