FROM nikolaik/python-nodejs:python3.8-nodejs12-slim AS compile-image

MAINTAINER Hamza Adami <me@adamihamza.com>
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /opt/app

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN python3 -m venv $VIRTUAL_ENV  \
    && python3 -m pip install --upgrade pip

# Install Backend Dependencies
COPY leek/requirements.txt /opt/pip/requirements.txt
RUN pip3 install -r /opt/pip/requirements.txt

# Install Frontend Dependencies
COPY leek/web/package.json leek/web/yarn.lock /opt/app/leek/web/
RUN yarn --ignore-optional --cwd /opt/app/leek/web

# Add application to container
ADD . ./

# Build Frontend Application, and clean Frontend dependencies and code, Keeping only the dist
RUN yarn --cwd /opt/app/leek/web build \
    && mv /opt/app/leek/web/public /opt/app/leek/public \
    && rm -rf /opt/app/leek/web

FROM python:3.8-slim-buster AS runtime-image

WORKDIR /opt/app
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN apt-get update && apt-get install --no-install-recommends -y \
    nginx \
    supervisor
COPY --from=compile-image /opt /opt

# Expose Backend/Frontend ports
EXPOSE 5000 80
CMD ["/usr/bin/supervisord", "-c", "/opt/app/bin/supervisord.conf"]
