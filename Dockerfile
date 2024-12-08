FROM docker.io/demoiverrakada/evoting:updated1.0.0

# Set working directory
COPY src /app
WORKDIR /app/

# Install node modules
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"