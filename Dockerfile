FROM docker.io/demoiverrakada/evoting:updated1.1.1

# ============================================================
# Optional proxy support (DISABLED by default)
# Users behind a proxy can enable via --build-arg
# ============================================================
ARG http_proxy
ARG https_proxy
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG no_proxy
ARG NO_PROXY

ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV no_proxy=${no_proxy}
ENV NO_PROXY=${NO_PROXY}
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH
# ============================================================
# Install OpenJDK 17 (Gradle compatibility)
# ============================================================

# ============================================================
# Configure Gradle proxy ONLY if proxy is provided
# ============================================================
RUN mkdir -p /root/.gradle && \
    if [ -n "$http_proxy" ]; then \
      echo "systemProp.http.proxyHost=$(echo $http_proxy | sed 's|http://||' | cut -d: -f1)" >> /root/.gradle/gradle.properties && \
      echo "systemProp.http.proxyPort=$(echo $http_proxy | cut -d: -f3)" >> /root/.gradle/gradle.properties ; \
    fi && \
    if [ -n "$https_proxy" ]; then \
      echo "systemProp.https.proxyHost=$(echo $https_proxy | sed 's|http://||' | cut -d: -f1)" >> /root/.gradle/gradle.properties && \
      echo "systemProp.https.proxyPort=$(echo $https_proxy | cut -d: -f3)" >> /root/.gradle/gradle.properties ; \
    fi

# ============================================================
# Copy project files
# ============================================================
COPY src /app
WORKDIR /app

# ============================================================
# System update (safe, proxy-agnostic)
# ============================================================
RUN apt-get update --fix-missing && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    which node && node -v
# ============================================================
# Install Python dependencies
# ============================================================
RUN pip install cryptography --break-system-packages

# ============================================================
# Install Node dependencies (backend / web components)
# ============================================================
RUN /bin/bash --login -c "cd evoting_localstorage/project_evoting && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/verification_server && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/bulletin && npm install"
RUN /bin/bash --login -c "cd evoting_localstorage/admin_webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/verification-webpage && npm install --force"
RUN /bin/bash --login -c "cd evoting_localstorage/demo && npm install --force"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit && npm install"
# RUN chmod +x /app/evoting_localstorage/BallotAudit/android/gradlew && \
#     sed -i 's|distributionUrl=.*|distributionUrl=https\\://services.gradle.org/distributions/gradle-8.6-all.zip|' \
#     /app/evoting_localstorage/BallotAudit/android/gradle/wrapper/gradle-wrapper.properties
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && ./gradlew clean"
# RUN /bin/bash --login -c "cd evoting_localstorage/BallotAudit/android && nice -n 19 ./gradlew assembleRelease"

# ============================================================
# Link Node.js binaries (ensure availability system-wide)
# ============================================================

# ============================================================
# Fix executable permissions
# ============================================================
RUN chmod -R 755 /app/evoting_localstorage/demo/node_modules/.bin && \
    find /app/evoting_localstorage/demo/node_modules/.bin -type f -exec chmod +x {} \;
