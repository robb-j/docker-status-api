const fs = require("fs");

const express = require("express");
const Docker = require("dockerode");
const { Api } = require("api-formatter");
const { stripEnv, processPorts, formatContainerName } = require("./utils");

const socketPath = "/var/run/docker.sock";
const envKeys = (process.env.ENV_KEYS && process.env.ENV_KEYS.split(",")) || [];

(async () => {
  // Check we have a valid docker socket
  if (!fs.statSync(socketPath).isSocket()) {
    console.log("Cannot connect to docker");
    process.exit(1);
  }

  // Check env keys were passed
  if (envKeys.length === 0) {
    console.log("No 'ENV_KEYS' provided");
    process.exit(1);
  }

  // Create a docker connection
  const docker = new Docker({ socketPath });

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

    // Inspect each container (in parallel)
    containers = await Promise.all(
      containers.map(container => docker.getContainer(container.Id).inspect())
    );

    // Format each container
    containers = containers.map(container => ({
      id: container.Id,
      name: formatContainerName(container.Name),
      started: new Date(container.State.StartedAt),
      image: container.Config.Image,
      state: container.State.Status,
      hostname: container.Config.hostname,
      env: stripEnv(container.Config.Env, envKeys),
      ports: processPorts(container.NetworkSettings.Ports)
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
  console.log(`Started on :3000`);
})();
