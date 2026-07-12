const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const NAME_KEY = 'userName';
const ID_KEY = 'userId';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser() {
  const id = localStorage.getItem(ID_KEY);
  const rol = localStorage.getItem(ROLE_KEY);
  const nombre = localStorage.getItem(NAME_KEY);

  if (!id || !rol) return null;

  return {
    id: Number(id),
    rol,
    nombre: nombre || '',
  };
}

export function setSession({ user, token }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(ROLE_KEY, user.rol);
    localStorage.setItem(NAME_KEY, user.nombre);
    localStorage.setItem(ID_KEY, String(user.id));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(ID_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && getSessionUser());
}
