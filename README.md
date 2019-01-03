# Docker Status Api

> An api for running docker containers and some whitelisted environment variables
>
> 30 Sept 2017 - Rob Anderson

## Features

- Get which containers are running in docker
- See what ports are exposed
- Pluck environment variables from the containers
- Requires the docker socket is volume mapped in e.g. `-v /var/run/docker.sock:/var/run/docker.sock`

## Optional Variables

| Variable   | Purpose                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `ENV_KEYS` | The environment variables you want to expose (comma seperated) e.g. `HAS_PINEAPPLE,IS_ROCKET` |
