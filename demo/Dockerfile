FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y bash

# This is for testing events timezone consistency when filtering by date
# https://docs.celeryproject.org/en/3.1/configuration.html?highlight=re#celery-enable-utc
ENV TZ America/Virgin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /opt/amqp
WORKDIR /opt/amqp

COPY requirements.txt /opt/requirements.txt
RUN pip3 install -r /opt/requirements.txt

RUN groupadd -g 999 appuser && \
    useradd -r -u 999 -g appuser appuser
USER appuser

COPY ./src /opt/amqp

CMD ["celery", "worker", "-E", "-A", "leek_demo.app", "-l", "critical", "-n", "test-worker2@%h"]
