#!/usr/bin/env node

/*
 * robb-j - npm based docke build & push
 * Uses /REGISTRY + package version to build and push a docker image
 * Useful when set in a npm `postversion` script
 * Args:
 *  - [latest] Also tag with latest
 *  - [dry] Don't perform the command
 */

// Imports
const { readFileSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");

const version = process.env.npm_package_version;

(async () => {
  try {
    // Get the registry to push to from the REGISTRY file
    let registry = readFileSync(path.join(__dirname, "../REGISTRY")).trim();

    // Generate tags for the image
    let tags = [`${registry}:${version}`];
    if (process.argv.includes("latest")) tags.push(`${registry}:latest`);

    // Reduce the tags into a statement
    let tagStmt = tags.map(tag => `-t ${tag}`).join(" ");

    // Generate the command to run
    let cmd = [`docker build ${tagStmt} .`]
      .concat(tags.map(tag => `docker push ${tag}`))
      .join(" && ");

    // Stop if in dry mode
    if (process.argv.includes("dry")) return console.log("Running:", cmd);

    // Execute the command
    let proc = exec(cmd);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
})();
