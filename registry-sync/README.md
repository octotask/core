# Octotask Registry Sync

Synchronize NPM data in realtime from the [NPM Replicate](https://replicate.npmjs.com/)
endpoint into [redis](https://redis.io/) for an in-cache of the NPM dataset.

Preconfigured with a whitelist of keys to retain from the NPM dataset, which
is enough to do dependency resolution and map out entry points for [resolver](https://github.com/OctoTask/core/tree/master/resolver).
This is done in order to reduce the total memory usage of the dataset.

Given the current configuration, all of the required metadata from NPM fits in
~2.5 gb RAM

Set the `REDIS_URL` environment variable to point at your redis instance.

```
$ npm install -g @octotask/registry-sync
$ REDIS_URL=redis://localhost:6379 registry-sync
```
