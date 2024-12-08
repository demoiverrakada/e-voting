FROM docker.io/demoiverrakada/evoting:updated1.0.0

# Set working directory
COPY src /app
WORKDIR /app/

# Install node modules
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/verification_server && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/bulletin && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/admin_webpage && npm install --force"