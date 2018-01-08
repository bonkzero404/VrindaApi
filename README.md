# Vrinda Api (Starter Pack Rest API for IoT Platform)

> There is no description for now.

## Basic Concept
![Alt text](diagram/diagram.png?raw=true "Diagram Concept")

## Related Packages

| Package | Docs | Description |
|---------|------|-------------|
| [`VrindaApp`](https://github.com/bonkzero404/VrindaApp) |  ![](https://img.shields.io/badge/API%20Docs-not%20ready-red.svg?style=flat-square) | Mobile Apps using React Native |
| [`VrindaApi`](https://github.com/bonkzero404/VrindaApi) | ![](https://img.shields.io/badge/API%20Docs-not%20ready-red.svg?style=flat-square) | RestfFul Service for IoT Platform (Include MQTT Server) |
| [`VrindaSwitch`](https://github.com/bonkzero404/VrindaSwitch) | ![](https://img.shields.io/badge/API%20Docs-not%20ready-red.svg?style=flat-square) |  Arduino Sketch for single relay module |

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

NOTES : this code still Quick and Dirty. PRs accepted.

## License

MIT © Janitra Panji
