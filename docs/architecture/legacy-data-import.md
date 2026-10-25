# Staging-only legacy account and subscriber import

The importer consumes a JSON snapshot generated from a **copied** legacy
database and subscriber file. Do not commit the snapshot: it contains email
addresses and password hashes.

```json
{
  "accounts": [
    {
      "id": 123,
      "username": "copied-user",
      "email": "copied-user@example.test",
      "password": "<stored-password-hash>"
    }
  ],
  "subscribers": ["copied-subscriber@example.test"]
}
```

Run from the repository root with a read-only mounted snapshot:

```sh
docker compose --profile portfolio-test run --rm \
  --volume "$PWD/copied-legacy-snapshot.json:/tmp/copied-legacy-snapshot.json:ro" \
  portfolio-e2e npm run import:legacy -- /tmp/copied-legacy-snapshot.json
```

The importer rejects every database except the disposable `portfolio_test`
database on the `portfolio-test-db` Compose service. It replaces only the
dedicated `legacy_import_accounts` and `legacy_import_subscribers` tables, in a
transaction, and reports row counts without source fields or credentials.
Existing account emails are marked verified. Recognized PHP bcrypt hashes are
preserved; unrecognized formats are preserved with
`password_reset_required = 1`.

The current legacy subscriber file contains email addresses only, with no
consent status or timestamp. Those entries are preserved in source order with
`consent_status = "unknown"` and no consent timestamp. The importer does not
infer consent.

After reviewing the count-only report, remove the disposable database and mail
sink containers:

```sh
docker compose --profile portfolio-test rm --stop --force --volumes portfolio-test-db portfolio-mailpit
```
