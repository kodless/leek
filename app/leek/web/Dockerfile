FROM node:12-buster-slim

# set working directory
RUN mkdir /app
WORKDIR /app

# Install Frontend Dependencies
COPY package.json yarn.lock ./app/
RUN yarn --ignore-optional && yarn cache clean --force

# Copy frontend app
COPY . /app/

# Start App
EXPOSE 8001
CMD ["yarn develop -p 8001"]
