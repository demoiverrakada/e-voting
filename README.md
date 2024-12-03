# E2E Voting System

## Prerequisites

Ensure you have the following installed:

1. **Docker Desktop**: [Install Docker](https://docs.docker.com/engine/install/)
2. **MongoDB**: [Install MongoDB](https://www.youtube.com/watch?v=084rmLU1UgA)
3. **Ngrok**: [Install Ngrok](https://ngrok.com/docs/getting-started/)

## Installation

### Ngrok Setup

1. Sign in to Ngrok and get an authtoken. Run the following command to add your authtoken:
    ```bash
    ngrok config add-authtoken <your-authtoken>
    ```
2. Start Ngrok:
    ```bash
    ngrok http http://localhost:5000
    ```
3. Note the forwarding URL (e.g., `https://84c5df474.ngrok-free.dev`).

### MongoDB Setup

Create 6 MongoDB projects to store:
- Admin credentials
- Polling officer credentials
- Generated ballots
- Candidate credentials
- Voter credentials
- Final votes

Store the authorization keys for each project.

### Docker Setup

1. Verify Docker installation and login:
    ```bash
    docker version
    docker login
    ```
2. Pull the required Docker images:
    ```bash
    docker pull demoiverrakada/evoting:project_evoting
    docker pull demoiverrakada/evoting:ballotaudit
    docker pull demoiverrakada/evoting:voterverification
    docker pull demoiverrakada/evoting:evoting_fron
    docker pull demoiverrakada/evoting:votepage
    ```
3. List Docker images:
    ```bash
    docker images
    ```

### Running Applications

#### `evoting_fron`, `BallotAudit`, and `VoterVerification`

1. Run the Docker container:
    ```bash
    docker run -it demoiverrakada/evoting:<component>  # Replace <component> with evoting_fron, ballotaudit, or voterverification
    cd native
    cd <component-directory>  # Replace <component-directory> with evoting_fron, BallotAudit, or VoterVerification
    python3 rename.py
    rm -rf node_modules
    npm install
    cd android
    ./gradlew clean
    ./gradlew assembleRelease
    ./gradlew bundleRelease
    cd ..
    npm run android -- --mode="release"
    ```
2. Extract the APK:
    ```bash
    docker cp <container-id>:native/<component-directory>/android/app/build/outputs/apk/release/app-release.apk <local-file-path>
    ```

#### `project_evoting`

1. Run the Docker container:
    ```bash
    docker run -it demoiverrakada/evoting:project_evoting
    cd project_evoting
    ```
2. Copy the `keys.js` file to your local machine:
    ```bash
    docker cp <container-id>:project_evoting/keys.js <local-file-path>
    ```
3. Add your keys to `keys.js` and copy it back to the container:
    ```bash
    docker cp <local-file-path>/keys.js <container-id>:/project_evoting/keys.js
    ```
4. Start the server:
    ```bash
    node index
    ```

#### `Votepage`

1. Run the Docker container:
    ```bash
    docker run -it -p 3000:3000 demoiverrakada/evoting:votepage
    ```

### Generating Ballots

1. Run another instance of `project_evoting`:
    ```bash
    docker run -it demoiverrakada/evoting:project_evoting
    cd project_evoting/routes
    python ballot_generator.py
    ```

## Overview

1. **Ballot Generation**: Generate and print ballots using `project_evoting`.
2. **Ballot Audit**: Randomly sample and audit ballots using the `BallotAudit` app.
3. **Election**: Conduct the election using the `evoting_fron` app and `votepage`.
4. **Voter Verification**: Verify voter receipts using the `VoterVerification` app.
s

