import { chromeService } from "../../services/chromeApi";
import { recentActionsStore } from "../../stores/recentActionsStore";

const QUICK_ACTIONS = [
    { id: "pin", icon: "push_pin", label: "Pin" },
    { id: "reload", icon: "refresh", label: "Reload" },
    { id: "duplicate", icon: "content_copy", label: "Duplicate" },
    { id: "copy", icon: "link", label: "Copy URL" },
    { id: "sleep", icon: "sleep", label: "Sleep" },
    { id: "find", icon: "find_in_page", label: "Find" },
];

const SAVE_TO_ACTIONS = [
    { id: "save_favorite_apps", icon: "stars", label: "Favorite apps" },
    { id: "save_bookmarks", icon: "bookmark", label: "Bookmarks" },
    { id: "save_database", icon: "database", label: "Database" },
    { id: "save_tasks", icon: "task_alt", label: "Tasks" },
];

const MOVE_TO_ACTIONS = [
    { id: "move_popup", icon: "open_in_new", label: "Popup" },
    { id: "move_window", icon: "web", label: "Window" },
    { id: "move_group", icon: "folder", label: "Group" },
    { id: "move_reading_list", icon: "menu_book", label: "Reading list" },
    { id: "move_bookmarks", icon: "bookmark", label: "Bookmarks" },
    { id: "move_database", icon: "database", label: "Database" },
    { id: "move_task", icon: "task_alt", label: "Task" },
    { id: "move_time", icon: "schedule", label: "Time" },
];

const APPEARANCE_ACTIONS = [
    { id: "zoom", icon: "zoom_in", label: "Zoom" },
    { id: "font_size", icon: "format_size", label: "Font size" },
    { id: "dark_mode", icon: "dark_mode", label: "Dark mode" },
    { id: "reader_mode", icon: "auto_stories", label: "Reader mode" },
    { id: "hide_elements", icon: "visibility_off", label: "Hide elements" },
];

const CUSTOM_ACTIONS = [];

const CLOSE_ACTIONS = [
    { id: "close", icon: "close", label: "Close" },
    {
        id: "close_others",
        icon: "remove_circle_outline",
        label: "Close others",
    },
    {
        id: "close_to_right",
        icon: "keyboard_double_arrow_right",
        label: "Close to the right",
    },
];

/** @type {readonly { id: string; label: string | null; items: { id: string; icon: string; label: string }[] }[]} */
export const TAB_MENU_SECTIONS = [
    { id: "quick", label: null, items: QUICK_ACTIONS },
    { id: "save", label: "Save to", items: SAVE_TO_ACTIONS },
    { id: "move", label: "Move to", items: MOVE_TO_ACTIONS },
    { id: "appearance", label: "Appearance", items: APPEARANCE_ACTIONS },
    { id: "custom", label: "Custom actions", items: CUSTOM_ACTIONS },
    { id: "close", label: "Close", items: CLOSE_ACTIONS },
];

/**
 * @param {chrome.tabs.Tab | null} tab
 * @param {string} sectionId
 * @param {string} actionId
 * @param {() => void} onClose
 */
export async function runTabMenuAction(tab, sectionId, actionId, onClose) {
    if (!tab?.id) return;
    try {
        switch (actionId) {
            case "pin":
                await chromeService.pinTab(tab.id);
                break;
            case "reload":
                await chromeService.reloadTab(tab.id);
                break;
            case "duplicate":
                await chromeService.duplicateTab(tab.id);
                break;
            case "copy": {
                const url = await chromeService.copyTabUrl(tab.id);
                if (url) await navigator.clipboard.writeText(url);
                break;
            }
            case "sleep":
                await chromeService.discardTab(tab.id);
                break;
            case "find":
                await chromeService.activateTab(tab.id);
                break;
            case "move_popup":
                await chromeService.createWindowWithTab(tab.id, {
                    asPopup: true,
                });
                break;
            case "move_window":
                await chromeService.createWindowWithTab(tab.id);
                break;
            case "close":
                await chromeService.closeTab(tab.id);
                break;
            case "close_others":
                await chromeService.closeOtherTabs(tab.id);
                break;
            case "close_to_right":
                await chromeService.closeTabsToRight(tab.id);
                break;
            case "create_action":
                return;
            default:
                return;
        }
        await recentActionsStore.addAction({
            category: sectionId,
            action: actionId,
        });
        onClose();
    } catch (e) {
        console.error("TabMenu action failed:", e);
    }
}
