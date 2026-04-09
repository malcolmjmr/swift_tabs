export const LINK_RIGHT_MOVE_CANCEL_PX = 14;
/** Same-tick as contextmenu: long-press timer may open the menu after this handler; defer tab open. */
export const LINK_CONTEXT_TAB_DEFER_MS = 24;
export const TAB_SWITCHING_DISMISS_MS = 1500;
export const NEW_WINDOW_CONTEXT_TIMEOUT_MS = 30000;

/** Horizontal triage gesture: icon fade-in start, commit on release (wheel idle), auto-fire */
export const TRIAGE_HORIZONTAL_SOFT_PX = 64;
export const TRIAGE_HORIZONTAL_COMMIT_PX = 168;
export const TRIAGE_HORIZONTAL_AUTO_PX = 260;
/** Clamp horizontal shift and map wheel delta (~px per unit varies by device) */
export const TRIAGE_WHEEL_DELTA_X_SCALE = 1.2;
/** After last horizontal wheel event, treat as "release" for commit threshold */
export const TRIAGE_WHEEL_IDLE_COMMIT_MS = 160;
