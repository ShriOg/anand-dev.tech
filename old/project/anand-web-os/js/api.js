var API = (function () {
  'use strict';

  var BASE_URL = 'https://anand-os-backend.onrender.com';

  function getToken() {
    return localStorage.getItem('token');
  }

  function setToken(token) {
    localStorage.setItem('token', token);
  }

  function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  function headers(isJson) {
    var h = {};
    var token = getToken();
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (isJson) h['Content-Type'] = 'application/json';
    return h;
  }

  function handleUnauth() {
    removeToken();
    window.location.href = 'login.html';
  }

  async function request(method, path, body, isFormData) {
    var opts = {
      method: method,
      headers: isFormData ? { 'Authorization': 'Bearer ' + (getToken() || '') } : headers(true)
    };

    if (body) {
      opts.body = isFormData ? body : JSON.stringify(body);
    }

    var res;
    try {
      res = await fetch(BASE_URL + path, opts);
    } catch (err) {
      throw new Error('Network error. Please check your connection.');
    }

    if (res.status === 401) {
      handleUnauth();
      throw new Error('Session expired. Please login again.');
    }

    var data;
    var contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      var msg = (typeof data === 'object' && data.message) ? data.message : 'Request failed';
      throw new Error(msg);
    }

    return data;
  }

  function get(path) {
    return request('GET', path);
  }

  function post(path, body) {
    return request('POST', path, body);
  }

  function put(path, body) {
    return request('PUT', path, body);
  }

  function del(path) {
    return request('DELETE', path);
  }

  function upload(path, formData) {
    return request('POST', path, formData, true);
  }

  return {
    BASE_URL: BASE_URL,
    getToken: getToken,
    setToken: setToken,
    removeToken: removeToken,
    getUser: getUser,
    setUser: setUser,
    get: get,
    post: post,
    put: put,
    del: del,
    upload: upload
  };
})();
