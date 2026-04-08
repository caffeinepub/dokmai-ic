import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PasswordHistoryEntry {
    changedAt: bigint;
    password: string;
}
export interface FeedbackForUser {
    id: bigint;
    status: FeedbackStatus;
    adminReply?: string;
    message: string;
    timestamp: bigint;
    adminReplyTimestamp?: bigint;
}
export interface SystemStats {
    blockedUsers: bigint;
    totalPasswords: bigint;
    unreadFeedback: bigint;
    totalFeedback: bigint;
    totalNotes: bigint;
    totalUsers: bigint;
}
export interface PasswordEntry {
    url: string;
    title: string;
    username: Username;
    blob?: ExternalBlob;
    password: StrongPassword;
    totp: string;
    email: string;
    customFields: Array<CustomField>;
    notes: string;
    category: string;
}
export interface SecureNote {
    title: string;
    content: string;
    blob?: ExternalBlob;
}
export interface LoginActivity {
    principal: Principal;
    loginCount: bigint;
    lastLoginTimestamp: bigint;
}
export type StrongPassword = string;
export interface FeedbackWithPrincipal {
    id: bigint;
    status: FeedbackStatus;
    principal: Principal;
    adminReply?: string;
    message: string;
    timestamp: bigint;
    adminReplyTimestamp?: bigint;
}
export interface FeedbackLegacy {
    message: string;
    timestamp: bigint;
}
export interface UserWithPrincipal {
    principal: Principal;
    isBlocked: boolean;
    name: string;
    language: Language;
    noteCount: bigint;
    passwordCount: bigint;
}
export interface CustomField {
    value: string;
    name: string;
    fieldType: string;
}
export type Username = string;
export interface UserProfile {
    name: string;
    language: Language;
}
export interface UserStats {
    noteCount: bigint;
    passwordCount: bigint;
}
export enum FeedbackStatus {
    resolved = "resolved",
    read = "read",
    unread = "unread"
}
export enum Language {
    en = "en",
    nl = "nl",
    pl = "pl",
    th = "th",
    zh = "zh"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPasswordBatchToVault(entries: Array<{
        url: string;
        title: string;
        username: Username;
        blob?: ExternalBlob;
        password: StrongPassword;
        totp: string;
        email: string;
        customFields: Array<CustomField>;
        notes: string;
        category: string;
    }>): Promise<{
        imported: bigint;
        skipped: bigint;
    }>;
    addPasswordEntryToVault(title: string, username: Username, password: StrongPassword, url: string, notes: string, email: string, category: string, totp: string, customFields: Array<CustomField>, blob: ExternalBlob | null): Promise<void>;
    addSecureNoteToVault(title: string, content: string, blob: ExternalBlob | null): Promise<void>;
    adminDeleteFeedback(user: Principal, feedbackId: bigint): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    adminReplyFeedback(user: Principal, feedbackId: bigint, reply: string, replyTimestamp: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    clearPasswordHistory(title: string): Promise<void>;
    deletePasswordEntryFromVault(title: string): Promise<void>;
    deleteSecureNoteFromVault(title: string): Promise<void>;
    getActiveUserCount(): Promise<bigint>;
    getAllFeedbackEntries(): Promise<Array<FeedbackWithPrincipal>>;
    getAllFeedbackEntriesForPrincipal(id: Principal): Promise<Array<FeedbackLegacy>>;
    getAllPasswordEntriesFromVault(): Promise<Array<PasswordEntry>>;
    getAllSecureNotesFromVault(): Promise<Array<SecureNote>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getLoginActivityLog(): Promise<Array<LoginActivity>>;
    getMaintenanceMode(): Promise<boolean>;
    getPasswordEntryFromVault(title: string): Promise<PasswordEntry>;
    getPasswordHistory(title: string): Promise<Array<PasswordHistoryEntry>>;
    getSecureNoteFromVault(title: string): Promise<SecureNote>;
    getSystemAnnouncement(): Promise<string | null>;
    getSystemStats(): Promise<SystemStats>;
    getUserFeedbackWithReplies(): Promise<Array<FeedbackForUser>>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    getUserProfileFromVault(): Promise<UserProfile>;
    getUserStats(user: Principal): Promise<UserStats>;
    isCallerAdmin(): Promise<boolean>;
    isUserBlocked(user: Principal): Promise<boolean>;
    listAllUserProfiles(): Promise<Array<UserProfile>>;
    listAllUsersWithPrincipals(): Promise<Array<UserWithPrincipal>>;
    markFeedbackAsRead(user: Principal, feedbackId: bigint): Promise<void>;
    markFeedbackAsResolved(user: Principal, feedbackId: bigint): Promise<void>;
    recordLoginActivity(timestamp: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMaintenanceMode(enabled: boolean): Promise<void>;
    setSystemAnnouncement(text: string | null): Promise<void>;
    submitFeedbackEntry(message: string, timestamp: bigint): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    updatePasswordEntryInVault(title: string, username: Username, password: StrongPassword, url: string, notes: string, email: string, category: string, totp: string, customFields: Array<CustomField>, blob: ExternalBlob | null, timestamp: bigint): Promise<void>;
    updateUserProfileInVault(name: string, language: Language): Promise<UserProfile>;
}
