FROM docker.io/demoiverrakada/evoting:updated1.0.0

# Set working directory
WORKDIR /app/

# Copy package.json files for dependency installation
COPY src/evoting_localstorage/project_evoting/package.json /app/evoting_localstorage/project_evoting/package.json
COPY src/evoting_localstorage/verification_server/package.json /app/evoting_localstorage/verification_server/package.json
COPY src/evoting_localstorage/bulletin/package.json /app/evoting_localstorage/bulletin/package.json
COPY src/evoting_localstorage/admin_webpage/package.json /app/evoting_localstorage/admin_webpage/package.json
COPY src/evoting_localstorage/verification-webpage/package.json /app/evoting_localstorage/verification-webpage/package.json

# Install dependencies for Node.js projects
RUN /bin/bash --login -c "\
    cd evoting_localstorage/project_evoting && npm install && \
    cd ../verification_server && npm install && \
    cd ../bulletin && npm install && \
    cd ../admin_webpage && npm install --force && \
    cd ../verification-webpage && npm install --force"

# Copy remaining source code
COPY src /app

# Build Android projects (combine commands where possible)
RUN /bin/bash --login -c "\
    cd evoting_localstorage/BallotAudit/android && \
    sed -i 's/\r$//' gradlew && ./gradlew clean && nice -n 19 ./gradlew assembleRelease && \
    cd ../../evoting_fron/android && \
    sed -i 's/\r$//' gradlew && ./gradlew clean && nice -n 19 ./gradlew assembleRelease && \
    cd ../../VoterVerification/android && \
    sed -i 's/\r$//' gradlew && ./gradlew clean && nice -n 19 ./gradlew assembleRelease && \
    cd ../../VVPATverification/android && \
    sed -i 's/\r$//' gradlew && ./gradlew clean && nice -n 19 ./gradlew assembleRelease"
    
# Install additional Node.js modules
RUN /bin/bash --login -c "\
    cd evoting_localstorage/evoting_fron && npm install --legacy-peer-deps && \
    npm install react-native-bcrypt --legacy-peer-deps"

# Symlink node/npm
RUN ln -s /root/.nvm/versions/node/v22.3.0/bin/node /usr/bin/node && \
    ln -s /root/.nvm/versions/node/v22.3.0/bin/npm /usr/bin/npm



