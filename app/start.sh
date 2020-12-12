#!/bin/bash

# exit whenever a command returns with a non-zero exit code
set -e
set -o pipefail

# turn on bash's job control
set -m

# Start the api in the primary process and put it in the background
gunicorn --reload -c leek/leek_api/server/gunicorn.py leek.leek_api.server.wsgi:app &

# Start the agent process
python /opt/app/start_agent.py

# the agent might need to know how to wait on the
# primary process to start before it does its work and returns


# now we bring the api back into the foreground
# and leave it there
fg %1
