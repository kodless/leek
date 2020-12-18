FROM nikolaik/python-nodejs:python3.8-nodejs12-slim

# Create app directory
WORKDIR /opt/app
ENV LEEK_ENV=DEV
ENV PYTHONUNBUFFERED=1

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN apt-get update && apt-get install -y \
    build-essential \
    supervisor \
    netcat \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --upgrade pip

# Install Backend Dependencies
COPY leek/requirements.txt /opt/app/leek/
RUN pip3 install -r /opt/app/leek/requirements.txt

# Install Frontend Dependencies
COPY web/package.json web/yarn.lock /opt/app/web/
RUN yarn --ignore-optional --cwd /opt/app/web && yarn cache clean --force

# Copy Application
ADD . ./

# Expose Backend/Frontend ports
EXPOSE 5000 8000
CMD ["/usr/bin/supervisord", "-c", "/opt/app/conf/supervisord.conf"]
