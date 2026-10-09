// Remembers (per account, on this device) that the writer has read the welcome letter.
export const welcomeSeenKey = (userId: string) => `welcome-seen:${userId}`;
