FROM docker.io/demoiverrakada/evoting:updated1.0.0

# Set working directory
COPY src/evoting_localstorage/project_evoting/package.json /app/evoting_localstorage/project_evoting/package.json
COPY src/evoting_localstorage/verification_server/package.json /app/evoting_localstorage/verification_server/package.json
COPY src/evoting_localstorage/BallotAudit/package.json /app/evoting_localstorage/BallotAudit/package.json
COPY src/evoting_localstorage/bulletin/package.json /app/evoting_localstorage/bulletin/package.json
COPY src/evoting_localstorage/evoting_fron/package.json /app/evoting_localstorage/evoting_fron/package.json
COPY src/evoting_localstorage/VoterVerification/package.json /app/evoting_localstorage/VoterVerification/package.json
COPY src/evoting_localstorage/admin_webpage/package.json /app/evoting_localstorage/admin_webpage/package.json
COPY src/evoting_localstorage/verification-webpage/package.json /app/evoting_localstorage/verification-webpage/package.json
WORKDIR /app/

# Install node modules
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/verification_server && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/bulletin && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install --legacy-peer-deps"
RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/admin_webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/verification-webpage && npm install --force"
RUN ln -s /root/.nvm/versions/node/v22.3.0/bin/node /usr/bin/node && \
    ln -s /root/.nvm/versions/node/v22.3.0/bin/npm /usr/bin/npm

# Set working directory
COPY src /app
