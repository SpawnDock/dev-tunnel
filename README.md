# @spawn-dock/dev-tunnel

WebSocket tunnel client for SpawnDock local development preview. Exposes your local dev server through the SpawnDock control plane so others can preview your Telegram Mini App.

## Install

```bash
npm install -g @spawn-dock/dev-tunnel
```

Or use with npx:

```bash
npx @spawn-dock/dev-tunnel
```

## Usage

### With spawndock.config.json (recommended)

If your project has a `spawndock.config.json` file (created by the bootstrap CLI), just run:

```bash
npx @spawn-dock/dev-tunnel
```

### With CLI arguments

```bash
npx @spawn-dock/dev-tunnel \
  --control-plane http://your-server:3000 \
  --project-slug my-app \
  --device-secret your-device-secret \
  --port 3000
```

### With environment variables

```bash
export SPAWNDOCK_CONTROL_PLANE=http://your-server:3000
export SPAWNDOCK_PROJECT_SLUG=my-app
export SPAWNDOCK_DEVICE_SECRET=your-device-secret
export SPAWNDOCK_PORT=3000
npx @spawn-dock/dev-tunnel
```

## Configuration Priority

CLI arguments > Environment variables > spawndock.config.json

## How it works

1. Connects to the SpawnDock control plane via WebSocket
2. Receives HTTP requests from users viewing your preview URL
3. Proxies those requests to your local dev server
4. Sends responses back through the tunnel

## License

MIT
