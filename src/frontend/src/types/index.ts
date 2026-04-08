import type { Principal } from "@icp-sdk/core/principal";
import type { ExternalBlob } from "../backend";

// Language enum matching Motoko { #en; #th; #nl; #pl; #zh }
export enum Language {
  en = "en",
  th = "th",
  nl = "nl",
  pl = "pl",
  zh = "zh",
}

export interface CustomField {
  name: string;
  value: string;
  fieldType: string; // "text" | "password" | "url"
}

export interface SecureNote {
  title: string;
  content: string;
  blob?: ExternalBlob;
}

export interface UserProfile {
  name: string;
  language: Language;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface Feedback {
  id: bigint;
  message: string;
  timestamp: bigint;
  status: { unread: null } | { read: null } | { resolved: null };
  adminReply: [] | [string];
  adminReplyTimestamp: [] | [bigint];
}

export interface FeedbackForUser {
  id: bigint;
  message: string;
  timestamp: bigint;
  status: { unread: null } | { read: null } | { resolved: null };
  adminReply: [] | [string];
  adminReplyTimestamp: [] | [bigint];
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
