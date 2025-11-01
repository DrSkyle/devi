// This is a helper function to determine if a medicine is expiring soon.
export const isExpiringSoon = (expiryDate, days = 30) => {
    if (!expiryDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

    const expiry = new Date(expiryDate);
    
    const threshold = new Date();
    threshold.setDate(today.getDate() + days);

    // Only count if it's not already expired
    return expiry <= threshold && expiry >= today;
};