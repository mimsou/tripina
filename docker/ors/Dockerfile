# Image ORS adaptée à Render : le conteneur doit écouter sur $PORT (Spring : SERVER_PORT).
# Image amont : https://hub.docker.com/r/openrouteservice/openrouteservice
FROM openrouteservice/openrouteservice:latest
USER root
COPY entrypoint-render.sh /entrypoint-render.sh
RUN chmod +x /entrypoint-render.sh
USER ors
ENTRYPOINT ["/entrypoint-render.sh"]
