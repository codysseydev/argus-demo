############################################
# Base Image
############################################

# Server Side Up PHP Docker Images: https://serversideup.net/open-source/docker-php/
FROM serversideup/php:8.5-fpm-nginx-alpine AS base

# Argus stores into Postgres and buffers through Valkey (phpredis client),
# so the image needs pdo_pgsql and redis. intl is handy for formatting.
USER root
RUN install-php-extensions pdo_pgsql intl redis

############################################
# Development Image
############################################
FROM base AS development

# Pass USER_ID and GROUP_ID as build args so www-data matches the host user,
# keeping bind-mounted files writable from inside the container.
ARG USER_ID
ARG GROUP_ID

USER root

# Trust the local Server Side Up CA so HTTPS calls between containers work.
COPY .infrastructure/conf/traefik/dev/certificates/local-ca.pem /usr/local/share/ca-certificates/local-ca.crt
RUN update-ca-certificates

RUN docker-php-serversideup-set-id www-data $USER_ID:$GROUP_ID && \
    docker-php-serversideup-set-file-permissions --owner $USER_ID:$GROUP_ID

USER www-data

############################################
# CI Image
############################################
FROM base AS ci

# CI steps sometimes need root.
USER root

############################################
# Production Image (Laravel Cloud / Swarm)
############################################
FROM base AS deploy
COPY --chown=www-data:www-data . /var/www/html
USER www-data
