const npa = require('npm-package-arg');
const request = require('superagent');
const async = require('async');

// Configurable registry URL
const DEFAULT_REGISTRY_URL = process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org';

module.exports = class NpmHttpRegistry {
  constructor(options = {}){
    this.registryUrl = options.registryUrl || DEFAULT_REGISTRY_URL;
    this.cache = {};
    this.fetching = [];
  }

  fetch(name, cb){
    const escapedName = name && npa(name).escapedName;

    if(this.cache[name]){
      cb(false, this.cache[name])
    } else {
      // console.log('Miss:', name)
      request.get(`${this.registryUrl}/${escapedName}`).end((err, res) => {
        if(err || res.statusCode < 200 || res.statusCode >= 400){
          const message = res ? `Status: ${res.statusCode}` : `Error: ${err.message}`;

          console.warn(`Could not load ${name}`);
          console.warn(message);

          return cb(true);
        }

        this.cache[name] = res.body;

        cb(false, this.cache[name]);
      });
    }
  }

  batchFetch(keys, cb){
    const fetchKeys = keys.filter(key => !this.cache.hasOwnProperty(key) && this.fetching.indexOf(key) === -1);

    if(fetchKeys.length){
      this.fetching = this.fetching.concat(fetchKeys);
      async.parallel(fetchKeys.map((key) => {
        const escapedName = key && npa(key).escapedName;

        return done => request.get(`${this.registryUrl}/${escapedName}`).end((err, res) => {
          // if(this.cache.hasOwnProperty(key)) console.log('Double Fetch:', key)

          if(err || res.statusCode < 200 || res.statusCode >= 400){
            const message = res ? `Status: ${res.statusCode}` : `Error: ${err.message}`;

            return done();
          }

          this.cache[key] = res.body;

          done();
        });
      }), cb);
    } else {
      cb();
    }
  }
}
