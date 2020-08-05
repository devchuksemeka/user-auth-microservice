# OAT Backend

Backend service for OAT

## Getting Started

There are 2 ways to get you OAT up and running

#### Mandatory
1. Clone the repository.
2. Run command`cp .env.sample .env`
3. Set up your local credentials in an `.env` file.


### Using Docker

1. Set the Mongo db url inside this `.env` as `mongodb://mongo:27017/fot_db`.
2. Run `docker-compose up --build` to start application and listen for change


### Using npm

1. Set the Mongo db url inside this `.env` as `mongodb://127.0.0.1:27017/fot_db`.
2. Run `npm i` to install and setup application
4. Run `npm run dev` (This will start up the OAT server and listen for changes).
