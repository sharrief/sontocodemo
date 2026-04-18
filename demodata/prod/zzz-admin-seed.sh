#!/bin/bash
# Seeds the admin user with demo credentials from README.md.
# Named zzz- so it runs after sontoco.sql in /docker-entrypoint-initdb.d/.
#
# Requires DB_PASSWORD_SALT to be present in the container environment
# (provided via env_file: .env in docker-compose.yml).

set -e

DEMO_EMAIL="sontocodemoadmin@sharrief.com"
DEMO_PASS="fhb.yez7cyt-PDB8cgd"

if [ -z "${DB_PASSWORD_SALT}" ]; then
  echo "ERROR: DB_PASSWORD_SALT is not set — cannot seed admin user" >&2
  exit 1
fi

HASH=$(printf '%s' "${DEMO_PASS}${DB_PASSWORD_SALT}" | openssl dgst -sha256 | awk '{print $2}')

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" sontocodb <<SQL
UPDATE users SET email='${DEMO_EMAIL}', password='${HASH}' WHERE id=1;
SQL

echo "Admin user seeded: ${DEMO_EMAIL}"
