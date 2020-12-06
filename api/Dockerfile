FROM python:3.8-slim-buster

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN set -ex \
    && apt-get update \
    && apt-get install -y build-essential netcat

COPY src/requirements/test.txt /opt/pip/requirements/test.txt
RUN pip3 install -r /opt/pip/requirements/test.txt

COPY src/requirements/container.txt /opt/pip/requirements/container.txt
RUN pip3 install -r /opt/pip/requirements/container.txt

ADD . ./

ENV FLASK_APP sources/app.py

EXPOSE 5000
CMD ["make", "run_gunicorn"]
