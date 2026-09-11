//Minimal fetch-based HTTP client mimicking the subset of `got`'s behaviour this plugin relies on:
//JSON/form bodies, searchParams, a request timeout and status/network-error retries.

const DEFAULT_RETRY = {
  limit: 2,
  methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
  statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'],
  noise: 100,
};

export class HTTPError extends Error {
  constructor(response, method, url) {
    super(`Request failed with status code ${response.statusCode} (${response.statusMessage}): ${method} ${url}`);
    this.name = 'HTTPError';
    this.response = response;
  }
}

function delayFor(attemptCount, noise) {
  return (2 ** (attemptCount - 1)) * 1000 + Math.random() * noise;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function request(url, options = {}) {
  const { method = 'GET', headers, json, form, searchParams, timeout, retry } = options;
  const retryOptions = { ...DEFAULT_RETRY, ...retry };

  const finalUrl = new URL(url);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      finalUrl.searchParams.set(key, value);
    }
  }

  const requestHeaders = { accept: 'application/json', ...headers };
  let body;
  if (form) {
    body = new URLSearchParams(form).toString();
    requestHeaders['content-type'] = 'application/x-www-form-urlencoded';
  } else if (json) {
    body = JSON.stringify(json);
    requestHeaders['content-type'] = 'application/json';
  }

  let attemptCount = 0;
  for (; ;) {
    attemptCount++;

    let controller;
    let timer;
    if (timeout?.request) {
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), timeout.request);
    }

    let response;
    let text;
    try {
      response = await fetch(finalUrl, { method, headers: requestHeaders, body, signal: controller?.signal });
      text = await response.text();
    } catch (error) {
      const code = error.cause?.code || (error.name === 'AbortError' ? 'ETIMEDOUT' : error.code);
      const canRetry = retryOptions.methods.includes(method) && retryOptions.errorCodes.includes(code) && attemptCount <= retryOptions.limit;
      if (canRetry) {
        await sleep(delayFor(attemptCount, retryOptions.noise));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    let parsedBody;
    try {
      parsedBody = text.length === 0 ? '' : JSON.parse(text);
    } catch (_error) {
      parsedBody = text;
    }

    if (response.ok) {
      return { statusCode: response.status, statusMessage: response.statusText, body: parsedBody };
    }

    const canRetry =
      retryOptions.methods.includes(method) &&
      retryOptions.statusCodes.includes(response.status) &&
      response.status !== 413 &&
      attemptCount <= retryOptions.limit;

    if (canRetry) {
      await sleep(delayFor(attemptCount, retryOptions.noise));
      continue;
    }

    throw new HTTPError(
      { statusCode: response.status, statusMessage: response.statusText, body: parsedBody },
      method,
      finalUrl.toString()
    );
  }
}

export default { request, HTTPError };
