"""Firebase Admin SDK initialisation and token verification."""

import os
import firebase_admin
from firebase_admin import auth, credentials

# Resolve the path to the service account file relative to this file's location
_SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(__file__),  # app/utils/
    "..",  # app/
    "..",  # backend/
    "firebase-service-account.json",
)

# Initialise the Firebase Admin app only once
if not firebase_admin._apps:
    _cred = credentials.Certificate(os.path.abspath(_SERVICE_ACCOUNT_PATH))
    firebase_admin.initialize_app(_cred)


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.

    Raises:
        firebase_admin.auth.InvalidIdTokenError: if the token is invalid or expired.
    """
    decoded = auth.verify_id_token(id_token)
    return decoded
