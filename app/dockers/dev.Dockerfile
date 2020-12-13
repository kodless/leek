FROM nikolaik/python-nodejs:python3.8-nodejs12-slim

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
RUN apt-get update && apt-get install -y \
    build-essential \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Install Backend Dependencies
COPY leek/requirements.txt /opt/pip/requirements.txt
RUN pip3 install -r /opt/pip/requirements.txt

# Install Frontend Dependencies
COPY leek/web/package.json leek/web/yarn.lock /opt/app/leek/web/
RUN yarn --ignore-optional --cwd /opt/app/leek/web && yarn cache clean --force

ADD . ./
EXPOSE 5000 9000
WORKDIR /opt/app
CMD ["./start.sh"]
