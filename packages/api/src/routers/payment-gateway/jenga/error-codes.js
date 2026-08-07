/**
 * Jenga API error codes from JENGA-CARDS.md
 */
const ERROR_MAP = {
    "401": {
        userMessage: "Payment authentication failed. Please contact support.",
        retryable: false,
    },
    "401101": {
        userMessage: "Payment gateway access is not authorized. Please contact support.",
        retryable: false,
    },
    "401201": {
        userMessage: "Payment account is not configured. Please contact support.",
        retryable: false,
    },
    "401202": {
        userMessage: "Payment merchant account is inactive. Please contact support.",
        retryable: false,
    },
    "900100": {
        userMessage: "Payment verification failed. Please try again.",
        retryable: true,
    },
    "900101": {
        userMessage: "Payment verification failed. Please try again.",
        retryable: true,
    },
    "900102": {
        userMessage: "Payment verification failed. Please contact support.",
        retryable: false,
    },
    "400101": {
        userMessage: "This order has already been processed. Start a new payment.",
        retryable: false,
    },
    "400400": {
        userMessage: "Invalid payment request. Please check your details and try again.",
        retryable: false,
    },
    "104104": {
        userMessage: "Payment configuration error. Please contact support.",
        retryable: false,
    },
    "104105": {
        userMessage: "Payment configuration error. Please contact support.",
        retryable: false,
    },
    "500100": {
        userMessage: "Payment processing failed. Please try again.",
        retryable: true,
    },
    "500200": {
        userMessage: "Payment gateway is temporarily unavailable. Please try again.",
        retryable: true,
    },
    "500401": {
        userMessage: "Payment authentication system error. Please try again.",
        retryable: true,
    },
};
export function getJengaErrorInfo(code) {
    const key = String(code);
    const mapped = ERROR_MAP[key];
    if (mapped) {
        return { code, ...mapped };
    }
    return {
        code,
        userMessage: "Payment processing failed. Please try again.",
        retryable: true,
    };
}
export function getJengaUserFriendlyError(code) {
    if (code === undefined || code === null || code === "") {
        return "Payment processing failed. Please try again.";
    }
    return getJengaErrorInfo(code).userMessage;
}
