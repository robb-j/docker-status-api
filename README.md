# Docker Status Api

An api for running docker containers and some whitelisted environment variables

## Features

- Get which containers are running in docker
- See what ports are exposed
- Pluck environment variables from the containers
- Requires the docker socket to be bound, e.g. `-v /var/run/docker.sock:/var/run/docker.sock`

## What is this for?

This api lets you programatically inspect containers on a machine,
e.g. to provide data to generate a reverse proxy for docker containers.

## Configuration

`ENV_KEYS` – The environment variables you want to expose on each container (comma separated) e.g. `HAS_PINEAPPLE,IS_ROCKET`

## An example

```bash
# Run the container and remove it after its finished

docker run -it --rm \
  -p 3000:3000 \
  -e ENV_KEYS=HAS_CARROT \
  -v /var/run/docker.sock:/var/run/docker.sock \
  robbj/status-api
```

```bash
# Curl the endpoint

curl http://localhost:3000/containers
```

```json
{
  "meta": {
    "success": true,
    "messages": [],
    "status": 200,
    "name": "docker-status-api",
    "version": "1.0.0"
  },
  "data": [
    {
      "id": "53cb9a5e173c8fad082ea17992d2f6b1fcf119cd99aafcbec5f9ad50aa56ac88",
      "name": "admiring_galileo",
      "started": "2019-01-03T09:34:42.037Z",
      "image": "nginx:1-alpine",
      "state": "running",
      "env": { "HAS_CARROT": "1" },
      "ports": { "80": "32768" }
    }
  ]
}
```
