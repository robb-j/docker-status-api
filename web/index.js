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
  
  
  // Check we have a valid docker socket
  if (!fs.statSync(socketPath).isSocket()) {
    return winston.error('Cannot connect to docker')
  }
  let docker = new Docker({ socketPath })
  
  
  // Load the version file
  const versionPath = path.join(__dirname, '..', 'VERSION')
  const version = (await readFile(versionPath, 'utf8')).trim()
  
  
  // Configure winston
  winston.add(winston.transports.File, { filename: 'logs/app.log' })
  
  
  // Generates json fit for an api
  function jsonForApi(data, success = true, messages = []) {
    if (!Array.isArray(messages)) messages = [messages]
    if (!success) success = false
    const meta = { success, messages, version }
    return { meta, data }
  }
  
  
  // Create our express app
  let app = express()
  
  app.get('/', async (req, res) => {
    res.send(jsonForApi('ok'))
  })
  
  app.get('/containers', async (req, res) => {
    
    let containers = await docker.listContainers()
    
    containers = await Promise.all(containers.map(container => {
      let full = docker.getContainer(container.Id)
      return full.inspect()
    }))
    
    containers = containers.map(container => ({
      id: container.Id,
      name: container.Name,
      started: new Date(container.State.StartedAt),
      image: container.Config.Image,
      state: container.State.Status,
      hostname: container.Config.hostname,
      env: util.stripEnv(container.Config.Env),
      ports: util.processPorts(container.NetworkSettings.Ports)
    }))
    
    res.send(jsonForApi(containers))
  })
  
  app.use((req, res) => {
    res.status(404).send(jsonForApi('Not Found', false))
  })
  
  
  // Start the app
  winston.info(`Started on ${process.env.APP_PORT || 3000}`)
  try {
    app.listen(process.env.APP_PORT || 3000)
  }
  catch (error) {
    winston.error(error)
  }
  
})()
