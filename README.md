# Open Voting Demo

An E2E Verifiable voting system based on [OpenVoting: Recoverability from Failures in Dual Voting ](https://arxiv.org/abs/1908.09557)to streamline the election process securely and efficiently while providing security guarantees and recoverability protocol. This system conducts a single election in a single booth. For conducting multiple elections 

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation
### Requirements:
1. Docker (refer to [Docker documentation](https://docs.docker.com/engine/install/))

### Steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/demoiverrakada/e-voting.git
    cd e-voting
    ```

2. **Build the system** :
    ```bash
    docker-compose build
    ```

3. **Run the election system**:
    ```bash
    docker-compose up
    ```

    - The election server runs on **PORT 5000**
    - The verification server runs on **PORT 7000**
    - The admin webpage runs on **PORT 3000**
    - The verification webpage runs on **PORT 7001**
    - The public bulletin board runs on **PORT 5001**

## Usage
Once the system is up and running, you can access the following services:
- **Election Server**: Access the voting system at [http://localhost:5000](http://localhost:5000).
- **Verification Server**: Access the voter verification at [http://localhost:7000](http://localhost:7000).
- **Admin Webpage**: Access the admin webpage at [http://localhost:3000](http://localhost:3000).
- **Verification Webpage**: Access the verification webpage at [http://localhost:7001](http://localhost:7001).
- **Public Bulletin Board**: Access the public bulletin board at [http://localhost:5001](http://localhost:5001).

## Features
- Secure voting system with encryption.
- Voter identity verification and authentication.
- Real-time election results displayed on the public bulletin board.
- Admin panel for managing elections and monitoring results.
- Mobile-friendly interfaces for verification and voting.

## Contributing
We welcome contributions to improve the project. To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

