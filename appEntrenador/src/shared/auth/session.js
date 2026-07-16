const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const NAME_KEY = 'userName';
const ID_KEY = 'userId';
const SUPERADMIN_KEY = 'userIsSuperadmin';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser() {
  const id = localStorage.getItem(ID_KEY);
  const rol = localStorage.getItem(ROLE_KEY);
  const nombre = localStorage.getItem(NAME_KEY);
  const isSuperadminRaw = localStorage.getItem(SUPERADMIN_KEY);

  if (!id || !rol) return null;

  return {
    id: Number(id),
    rol,
    nombre: nombre || '',
    is_superadmin: isSuperadminRaw === 'true',
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
    localStorage.setItem(
      SUPERADMIN_KEY,
      user.is_superadmin === true || user.is_superadmin === 1 ? 'true' : 'false',
    );
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(SUPERADMIN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && getSessionUser());
}
