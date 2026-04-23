/**
 * pages.config.js — Route registry for SpinDeck
 *
 * Keep the keys in PAGES identical to the default export name of the
 * corresponding file in ./pages/. `mainPage` controls which page loads
 * when the user visits `/`.
 */
import RideDisplay     from './pages/RideDisplay';
import PulseView       from './pages/PulseView';
import Launcher        from './pages/Launcher';
import RiderSetup      from './pages/RiderSetup';
import DurationSelect  from './pages/DurationSelect';
import SessionLog      from './pages/SessionLog';

export const PAGES = {
  Launcher,
  RideDisplay,
  PulseView,
  RiderSetup,
  DurationSelect,
  SessionLog,
};

export const pagesConfig = {
  mainPage: 'Launcher',
  Pages: PAGES,
};
