const auth = {
  check() {
    return sessionStorage.getItem('inv_auth') === 'true';
  },
  
  login(username, password) {
    if (username === 'admin' && password === 'password123') {
      sessionStorage.setItem('inv_auth', 'true');
      return true;
    }
    return false;
  },
  
  logout() {
    sessionStorage.removeItem('inv_auth');
    window.location.href = 'index.html';
  },
  
  guard() {
    if (!this.check()) {
      window.location.href = 'index.html';
    }
  }
};
