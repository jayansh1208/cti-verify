#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="${ROOT}/.release-staging"
ZIP_PATH="${ROOT}/cti-verify-final.zip"

rm -rf "$STAGE" "$ZIP_PATH"
mkdir -p "$STAGE"

cp -R "${ROOT}/backend" "${STAGE}/backend"
cp -R "${ROOT}/frontend" "${STAGE}/frontend"
cp "${ROOT}/README.md" "${STAGE}/README.md"
cp "${ROOT}/VIVA.md" "${STAGE}/VIVA.md"
cp "${ROOT}/docker-compose.yml" "${STAGE}/docker-compose.yml"
cp -R "${ROOT}/docs" "${STAGE}/docs"
cp -R "${ROOT}/.github" "${STAGE}/.github"

find "$STAGE" -type d \( -name .git -o -name node_modules -o -name dist -o -name .vite -o -name __pycache__ -o -name .cache \) -prune -exec rm -rf {} +
find "$STAGE" -type f \( -name ".env" -o -name ".env.local" -o -name ".env.*" ! -name ".env.example" -o -name ".DS_Store" \) -delete

cat > "${STAGE}/release-evidence.txt" <<EOF
CTI Verify final ZIP evidence
============================

Included files:
- backend/
- frontend/
- docs/
- README.md
- VIVA.md
- docker-compose.yml
- .github/

Excluded from the final ZIP:
- .git/
- node_modules/
- .env and .env.local files
- build caches and dist folders

Preserved intentionally:
- package-lock.json files
- .env.example files

Generated on: $(date -u)
EOF

cd "$STAGE"
zip -r "$ZIP_PATH" . >/dev/null

printf '\nCreated %s\n' "$ZIP_PATH"
printf 'Evidence file included: %s/release-evidence.txt\n' "$STAGE"
