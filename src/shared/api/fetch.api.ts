import 'isomorphic-fetch';

const createRequest = function post<T>(postData: T) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  };
};

export const fetchRoute = async function fetchEndpoint<T>(endpoint: string, postData: T = null) {
  try {
    const res = (postData ? await fetch(endpoint, createRequest(postData)) : await fetch(endpoint,
      { credentials: 'same-origin' }));
    if (res.redirected) {
      window.location.href = res.url;
    }
    const { ok, status, statusText } = res;
    if (!ok) {
      try {
        const { error } = await res.json();
        return { error };
      } catch (e) {
        return { error: `There was a server error processing the request to ${endpoint}: ${status} ${statusText}` };
      }
    }
    const { redirect, ...responseData } = await res.json();
    if (redirect) {
      window.location.href = redirect;
    }
    return { ...responseData };
  } catch ({ message }) {
    return { error: message };
  }
};
