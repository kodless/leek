FROM rabbitmq:3.8.9-management-alpine

# INSTALL LEEK WEBHOOKS PLUGIN - BE SURE TO INSTALL THE CORRECT PLUGIN OTP VERSIONS COMPATIBLE WITH RMQ VERSION
# More info here: https://www.rabbitmq.com/which-erlang.html
RUN apk --update --no-cache add openssl wget unzip \
    && wget -q https://github.com/kodless/leek-webhooks/releases/download/v0.2.3/otp-23.1.zip \
    && unzip -q otp-23.1.zip -d /tmp/leek-webhooks \
    && mv -n /tmp/leek-webhooks/*.ez /opt/rabbitmq/plugins
