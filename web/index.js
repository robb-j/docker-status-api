const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const express = require('express')
const winston = require('winston')
const Docker = require('dockerode')

const readFile = promisify(fs.readFile)
const socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock'
const util = require('./utils')

;(async () => {
  
  // Configure winston
  winston.add(winston.transports.File, { filename: 'logs/app.log' })
  
  
  // Check we have a valid docker socket
  if (!fs.statSync(socketPath).isSocket()) {
    return winston.error('Cannot connect to docker')
  }
  let docker = new Docker({ socketPath })
  
  
  // Load the version file
  const versionPath = path.join(__dirname, '..', 'VERSION')
  const version = (await readFile(versionPath, 'utf8')).trim()
  
  
  // Process the keys to pluck
  const envKeys = (process.env.ENV_KEYS && `${process.env.ENV_KEYS}`.split(',')) || []
  
  
  // Generates json fit for an api
  function jsonForApi(data, success = true, messages = []) {
    if (!Array.isArray(messages)) messages = [messages]
    if (!success) success = false
    const meta = { success, messages, version }
    return { meta, data }
  }
  
  
  // Create our express app
  let app = express()
  
  // An index endpoint, detailing the api structure
  app.get('/', async (req, res) => {
    res.send(jsonForApi({
      title: 'docker-status-api API',
      'docker-status-api': {
        '/containers': 'Get active containers, their ports & whitelisted configuration'
      }
    }))
  })
  
  // Get active containers, their ports & whitelisted configuration
  app.get('/containers', async (req, res) => {
    
    // Fetch containers from docker
    let containers = await docker.listContainers()
    
    // Inspec each container (in parallel)
    containers = await Promise.all(containers.map(container => {
      let full = docker.getContainer(container.Id)
      return full.inspect()
    }))
    
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
    }))
    
    // Return the containers
    res.send(jsonForApi(containers))
  })
  
  // A 404 Endpoint
  app.use((req, res) => {
    res.status(404).send(jsonForApi('Not Found', false))
  })
  
  
  // Start the app
  const port = process.env.APP_PORT || 3000
  winston.info(`Started on ${port}`)
  app.listen(port)
  
})()
