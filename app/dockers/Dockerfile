FROM nikolaik/python-nodejs:python3.8-nodejs16-slim AS compile-image

MAINTAINER Hamza Adami <me@adamihamza.com>
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
WORKDIR /opt/app

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN apt-get update \
    && apt-get install --no-install-recommends -y build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv $VIRTUAL_ENV \
    && python3 -m pip install --upgrade pip

# Install Backend Dependencies
COPY leek/requirements.txt /opt/app/leek/
RUN pip3 install -r /opt/app/leek/requirements.txt

# Install Frontend Dependencies
COPY web/package.json web/yarn.lock /opt/app/web/
RUN yarn --ignore-optional --cwd /opt/app/web

# Add application to container
ADD web ./web

# Build Frontend Application, and clean Frontend dependencies and code, Keeping only the dist
RUN yarn --cwd /opt/app/web build \
    && mv /opt/app/web/public /opt/app/public \
    && rm -rf /opt/app/web

ADD bin /opt/app/bin
ADD conf /opt/app/conf
ADD leek /opt/app/leek

FROM python:3.8-slim-buster AS runtime-image

WORKDIR /opt/app
ENV DEBIAN_FRONTEND=noninteractive
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV LEEK_ENV=PROD
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    gnupg2 \
    wget \
    nginx \
    supervisor \
    procps \
    netcat
COPY --from=compile-image /opt /opt

ARG LEEK_VERSION="-.-.-"
ARG LEEK_RELEASE_DATE="0000/00/00 00:00:00"
ENV LEEK_VERSION=$LEEK_VERSION
ENV LEEK_RELEASE_DATE=$LEEK_RELEASE_DATE

# Expose Backend/Frontend ports
EXPOSE 5000 8000
CMD ["/usr/bin/supervisord", "-c", "/opt/app/conf/supervisord.conf"]
