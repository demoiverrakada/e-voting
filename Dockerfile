FROM docker.io/demoiverrakada/evoting:updated1.1.1

# Set proxy environment variables
ENV http_proxy=http://xen03.iitd.ac.in:3128
ENV https_proxy=http://xen03.iitd.ac.in:3128
ENV no_proxy=localhost,127.0.0.1

# Install OpenJDK 17 for Gradle compatibility
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk curl

# Configure Gradle proxy settings
RUN mkdir -p /root/.gradle && \
    echo "systemProp.http.proxyHost=xen03.iitd.ac.in" > /root/.gradle/gradle.properties && \
    echo "systemProp.http.proxyPort=3128" >> /root/.gradle/gradle.properties && \
    echo "systemProp.https.proxyHost=xen03.iitd.ac.in" >> /root/.gradle/gradle.properties && \
    echo "systemProp.https.proxyPort=3128" >> /root/.gradle/gradle.properties

# Copy Gradle ZIP and SHA256 for BOTH components
# COPY gradle-8.6-all.zip gradle-8.6-all.zip.sha256 /app/evoting_localstorage/BallotAudit/android/gradle/wrapper/
# COPY gradle-8.6-all.zip gradle-8.6-all.zip.sha256 /app/evoting_localstorage/evoting_fron/android/gradle/wrapper/

# Copy project files
COPY src/evoting_localstorage/project_evoting/package.json /app/evoting_localstorage/project_evoting/package.json
COPY src/evoting_localstorage/verification_server/package.json /app/evoting_localstorage/verification_server/package.json
# COPY src/evoting_localstorage/BallotAudit /app/evoting_localstorage/BallotAudit
COPY src/evoting_localstorage/bulletin/package.json /app/evoting_localstorage/bulletin/package.json
# COPY src/evoting_localstorage/evoting_fron /app/evoting_localstorage/evoting_fron
COPY src/evoting_localstorage/admin_webpage/package.json /app/evoting_localstorage/admin_webpage/package.json
COPY src/evoting_localstorage/verification-webpage/package.json /app/evoting_localstorage/verification-webpage/package.json
COPY src/evoting_localstorage/demo/package.json /app/evoting_localstorage/demo/package.json
COPY src /app

WORKDIR /app/

# Install Node.js dependencies
RUN /bin/bash --login -c "apt-get update && apt-get upgrade -y"
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/verification_server && npm install"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit && npm install"

# Configure and run BallotAudit Gradle tasks
# RUN chmod +x /app/evoting_localstorage/BallotAudit/android/gradlew && \
#     sed -i 's|distributionUrl=.*|distributionUrl=gradle-8.6-all.zip|' /app/evoting_localstorage/BallotAudit/android/gradle/wrapper/gradle-wrapper.properties
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && ./gradlew clean"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && nice -n 19 ./gradlew assembleRelease"

# Install frontend dependencies
RUN /bin/bash --login -c "cd evoting_localstorage/bulletin && npm install"
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install --legacy-peer-deps"
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install react-native-bcrypt --legacy-peer-deps"
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install react-native-screens@3.29.0 --legacy-peer-deps"
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron && npm install react@18.2.0"

# # Configure and run evoting_fron Gradle tasks
# RUN chmod +x /app/evoting_localstorage/evoting_fron/android/gradlew && \
#     sed -i 's|distributionUrl=.*|distributionUrl=gradle-8.6-all.zip|' /app/evoting_localstorage/evoting_fron/android/gradle/wrapper/gradle-wrapper.properties
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron/android && ./gradlew clean"
# RUN /bin/bash --login -c "cd evoting_localstorage/evoting_fron/android && nice -n 19 ./gradlew assembleRelease"

# Install remaining dependencies
RUN /bin/bash --login -c "cd evoting_localstorage/admin_webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/verification-webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/demo && npm install --force"

# Link Node.js binaries
RUN ln -s /root/.nvm/versions/node/v22.3.0/bin/node /usr/bin/node && \
    ln -s /root/.nvm/versions/node/v22.3.0/bin/npm /usr/bin/npm

# Fix permissions
RUN chmod -R 755 /app/evoting_localstorage/demo/node_modules/.bin/ && \
    find /app/evoting_localstorage/demo/node_modules/.bin/ -type f -exec chmod +x {} \;


