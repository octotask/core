const _ = require('lodash');
const request = require('superagent');
const Agent = require('agentkeepalive').HttpsAgent;
const { normalizePath } = require('typescript');
const parseImports = require('./parseImports');

// Configurable timeout for HTTP requests
const REQUEST_TIMEOUT = parseInt(process.env.CDN_REQUEST_TIMEOUT) || 60000;

const agent = new Agent({
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: REQUEST_TIMEOUT,
});

// Configurable CDN base URL
const JSDELIVR_URL = process.env.CDN_BASE_URL || 'https://cdn.jsdelivr.net/npm';
const RESOLVED_EXTENSIONS = ['.js', '.json', '/index.js', '/index.json'];

function fetchUrl(url, buffer = false) {
  return request.get(url).agent(agent).buffer(!!buffer).catch(error => {
    if (error.status === 503 || error.status === 504) {
      return fetchUrl(url, !!buffer);
    }

    return Promise.reject(error);
  });
}

function fetchDirList(packageSlug){
  return fetchUrl(
    `https://data.jsdelivr.com/v1/package/npm/${packageSlug}/flat`
  ).then(res => res.body.files.map(file => file.name));
}

function fetchPackageJson(packageSlug){
  return fetchUrl(
    `${JSDELIVR_URL}/${packageSlug}/package.json`
  ).then(res => res.body);
}

function fetchChildDependencies(baseUrl, path, fileList, vendorFiles) {
  let resPath, index;

  // Try direct path first if there's an extension
  if (['.js', '.json'].some(ext => _.endsWith(path, ext)) && (index = fileList.indexOf(`/${path}`)) !== -1) {
    resPath = `/${path}`;
  } else if (!RESOLVED_EXTENSIONS.some(ext => {
    const potPath = `/${path}${ext}`;
    const i = fileList.indexOf(potPath);

    if (i !== -1) {
      resPath = potPath;
      index = i;
      return true;
    }

    return false;
  })) {
    return Promise.resolve();
  }

  fileList.splice(index, 1);
  const url = `${baseUrl}${resPath}`;

  return fetchUrl(url, true).then(({ text, status, headers }) => {
    vendorFiles[url.replace(JSDELIVR_URL, '')] = text;

    const segments = url.replace(baseUrl, '').split('/');
    const cwd = segments.slice(0, segments.length - 1).join('/');

    return Promise.all(parseImports(text).map(child => {
      let childPath = normalizePath(`${cwd}${cwd === '' ? '' : '/'}${child}`);

      if (childPath.charAt(0) === '/') { childPath = childPath.substring(1); }

      return fetchChildDependencies(baseUrl, childPath, fileList, vendorFiles);
    }));

  });
}

// NOTE: Consider merging fetchChildDependencies and fetchChildDefinitions into a single
// function to reduce code duplication and improve maintainability
function fetchChildDefinitions(baseUrl, path, fileList, vendorFiles) {
  let resPath, index;

  if (_.endsWith(path, '.d.ts') && (index = fileList.indexOf(`/${path}`)) !== -1) {
    resPath = `/${path}`;
  } else if (!['.d.ts', '/index.d.ts'].some(ext => {
    const potPath = `/${path}${ext}`;
    const i = fileList.indexOf(potPath);

    if (i !== -1) {
      resPath = potPath;
      index = i;
      return true;
    }

    return false;
  })) {
    return Promise.resolve();
  }

  fileList.splice(index, 1);
  const url = `${baseUrl}${resPath}`;

  return fetchUrl(url, true).then(({ text, status, headers }) => {
    vendorFiles[url.replace(JSDELIVR_URL, '')] = text;

    const segments = url.replace(baseUrl, '').split('/');
    const cwd = segments.slice(0, segments.length - 1).join('/');

    return Promise.all(parseImports(text).map(child => {
      let childPath = normalizePath(`${cwd}${cwd === '' ? '' : '/'}${child}`);

      if (childPath.charAt(0) === '/') { childPath = childPath.substring(1); }

      return fetchChildDefinitions(baseUrl, childPath, fileList, vendorFiles);
    }));
  });
}

module.exports = {
  fetchChildDefinitions,
  fetchChildDependencies,
  fetchDirList,
  fetchPackageJson,
  JSDELIVR_URL,
};
