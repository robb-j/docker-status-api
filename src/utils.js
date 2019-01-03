/** Keys an array of item by the value of each item for that key */
function keyArray(list, key) {
  return list.reduce((map, item) => {
    map[item[key]] = item;
    return map;
  }, {});
}

/** Pluck specific values from a docker environment */
function stripEnv(env, keys) {
  return keys.reduce((map, key) => {
    map[key] = getEnvValue(env, key);
    return map;
  }, {});
}

/** Get the value of an environment variable, or null */
function getEnvValue(env, key) {
  for (let envVar of env) {
    if (envVar.startsWith(key)) {
      return envVar.split("=")[1];
    }
  }
  return null;
}

/** Make the ports of a container more friendly */
function processPorts(ports) {
  return Object.keys(ports).reduce((map, key) => {
    let containerPort = key.split("/")[0];
    map[containerPort] = ports[key] && ports[key][0] && ports[key][0].HostPort;
    return map;
  }, {});
}

/** Format the container name */
function formatContainerName(name) {
  return name.substring(1).replace(/\..*/, "");
}

module.exports = {
  keyArray,
  stripEnv,
  getEnvValue,
  processPorts,
  formatContainerName
};
