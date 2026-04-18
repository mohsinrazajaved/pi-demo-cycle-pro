/**
 * base44Client.js — Offline stub
 * The @base44/sdk package is no longer used. All data comes from mockDataService.js.
 * This file is kept to avoid import errors in any files not yet updated.
 */
export const base44 = {
  entities: {},
  auth: { me: () => Promise.reject(new Error('offline')), logout: () => { }, redirectToLogin: () => { } },
  appLogs: { logUserInApp: () => Promise.resolve() },
};
