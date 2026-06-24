import axios from "axios";

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
 * Sends a visitor notification via same-origin API route (key stays server-side).
 */
export const sendNotificationMessage = (
    userCountry,
    appName,
    browser,
    botInfo
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
        .post("/api/notify", messageData, {
            headers: { "Content-Type": "application/json" },
        })
        .catch((error) =>
            console.error(
                "Error sending notification message:",
                error?.response?.data?.details || error.message
            )
        );
};
