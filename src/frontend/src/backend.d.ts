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
export type StrongPassword = string;
export interface SecureNote {
    title: string;
    content: string;
    blob?: ExternalBlob;
}
export interface Feedback {
    message: string;
    timestamp: bigint;
}
export interface FeedbackForUser {
    id: bigint;
    message: string;
    timestamp: bigint;
    status: { unread: null } | { read: null } | { resolved: null };
    adminReply: string | null;
    adminReplyTimestamp: bigint | null;
}
export interface CustomField {
    name: string;
    value: string;
    fieldType: string;
}
export interface PasswordEntry {
    url: string;
    title: string;
    username: Username;
    blob?: ExternalBlob;
    password: StrongPassword;
    notes: string;
    email: string;
    category: string;
    totp: string;
    customFields: CustomField[];
}
export type Username = string;
export interface UserProfile {
    name: string;
    language: Language;
}
export interface UserWithPrincipal {
    principal: Principal;
    name: string;
    language: Language;
    isBlocked: boolean;
    passwordCount: bigint;
    noteCount: bigint;
}
export interface SystemStats {
    totalUsers: bigint;
    blockedUsers: bigint;
    totalPasswords: bigint;
    totalNotes: bigint;
    totalFeedback: bigint;
    unreadFeedback: bigint;
}
export interface LoginActivity {
    principal: Principal;
    lastLoginTimestamp: bigint;
    loginCount: bigint;
}
export interface UserStats {
    passwordCount: bigint;
    noteCount: bigint;
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
    addPasswordEntryToVault(title: string, username: Username, password: StrongPassword, url: string, notes: string, email: string, category: string, totp: string, customFields: CustomField[], blob: ExternalBlob | null): Promise<void>;
    addSecureNoteToVault(title: string, content: string, blob: ExternalBlob | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deletePasswordEntryFromVault(title: string): Promise<void>;
    deleteSecureNoteFromVault(title: string): Promise<void>;
    getActiveUserCount(): Promise<bigint>;
    getAllFeedbackEntriesForPrincipal(id: Principal): Promise<Array<Feedback>>;
    getAllPasswordEntriesFromVault(): Promise<Array<PasswordEntry>>;
    getAllSecureNotesFromVault(): Promise<Array<SecureNote>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getPasswordEntryFromVault(title: string): Promise<PasswordEntry>;
    getSecureNoteFromVault(title: string): Promise<SecureNote>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    getUserProfileFromVault(): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    listAllUserProfiles(): Promise<Array<UserProfile>>;
    listAllUsersWithPrincipals(): Promise<Array<UserWithPrincipal>>;
    blockUser(user: Principal): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    getUserStats(user: Principal): Promise<UserStats>;
    isUserBlocked(user: Principal): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitFeedbackEntry(message: string, timestamp: bigint): Promise<void>;
    updateUserProfileInVault(name: string, language: Language): Promise<UserProfile>;
    getAllFeedbackEntries(): Promise<Array<FeedbackWithPrincipalRaw>>;
    markFeedbackAsRead(user: Principal, feedbackId: bigint): Promise<void>;
    markFeedbackAsResolved(user: Principal, feedbackId: bigint): Promise<void>;
    adminDeleteFeedback(user: Principal, feedbackId: bigint): Promise<void>;
    adminReplyFeedback(user: Principal, feedbackId: bigint, reply: string, replyTimestamp: bigint): Promise<void>;
    getUserFeedbackWithReplies(): Promise<Array<FeedbackForUser>>;
    getSystemStats(): Promise<SystemStats>;
    recordLoginActivity(timestamp: bigint): Promise<void>;
    getLoginActivityLog(): Promise<Array<LoginActivity>>;
}
export interface FeedbackWithPrincipalRaw {
    principal: Principal;
    id: bigint;
    message: string;
    timestamp: bigint;
    status: { unread: null } | { read: null } | { resolved: null };
    adminReply: [] | [string];
    adminReplyTimestamp: [] | [bigint];
}
