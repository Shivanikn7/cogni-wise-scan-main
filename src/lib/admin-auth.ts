export const adminAuthEvent = "adminAuthChange";

export const setAdminToken = (token: string) => {
  localStorage.setItem("admin_token", token);
  window.dispatchEvent(new Event(adminAuthEvent));
};

export const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};

export const isAdminAuthenticated = () => {
  return !!getAdminToken();
};

export const clearAdminToken = () => {
  localStorage.removeItem("admin_token");
  window.dispatchEvent(new Event(adminAuthEvent));
};
