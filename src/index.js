const fs = require("fs");

const express = require("express");
const winston = require("winston");
const Docker = require("dockerode");
const { Api } = require("api-formatter");

const socketPath = "/var/run/docker.sock";
const util = require("./utils");

(async () => {
  // Configure winston
  winston.add(winston.transports.File, { filename: "logs/app.log" });

  // Check we have a valid docker socket
  if (!fs.statSync(socketPath).isSocket()) {
    return winston.error("Cannot connect to docker");
  }
  const docker = new Docker({ socketPath });

  // Process the keys to pluck
  const envKeys =
    (process.env.ENV_KEYS && `${process.env.ENV_KEYS}`.split(",")) || [];

  // Create our express app
  const app = express();
  app.use(Api.middleware());

  // An index endpoint, detailing the api structure
  app.get("/", async (req, res) => {
    res.api.sendData({
      title: "docker-status-api API",
      endpoints: {
        "/containers":
          "Get active containers, their ports & whitelisted configuration"
      }
    });
  });

  // Get active containers, their ports & whitelisted configuration
  app.get("/containers", async (req, res) => {
    // Fetch containers from docker
    let containers = await docker.listContainers();

    console.log(containers);

    // Inspect each container (in parallel)
    containers = await Promise.all(
      containers.map(container => {
        const full = docker.getContainer(container.Id);
        return full.inspect();
      })
    );

    // Format each container
    containers = containers.map(container => ({
      id: container.Id,
      name: container.Name,
      started: new Date(container.State.StartedAt),
      image: container.Config.Image,
      state: container.State.Status,
      hostname: container.Config.hostname,
      env: util.stripEnv(container.Config.Env, envKeys),
      ports: util.processPorts(container.NetworkSettings.Ports)
    }));

    // Return the containers
    res.api.sendData(containers);
  });

  // A 404 Endpoint
  app.use((req, res) => {
    res.api.sendFail("Not Found", 404);
  });

  // Start the app
  await new Promise(resolve => app.listen(3000, resolve));
  winston.info(`Started on :3000`);
})();
