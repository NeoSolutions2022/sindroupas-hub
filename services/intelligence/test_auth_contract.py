import unittest
from unittest.mock import patch
from fastapi import HTTPException
import gateway


class AuthContractTests(unittest.TestCase):
    def test_real_admin_envelope_and_legacy_flat(self):
        user = {"id": "admin-qa", "role": "admin", "status": "active"}
        for payload in (user, {"user": user}):
            with self.subTest(payload=payload), patch.dict("os.environ", {"AUTH_URL": "https://auth.test"}), patch.object(gateway.requests, "get") as get:
                get.return_value.status_code = 200
                get.return_value.json.return_value = payload
                result = gateway.session("Bearer qa-token")
                self.assertEqual(result, {"id": "admin-qa", "admin": True, "authorization": "Bearer qa-token"})
                self.assertEqual(get.call_args.kwargs["headers"], {"Authorization": "Bearer qa-token"})

    def test_real_common_user_does_not_gain_admin(self):
        user = gateway.normalize_user({"user": {"id": "user-qa", "is_active": True, "profile_code": "financeiro"}})
        with self.assertRaises(HTTPException) as error:
            gateway.admin({"admin": str(user.get("role", "")).lower() == "admin"})
        self.assertEqual(error.exception.status_code, 403)

    def test_disabled_and_contradictory_state_are_denied(self):
        for user in ({"id": "qa", "status": "inactive"}, {"id": "qa", "is_active": False}, {"id": "qa", "status": "active", "is_active": False}):
            with self.subTest(user=user), self.assertRaises(HTTPException) as error:
                gateway.normalize_user({"user": user})
            self.assertEqual(error.exception.status_code, 401)

    def test_malformed_or_unconfirmed_identity_is_denied(self):
        for payload in (None, [], {}, {"user": None, "id": "qa", "status": "active"}, {"user": {"status": "active"}}, {"id": True, "status": "active"}, {"id": "qa"}, {"id": "qa", "status": "unknown"}):
            with self.subTest(payload=payload), self.assertRaises(HTTPException) as error:
                gateway.normalize_user(payload)
            self.assertEqual(error.exception.status_code, 503)

    def test_expired_and_upstream_failure_are_distinct(self):
        for code, expected in ((401, 401), (403, 401), (500, 503)):
            with self.subTest(code=code), patch.dict("os.environ", {"AUTH_URL": "https://auth.test"}), patch.object(gateway.requests, "get") as get:
                get.return_value.status_code = code
                with self.assertRaises(HTTPException) as error:
                    gateway.session("Bearer qa-token")
                self.assertEqual(error.exception.status_code, expected)

    def test_missing_bearer_never_calls_auth(self):
        with patch.object(gateway.requests, "get") as get, self.assertRaises(HTTPException):
            gateway.session("")
        get.assert_not_called()


if __name__ == "__main__":
    unittest.main()
