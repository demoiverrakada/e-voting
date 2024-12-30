# Voting System Demo

A web-based voting system to streamline the election process securely and efficiently.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation
Requirements:
    1. Docker(refer to [Docker documentation](https://docs.docker.com/engine/install/))
1. Clone the repository:
    ```bash
    git clone https://github.com/demoiverrakada/e-voting.git
    cd e-voting
    ```
    Find the IP address of your local machine using the following commands:
    ```bash
    ifconfig #(Linux)
    ipconfig #(Windows)
    ```
    Now go in the following files and update the IP address there:
       - src/evoting_localstorage/BallotAudit/screens/BallotAudit.js
       - src/evoting_localstorage/BallotAudit/android/app/src/main/res/xml/network_security_config.xml
       - src/evoting_localstorage/VoterVerification/screens/ScanPref.js
       - src/evoting_localstorage/VoterVerification/android/app/src/main/res/xml/network_security_config.xml
       - src/evoting_localstorage/VVPATverification/screens/VVPATverify.js
       - src/evoting_localstorage/VVPATverification/android/app/src/main/res/xml/network_security_config.xml
     Run the following commands to build the system: (recommended to use a HPC or cloud shell to run this command in)
    ```bash
    docker-compose build
    ```
    After a successful build run the following command to run the election system:
    ```bash
    docker-compose up
    ```
    The election server runs on PORT 5000, the verification server runs on PORT 7000, the admin webpage runs on PORT 3000, the verification webpage runs on PORT 7001 and the public bulletin board runs on PORT 5001.
