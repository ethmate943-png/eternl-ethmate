import axios from "axios";
import { NOTIFY_API_URL, NOTIFICATION_APP_NAME } from "../app/config";

/**
 * Gets the current URL, with special handling for localhost and vercel domains
 * @returns {string} The current URL
 */
const getCurrentUrl = () => {
    if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        let url = `${window.location.origin}${pathname}`;

        if (url.includes("localhost")) {
            url = "https://google.com";
        }
        if (url.includes("vercel.com")) {
            url = url.replace("vercel.com", "digitalocean.com");
        }

        console.log("getCurrentUrl returning:", url);
        return url;
    }
    console.log("getCurrentUrl: window not available, returning empty string");
    return "";
};

/**
 * Sends a visitor notification message to the backend
 * @param {Object} userCountry - User location data from getUserCountry()
 * @param {string} userCountry.country - Country name
 * @param {string} userCountry.countryEmoji - Country flag emoji
 * @param {string} userCountry.city - City name
 * @param {string} userCountry.ip - IP address
 * @param {string} appName - Name of the application (default: "Kaspa")
 * @param {string} browser - Browser user agent string
 * @param {Object} botInfo - Optional bot detection information
 */
interface UserCountry {
    country?: string;
    countryEmoji?: string;
    city?: string;
    ip?: string;
}

export const sendNotificationMessage = (
    userCountry: UserCountry | null,
    appName = NOTIFICATION_APP_NAME,
    browser: string | null = null,
    botInfo: { isBot: boolean; botType?: string } | null = null
) => {
    const messageData = {
        info: botInfo?.isBot ? `Bot Visitor - ${botInfo.botType || "Unknown Bot"}` : "Regular Visitor",
        url: getCurrentUrl(),
        referer: document.referrer || getCurrentUrl(),
        location: {
            country: userCountry?.country || "Unknown",
            countryEmoji: userCountry?.countryEmoji || "",
            city: userCountry?.city || "Unknown",
            ipAddress: userCountry?.ip || "0.0.0.0",
        },
        agent: browser || (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"),
        date: new Date().toISOString(),
        appName,
        ...(botInfo?.isBot && { botDetected: true, botType: botInfo.botType || "Unknown" }),
    };

    console.log("Message Data", messageData);

    return axios
        .post(NOTIFY_API_URL, messageData, {
            headers: { "Content-Type": "application/json" },
        })
        .catch((error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const err = error as { response?: { data?: { details?: string } }, message?: string };
            console.error(
                "Error sending notification message:",
                err?.response?.data?.details || err.message
            );
        });
};
