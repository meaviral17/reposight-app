# Reposight App

## **Introduction**

Reposight App is a GitHub App powered by Probot, designed to simplify the process of finding open-source projects to contribute to. With Reposight, discover projects aligned with your interests and skills effortlessly, thanks to its efficient search functionality and customizable filters.

## **Setup**

To set up the Reposight App, follow these steps:

### Install dependencies

```bash
npm install
```

### Run the bot

```bash
npm start
```

## **Docker**

If you prefer running the app in a Docker container, follow these steps:

### 1. Build container

```bash
docker build -t reposight-app .
```

### 2. Start container

```bash
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> reposight-app
```

## **Contributing**

We welcome contributions to improve the Reposight App! If you have suggestions for enhancements or want to report a bug, feel free to open an issue. Check out our [Contributing Guide](#) for more details.

We appreciate all contributions, big or small! 

---
With Reposight App, streamline your open-source contributions effortlessly!
