#!/bin/bash

SERVICE=$1

case ${SERVICE} in

  "es")
    ENABLE_ES=$(echo "${LEEK_ENABLE_ES-false}" | tr '[:upper:]' '[:lower:]')
    if [ "${ENABLE_ES}" = true ]; then
      echo "LEEK ES LOCAL DB ENABLED"
    fi
    ;;

  "api")
    ENABLE_API=$(echo "${LEEK_ENABLE_API-false}" | tr '[:upper:]' '[:lower:]')
    if [ "${ENABLE_API}" = true ]; then
      exec gunicorn --reload -c /opt/app/leek/api/server/gunicorn.py leek.api.server.wsgi:app
    fi
    ;;

  "agent")
    ENABLE_AGENT=$(echo "${LEEK_ENABLE_AGENT-false}" | tr '[:upper:]' '[:lower:]')
    if [ "${ENABLE_AGENT}" = true ]; then
      exec python -m leek.agent.agent
    fi
    ;;

  "web")
    ENABLE_WEB=$(echo "${LEEK_ENABLE_WEB-false}" | tr '[:upper:]' '[:lower:]')
    if [ "${ENABLE_WEB}" = true ]; then
      if [ "${LEEK_ENV:-PROD}" = "DEV" ]; then
        exec yarn --cwd /opt/app/leek/web develop -p 80
      else
        export NGINX_CONF=/opt/app/bin/nginx.conf
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
