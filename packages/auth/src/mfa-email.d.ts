export declare function sendMfaEmailOtp(params: {
    userId: string;
    to: string;
    userFirstname: string;
    otpCode: string;
    expiresInMinutes: number;
}): Promise<void>;
