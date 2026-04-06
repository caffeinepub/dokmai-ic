import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type {
  CustomField,
  Feedback,
  FeedbackForUser,
  LoginActivity,
  SecureNote,
  SystemStats,
  UserProfile,
  UserRole,
  UserWithPrincipal,
} from "../backend.d";
import { Language } from "../backend.d";
import { useActor } from "./useActor";

export interface FeedbackWithPrincipal {
  principal: Principal;
  id: bigint;
  message: string;
  timestamp: bigint;
  status: { unread: null } | { read: null } | { resolved: null };
  adminReply: string | null;
  adminReplyTimestamp: bigint | null;
}

// Extended PasswordEntry including new fields added to the backend
export interface PasswordEntry {
  url: string;
  title: string;
  username: string;
  password: string;
  notes: string;
  email: string;
  category: string;
  totp: string;
  customFields: CustomField[];
  blob?: ExternalBlob;
}

export interface PasswordHistoryEntry {
  password: string;
  changedAt: bigint;
}

// Helper to unwrap Motoko optional ([] | [T]) to T | null
function unwrapOpt<T>(opt: [] | [T]): T | null {
  if (!opt || opt.length === 0) return null;
  return opt[0];
}

export function usePasswordEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<PasswordEntry[]>({
    queryKey: ["passwords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPasswordEntriesFromVault() as unknown as Promise<
        PasswordEntry[]
      >;
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePasswordHistory(title: string, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<PasswordHistoryEntry[]>({
    queryKey: ["passwordHistory", title],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPasswordHistory(title) as Promise<
        PasswordHistoryEntry[]
      >;
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useUpdatePassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      username: string;
      password: string;
      url: string;
      notes: string;
      email: string;
      category: string;
      totp: string;
      customFields: CustomField[];
      existingBlob?: ExternalBlob;
      file?: File | null;
      onUploadProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      let blob: ExternalBlob | null = null;
      if (data.file) {
        const arrayBuffer = await data.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let externalBlob = ExternalBlob.fromBytes(bytes);
        if (data.onUploadProgress) {
          externalBlob = externalBlob.withUploadProgress(data.onUploadProgress);
        }
        blob = externalBlob;
      } else if (data.existingBlob) {
        blob = data.existingBlob;
      }
      await (actor as any).updatePasswordEntryInVault(
        data.title,
        data.username,
        data.password,
        data.url,
        data.notes,
        data.email,
        data.category,
        data.totp,
        data.customFields,
        blob,
        BigInt(Date.now()) * BigInt(1_000_000),
      );
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["passwords"] });
      qc.invalidateQueries({
        queryKey: ["passwordHistory", variables.title],
      });
    },
  });
}

export function useSecureNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<SecureNote[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSecureNotesFromVault();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return { name: "", language: Language.en };
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveUserCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["activeUserCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getActiveUserCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFeedback(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Feedback[]>({
    queryKey: ["feedback", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getAllFeedbackEntriesForPrincipal(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useUserFeedbackWithReplies() {
  const { actor, isFetching } = useActor();
  return useQuery<FeedbackForUser[]>({
    queryKey: ["feedbackWithReplies"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getUserFeedbackWithReplies();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFeedbackEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<FeedbackWithPrincipal[]>({
    queryKey: ["allFeedback"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await (actor as any).getAllFeedbackEntries();
      return raw.map((fb: any) => ({
        principal: fb.principal,
        id: fb.id,
        message: fb.message,
        timestamp: fb.timestamp,
        status: fb.status,
        adminReply: unwrapOpt(fb.adminReply),
        adminReplyTimestamp: unwrapOpt(fb.adminReplyTimestamp),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkFeedbackAsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: Principal; feedbackId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).markFeedbackAsRead(data.user, data.feedbackId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allFeedback"] }),
  });
}

export function useMarkFeedbackAsResolved() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: Principal; feedbackId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).markFeedbackAsResolved(data.user, data.feedbackId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allFeedback"] }),
  });
}

export function useAdminDeleteFeedback() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: Principal; feedbackId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).adminDeleteFeedback(data.user, data.feedbackId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allFeedback"] }),
  });
}

export function useAdminReplyFeedback() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      user: Principal;
      feedbackId: bigint;
      reply: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).adminReplyFeedback(
        data.user,
        data.feedbackId,
        data.reply,
        BigInt(Date.now()) * BigInt(1_000_000),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allFeedback"] }),
  });
}

export function useAddPassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      username: string;
      password: string;
      url: string;
      notes: string;
      email: string;
      category: string;
      totp: string;
      customFields: CustomField[];
      file?: File | null;
      onUploadProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      let blob: ExternalBlob | null = null;
      if (data.file) {
        const arrayBuffer = await data.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let externalBlob = ExternalBlob.fromBytes(bytes);
        if (data.onUploadProgress) {
          externalBlob = externalBlob.withUploadProgress(data.onUploadProgress);
        }
        blob = externalBlob;
      }
      await (actor as any).addPasswordEntryToVault(
        data.title,
        data.username,
        data.password,
        data.url,
        data.notes,
        data.email,
        data.category,
        data.totp,
        data.customFields,
        blob,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passwords"] }),
  });
}

export function useDeletePassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deletePasswordEntryFromVault(title);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passwords"] }),
  });
}

export function useAddSecureNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      file?: File | null;
      onUploadProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      let blob: ExternalBlob | null = null;
      if (data.file) {
        const arrayBuffer = await data.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let externalBlob = ExternalBlob.fromBytes(bytes);
        if (data.onUploadProgress) {
          externalBlob = externalBlob.withUploadProgress(data.onUploadProgress);
        }
        blob = externalBlob;
      }
      await actor.addSecureNoteToVault(data.title, data.content, blob);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteSecureNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteSecureNoteFromVault(title);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useSubmitFeedback() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.submitFeedbackEntry(
        message,
        BigInt(Date.now()) * BigInt(1_000_000),
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["feedbackWithReplies"] }),
  });
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; language: Language }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateUserProfileInVault(data.name, data.language);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.assignCallerUserRole(data.user, data.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}

export function useAllUsersWithPrincipals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserWithPrincipal[]>({
    queryKey: ["allUsersWithPrincipals"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listAllUsersWithPrincipals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).blockUser(user);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["allUsersWithPrincipals"] }),
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).unblockUser(user);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["allUsersWithPrincipals"] }),
  });
}

export function useAdminDeleteUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).adminDeleteUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsersWithPrincipals"] });
      qc.invalidateQueries({ queryKey: ["activeUserCount"] });
    },
  });
}

export function useSystemStats() {
  const { actor, isFetching } = useActor();
  return useQuery<SystemStats>({
    queryKey: ["systemStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalUsers: BigInt(0),
          blockedUsers: BigInt(0),
          totalPasswords: BigInt(0),
          totalNotes: BigInt(0),
          totalFeedback: BigInt(0),
          unreadFeedback: BigInt(0),
        };
      return (actor as any).getSystemStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLoginActivityLog() {
  const { actor, isFetching } = useActor();
  return useQuery<LoginActivity[]>({
    queryKey: ["loginActivityLog"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getLoginActivityLog();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordLoginActivity() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await (actor as any).recordLoginActivity(
        BigInt(Date.now()) * BigInt(1_000_000),
      );
    },
  });
}

export function useSystemAnnouncement() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["systemAnnouncement"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await (actor as any).getSystemAnnouncement();
      // Motoko optional: [] | [string]
      if (!result || result.length === 0) return null;
      return result[0] as string;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSystemAnnouncement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string | null) => {
      if (!actor) throw new Error("Actor not ready");
      const opt = text ? [text] : [];
      await (actor as any).setSystemAnnouncement(opt);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["systemAnnouncement"] }),
  });
}

export function useMaintenanceMode() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["maintenanceMode"],
    queryFn: async () => {
      if (!actor) return false;
      const result = await (actor as any).getMaintenanceMode();
      return Boolean(result);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useSetMaintenanceMode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not ready");
      await (actor as any).setMaintenanceMode(enabled);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenanceMode"] }),
  });
}
