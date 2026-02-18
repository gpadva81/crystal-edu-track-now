/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Assignments from './pages/Assignments';
import ClassDetails from './pages/ClassDetails';
import Classes from './pages/Classes';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Import from './pages/Import';
import Reminders from './pages/Reminders';
import Rewards from './pages/Rewards';
import Tutor from './pages/Tutor';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Assignments": Assignments,
    "ClassDetails": ClassDetails,
    "Classes": Classes,
    "Dashboard": Dashboard,
    "Home": Home,
    "Import": Import,
    "Reminders": Reminders,
    "Rewards": Rewards,
    "Tutor": Tutor,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};