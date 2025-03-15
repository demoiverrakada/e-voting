FROM docker.io/demoiverrakada/evoting:updated1.1.1

# Set working directory
COPY src/evoting_localstorage/project_evoting/package.json /app/evoting_localstorage/project_evoting/package.json
COPY src/evoting_localstorage/verification_server/package.json /app/evoting_localstorage/verification_server/package.json
#COPY src/evoting_localstorage/BallotAudit /app/evoting_localstorage/BallotAudit
COPY src/evoting_localstorage/bulletin/package.json /app/evoting_localstorage/bulletin/package.json
#COPY src/evoting_localstorage/evoting_fron /app/evoting_localstorage/evoting_fron
#COPY src/evoting_localstorage/VoterVerification /app/evoting_localstorage/VoterVerification
COPY src/evoting_localstorage/admin_webpage/package.json /app/evoting_localstorage/admin_webpage/package.json
COPY src/evoting_localstorage/verification-webpage/package.json /app/evoting_localstorage/verification-webpage/package.json
COPY src/evoting_localstorage/demo/package.json /app/evoting_localstorage/demo/package.json
COPY src /app
WORKDIR /app/
RUN rm -rf /root/.gradle/caches/
# Install node modules
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/verification_server && npm install"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit && npm install"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && sed -i 's/\r$//' gradlew"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && ./gradlew clean"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && nice -n 19 ./gradlew assembleRelease"
# RUN rm -rf /root/.gradle/caches/
RUN /bin/bash --login -c "cd evoting_localstorage/bulletin && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install --legacy-peer-deps"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install react-native-bcrypt --legacy-peer-deps"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install react-native-screens@3.29.0 --legacy-peer-deps"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron &&  npm install react@18.2.0"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron/android && sed -i 's/\r$//' gradlew"
RUN rm -rf /root/.gradle/caches/
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron/android && ./gradlew clean"
RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron/android && nice -n 19 ./gradlew assembleRelease"
# RUN rm -rf /root/.gradle/caches/
# RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification && npm install"
# RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification/android && sed -i 's/\r$//' gradlew"
# RUN rm -rf /root/.gradle/caches/
# RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification/android && ./gradlew clean"
# RUN /bin/bash --login -c "cd evoting_localstorage/VoterVerification/android && nice -n 19 ./gradlew assembleRelease"
RUN /bin/bash --login -c "cd evoting_localstorage/admin_webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/verification-webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/demo && npm install --force"
RUN ln -s /root/.nvm/versions/node/v22.3.0/bin/node /usr/bin/node && \
    ln -s /root/.nvm/versions/node/v22.3.0/bin/npm /usr/bin/npm
