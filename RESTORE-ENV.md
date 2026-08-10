# Restoring the .env file

The `.env` file is gitignored (contains secrets) and is NOT committed. However, an
encrypted backup (`.env.encrypted`) IS committed to this repo.

## To restore .env after a sandbox wipe:

```bash
# 1. The decryption key is the SHA-256 of your GitHub token:
TOKEN="ghp_your_github_token_here"
KEY=$(echo -n "$TOKEN" | sha256sum | cut -c1-64)

# 2. Decrypt:
openssl enc -d -aes-256-cbc -pbkdf2 -in .env.encrypted -pass pass:"$KEY" > .env

# 3. Verify:
grep GITHUB_TOKEN .env  # should show your token
```

## Security notes:
- The encrypted file is useless without the GitHub token (which is itself a secret).
- Rotate the GitHub token → the old encrypted backup becomes undecryptable. Re-encrypt with the new token.
- The Turso token in .env appears to be expired (401). Regenerate it at https://app.turso.tech if you want remote DB persistence.
