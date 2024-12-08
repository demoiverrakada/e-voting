FROM docker.io/demoiverrakada/evoting:updated1.0.0

# Set working directory
COPY src /app
WORKDIR /app