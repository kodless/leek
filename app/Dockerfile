FROM python:3.8-slim-buster

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN set -ex \
    && apt-get update \
    && apt-get install -y build-essential netcat

# API
COPY leek/requirements.txt /opt/pip/requirements.txt
RUN pip3 install -r /opt/pip/requirements.txt

ADD . ./

EXPOSE 5000

WORKDIR /opt/app
CMD ["./start.sh"]
