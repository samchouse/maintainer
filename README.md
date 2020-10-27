# maintainer-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that A bot to automate and maintain your GitHub project!

## Setup

```sh
# Install dependencies
npm install

# Compile
npm run build

# Run
npm run start
```

## Docker

```sh
# 1. Build container
docker build -t maintainer-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> maintainer-bot
```

## Contributing

If you have suggestions for how maintainer-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Samuel Corsi-House <chouse.samuel@gmail.com>
