#!/bin/sh
# Render injecte PORT ; Spring Boot lit SERVER_PORT (voir application.yml ORS).
set -e
export SERVER_PORT="${PORT:-8082}"
if [ -f /entrypoint.sh ]; then
  exec /entrypoint.sh "$@"
fi
exec java -jar /ors.jar "$@"
