FROM nikolaik/python-nodejs:python3.8-nodejs16-slim

# Create app directory
WORKDIR /opt/app
ENV LEEK_ENV=DEV
ENV PYTHONUNBUFFERED=1

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    gnupg2 \
    wget \
    procps \
    build-essential \
    supervisor \
    netcat \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --upgrade pip

# Install Backend Dependencies
COPY leek/requirements.txt /opt/app/leek/
RUN pip3 install -r /opt/app/leek/requirements.txt

# Copy Application
ADD . ./

# Expose Backend/Frontend ports
EXPOSE 5000 8000
CMD ["/usr/bin/supervisord", "-c", "/opt/app/conf/supervisord.conf"]
