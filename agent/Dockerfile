FROM python:3.8-slim-buster

RUN mkdir -p /opt/agent
WORKDIR /opt/agent

RUN apt-get update && apt-get install -y bash

COPY requirements.txt /opt/requirements.txt
RUN pip3 install -r /opt/requirements.txt

RUN groupadd -g 999 appuser && \
    useradd -r -u 999 -g appuser appuser
USER appuser

COPY ./src /opt/agent
COPY ./config /opt/agent/config

CMD ["python", "main.py"]
