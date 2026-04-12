"""
Firebase Admin SDK initialization.

Reads credentials from FIREBASE_SERVICE_ACCOUNT_KEY (path to JSON file)
and FIREBASE_DATABASE_URL environment variables.
"""

import os
import firebase_admin
from firebase_admin import credentials, db as firebase_db

_app = None


def init_firebase():
    global _app
    if _app is not None:
        return

    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")
    database_url = os.getenv("FIREBASE_DATABASE_URL", "")

    if not database_url:
        raise RuntimeError("FIREBASE_DATABASE_URL environment variable is required")

    cred = credentials.Certificate(cred_path)
    _app = firebase_admin.initialize_app(cred, {"databaseURL": database_url})


def get_db():
    """Return a reference to the Firebase RTDB root."""
    if _app is None:
        init_firebase()
    return firebase_db
