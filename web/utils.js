
module.exports.mapArrayByKey = function(list, key) {
  return list.reduce((map, item) => {
    map[item[key]] = item
    return map
  }, {})
}


module.exports.stripEnv = function(env) {
  return [ 'VIRTUAL_HOST', 'LETSENCRYPT_HOST', 'LETSENCRYPT_EMAIL' ].reduce((map, key) => {
    map[key] = env[key]
    return map
  }, {}) || {}
}


module.exports.processPorts = function(ports) {
  return Object.keys(ports).reduce((map, key) => {
    let containerPort = key.split('/')[0]
    map[containerPort] = (ports[key] && ports[key][0] && ports[key][0].HostPort)
    return map
  }, {})
}
