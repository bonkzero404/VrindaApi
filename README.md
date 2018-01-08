# Vrinda Api (Starter Pack Rest API for IoT Platform)

> There is no description for now.

## Basic Concept
![Alt text](diagram/diagram.png?raw=true "Diagram Concept")

## Related Packages

| Package | Docs | Description |
|---------|------|-------------|
| [`VrindaApp`](/tree/master) |  [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/react-router/docs) | Mobile Apps using React Native |
| [`VrindaApi`](/tree/master) | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/react-router-dom/docs) | RestfFul Service for IoT Platform (Include MQTT Server) |
| [`VrindaSwitch`](/tree/master) | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/react-router-native/docs) |  Arduino Sketch for single relay module |

## Install

```
npm install
```

## Usage

```
[Start Production]
npm run build && node build/server.js

[Start Development]
NODE_ENV=development nodemon src/server.js

[Build Production]
NODE_ENV=production webpack -p --profile --display-modules --optimize-minimize

[Build Development]
webpack -d

[Watcher]
webpack -d --watch
```

## Contribute

PRs accepted.

## License

MIT © Janitra Panji
