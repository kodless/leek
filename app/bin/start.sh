#!/bin/bash

SERVICE=$1
ENABLE_API=$(echo "${LEEK_ENABLE_API-false}" | tr '[:upper:]' '[:lower:]')
ENABLE_AGENT=$(echo "${LEEK_ENABLE_AGENT-false}" | tr '[:upper:]' '[:lower:]')
ENABLE_WEB=$(echo "${LEEK_ENABLE_WEB-false}" | tr '[:upper:]' '[:lower:]')
ENABLE_DDTRACE=$(echo "${LEEK_ENABLE_DDTRACE-false}" | tr '[:upper:]' '[:lower:]')

case ${SERVICE} in

  "api")
    if [ "${ENABLE_API}" = true ]; then
      if [ "${ENABLE_DDTRACE}" = true ]; then
        exec ddtrace-run gunicorn --reload -c /opt/app/leek/api/server/gunicorn.py leek.api.server.wsgi:app
      else
        exec gunicorn --reload -c /opt/app/leek/api/server/gunicorn.py leek.api.server.wsgi:app
    fi
    ;;

  "agent")
    if [ "${ENABLE_AGENT}" = true ]; then
      if [ "${ENABLE_DDTRACE}" = true ]; then
        exec ddtrace-run python -m leek.agent.agent
      else
        exec python -m leek.agent.agent
    fi
    ;;

  "web")
    if [ "${ENABLE_WEB}" = true ]; then
      if [ "${LEEK_ENV:-PROD}" = "DEV" ]; then
        echo "Web is not supported when doing local development"
      else
        export NGINX_CONF=/etc/nginx/mushed.conf
        cp /opt/app/conf/nginx.conf "${NGINX_CONF}"
        mkdir -p /run/nginx/
        chown -R root:root /var/lib/nginx
        exec nginx -c $NGINX_CONF
      fi
    fi
    ;;

  *)
    echo "Service must one of [es, api, agent, web]!"
    exit 1
    ;;
esac
