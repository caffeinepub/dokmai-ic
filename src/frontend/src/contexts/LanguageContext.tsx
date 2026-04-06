import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type LangCode = "en" | "th" | "nl" | "pl" | "zh";

export interface Translations {
  // Login
  appName: string;
  tagline: string;
  loginButton: string;
  languageLabel: string;
  loginWith: string;
  welcomeBack: string;
  // Nav
  navDashboard: string;
  navPasswords: string;
  navVault: string;
  navIdentity: string;
  navAdmin: string;
  navSecurity: string;
  navSettings: string;
  navHelp: string;
  navFeedback: string;
  navBackup: string;
  // Dashboard
  dashWelcome: string;
  dashSecurityOverview: string;
  dashActiveSessions: string;
  dashRecentActivity: string;
  dashSecurityTips: string;
  dashQuickPasswords: string;
  dashQuickNotes: string;
  dashTotalPasswords: string;
  dashTotalNotes: string;
  dashStrength: string;
  // Passwords
  pwdTitle: string;
  pwdAdd: string;
  pwdEdit: string;
  pwdDelete: string;
  pwdShow: string;
  pwdHide: string;
  pwdGenerate: string;
  pwdCopy: string;
  pwdCopied: string;
  pwdStrength: string;
  pwdWeak: string;
  pwdFair: string;
  pwdGood: string;
  pwdStrong: string;
  pwdLength: string;
  pwdUppercase: string;
  pwdLowercase: string;
  pwdNumbers: string;
  pwdSymbols: string;
  pwdNoAmbiguous: string;
  pwdNoAmbiguousHint: string;
  pwdSave: string;
  pwdCancel: string;
  pwdUsername: string;
  pwdPassword: string;
  pwdUrl: string;
  pwdNotes: string;
  pwdEntryTitle: string;
  // Vault
  vaultTitle: string;
  vaultNotes: string;
  vaultFiles: string;
  vaultAddNote: string;
  vaultUploadFile: string;
  vaultNoteTitle: string;
  vaultNoteContent: string;
  vaultDeleteNote: string;
  vaultDeleteFile: string;
  // Settings
  settingsTitle: string;
  settingsAccountId: string;
  settingsPrincipalId: string;
  settingsManageII: string;
  settingsLogout: string;
  settingsLanguage: string;
  settingsSave: string;
  settingsProfile: string;
  settingsName: string;
  settingsLogoutConfirm: string;
  // Feedback
  feedbackTitle: string;
  feedbackPlaceholder: string;
  feedbackSubmit: string;
  feedbackSuccess: string;
  feedbackHistory: string;
  // Backup
  backupTitle: string;
  backupDescription: string;
  backupExport: string;
  backupSuccess: string;
  // Admin
  adminTitle: string;
  adminUsers: string;
  adminActiveUsers: string;
  adminRoles: string;
  adminFeedback: string;
  adminFeedbackEmpty: string;
  adminFeedbackFrom: string;
  adminUserManagement: string;
  adminPrincipalId: string;
  adminBlockUser: string;
  adminUnblockUser: string;
  adminDeleteUser: string;
  adminConfirmDelete: string;
  adminConfirmDeleteDesc: string;
  adminUserBlocked: string;
  adminUserActive: string;
  adminPasswords: string;
  adminNotes: string;
  adminCopied: string;
  // General
  loading: string;
  error: string;
  save: string;
  cancel: string;
  delete: string;
  confirm: string;
  close: string;
  copy: string;
  search: string;
  noData: string;
  // CSV Import
  csvImport: string;
  csvImportTitle: string;
  csvImportDesc: string;
  csvImportDrop: string;
  csvImportPreview: string;
  csvImportDuplicates: string;
  csvImportSkip: string;
  csvImportOverwrite: string;
  csvImportSkipAll: string;
  csvImportOverwriteAll: string;
  csvImportStart: string;
  csvImportSuccess: string;
  csvImportNoFile: string;
  csvImportInvalid: string;
}

const translations: Record<LangCode, Translations> = {
  en: {
    appName: "Dokmai IC",
    tagline: "Secure Password Vault & Identity Management on Internet Computer",
    loginButton: "Login",
    languageLabel: "Language",
    loginWith: "Login with Internet Identity",
    welcomeBack: "Welcome back",
    navDashboard: "Dashboard",
    navPasswords: "Passwords",
    navVault: "Vault",
    navIdentity: "Identity",
    navAdmin: "Admin",
    navSecurity: "Security",
    navSettings: "Settings",
    navHelp: "Help",
    navFeedback: "Feedback",
    navBackup: "Backup",
    dashWelcome: "Welcome back",
    dashSecurityOverview: "Security Overview",
    dashActiveSessions: "Active Sessions",
    dashRecentActivity: "Recent Activity",
    dashSecurityTips: "Security Tips",
    dashQuickPasswords: "Stored Passwords",
    dashQuickNotes: "Secure Notes",
    dashTotalPasswords: "Total Passwords",
    dashTotalNotes: "Total Notes",
    dashStrength: "Vault Strength",
    pwdTitle: "Password Manager",
    pwdAdd: "Add Password",
    pwdEdit: "Edit",
    pwdDelete: "Delete",
    pwdShow: "Show",
    pwdHide: "Hide",
    pwdGenerate: "Generate",
    pwdCopy: "Copy",
    pwdCopied: "Copied!",
    pwdStrength: "Strength",
    pwdWeak: "Weak",
    pwdFair: "Fair",
    pwdGood: "Good",
    pwdStrong: "Strong",
    pwdLength: "Length",
    pwdUppercase: "Uppercase",
    pwdLowercase: "Lowercase",
    pwdNumbers: "Numbers",
    pwdSymbols: "Symbols",
    pwdNoAmbiguous: "Avoid Ambiguous Characters",
    pwdNoAmbiguousHint: "Excludes: 0, O, I, l, 1, |",
    pwdSave: "Save Password",
    pwdCancel: "Cancel",
    pwdUsername: "Username",
    pwdPassword: "Password",
    pwdUrl: "Website URL",
    pwdNotes: "Notes",
    pwdEntryTitle: "Title",
    vaultTitle: "Secure Vault",
    vaultNotes: "Secure Notes",
    vaultFiles: "Files",
    vaultAddNote: "Add Note",
    vaultUploadFile: "Upload File",
    vaultNoteTitle: "Note Title",
    vaultNoteContent: "Note Content",
    vaultDeleteNote: "Delete Note",
    vaultDeleteFile: "Delete File",
    settingsTitle: "Settings",
    settingsAccountId: "ICP Account ID",
    settingsPrincipalId: "Principal ID",
    settingsManageII: "Manage Internet Identity",
    settingsLogout: "Logout",
    settingsLanguage: "Language",
    settingsSave: "Save Settings",
    settingsProfile: "Profile",
    settingsName: "Display Name",
    settingsLogoutConfirm: "Are you sure you want to logout?",
    feedbackTitle: "Send Feedback",
    feedbackPlaceholder:
      "Share your experience, suggestions, or report a bug...",
    feedbackSubmit: "Submit Feedback",
    feedbackSuccess: "Feedback submitted successfully!",
    feedbackHistory: "Feedback History",
    backupTitle: "Backup & Export",
    backupDescription:
      "Export all your vault data as an encrypted JSON file for safekeeping.",
    backupExport: "Export Vault Data",
    backupSuccess: "Backup exported successfully!",
    adminTitle: "Admin Dashboard",
    adminUsers: "All Users",
    adminActiveUsers: "Active Users",
    adminRoles: "Assign Roles",
    adminFeedback: "User Feedback",
    adminFeedbackEmpty: "No feedback submitted yet",
    adminFeedbackFrom: "From",
    adminUserManagement: "User Management",
    adminPrincipalId: "Principal ID",
    adminBlockUser: "Block",
    adminUnblockUser: "Unblock",
    adminDeleteUser: "Delete User",
    adminConfirmDelete: "Confirm Delete",
    adminConfirmDeleteDesc:
      "This will permanently delete the user and all their data. This action cannot be undone.",
    adminUserBlocked: "Blocked",
    adminUserActive: "Active",
    adminPasswords: "Passwords",
    adminNotes: "Notes",
    adminCopied: "Copied!",
    loading: "Loading...",
    error: "An error occurred",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    copy: "Copy",
    search: "Search...",
    noData: "No data found",
    csvImport: "Import CSV",
    csvImportTitle: "Import Passwords from CSV",
    csvImportDesc: "Supports Chrome, LastPass, Bitwarden, and generic formats",
    csvImportDrop: "Drop CSV file here or click to browse",
    csvImportPreview: "entries found",
    csvImportDuplicates: "duplicates",
    csvImportSkip: "Skip",
    csvImportOverwrite: "Overwrite",
    csvImportSkipAll: "Skip All Duplicates",
    csvImportOverwriteAll: "Overwrite All Duplicates",
    csvImportStart: "Import Selected",
    csvImportSuccess: "Import complete",
    csvImportNoFile: "No file selected",
    csvImportInvalid: "Invalid CSV format",
  },
  th: {
    appName: "Dokmai IC",
    tagline: "ตู้เซฟรหัสผ่านและระบบจัดการตัวตนบน Internet Computer",
    loginButton: "เข้าสู่ระบบ",
    languageLabel: "ภาษา",
    loginWith: "เข้าสู่ระบบด้วย Internet Identity",
    welcomeBack: "ยินดีต้อนรับกลับ",
    navDashboard: "แดชบอร์ด",
    navPasswords: "รหัสผ่าน",
    navVault: "ตู้เซฟ",
    navIdentity: "ตัวตน",
    navAdmin: "ผู้ดูแล",
    navSecurity: "ความปลอดภัย",
    navSettings: "ตั้งค่า",
    navHelp: "ช่วยเหลือ",
    navFeedback: "ข้อเสนอแนะ",
    navBackup: "สำรองข้อมูล",
    dashWelcome: "ยินดีต้อนรับกลับ",
    dashSecurityOverview: "ภาพรวมความปลอดภัย",
    dashActiveSessions: "เซสชันที่ใช้งานอยู่",
    dashRecentActivity: "กิจกรรมล่าสุด",
    dashSecurityTips: "เคล็ดลับความปลอดภัย",
    dashQuickPasswords: "รหัสผ่านที่บันทึก",
    dashQuickNotes: "บันทึกที่ปลอดภัย",
    dashTotalPasswords: "รหัสผ่านทั้งหมด",
    dashTotalNotes: "บันทึกทั้งหมด",
    dashStrength: "ความแข็งแกร่งของตู้เซฟ",
    pwdTitle: "จัดการรหัสผ่าน",
    pwdAdd: "เพิ่มรหัสผ่าน",
    pwdEdit: "แก้ไข",
    pwdDelete: "ลบ",
    pwdShow: "แสดง",
    pwdHide: "ซ่อน",
    pwdGenerate: "สร้าง",
    pwdCopy: "คัดลอก",
    pwdCopied: "คัดลอกแล้ว!",
    pwdStrength: "ความแข็งแกร่ง",
    pwdWeak: "อ่อนแอ",
    pwdFair: "พอใช้",
    pwdGood: "ดี",
    pwdStrong: "แข็งแกร่ง",
    pwdLength: "ความยาว",
    pwdUppercase: "ตัวพิมพ์ใหญ่",
    pwdLowercase: "ตัวพิมพ์เล็ก",
    pwdNumbers: "ตัวเลข",
    pwdSymbols: "สัญลักษณ์",
    pwdNoAmbiguous: "ตัดตัวอักษรคลุมเครือ",
    pwdNoAmbiguousHint: "ตัดออก: 0, O, I, l, 1, |",
    pwdSave: "บันทึกรหัสผ่าน",
    pwdCancel: "ยกเลิก",
    pwdUsername: "ชื่อผู้ใช้",
    pwdPassword: "รหัสผ่าน",
    pwdUrl: "URL เว็บไซต์",
    pwdNotes: "หมายเหตุ",
    pwdEntryTitle: "ชื่อ",
    vaultTitle: "ตู้เซฟที่ปลอดภัย",
    vaultNotes: "บันทึกที่ปลอดภัย",
    vaultFiles: "ไฟล์",
    vaultAddNote: "เพิ่มบันทึก",
    vaultUploadFile: "อัปโหลดไฟล์",
    vaultNoteTitle: "ชื่อบันทึก",
    vaultNoteContent: "เนื้อหาบันทึก",
    vaultDeleteNote: "ลบบันทึก",
    vaultDeleteFile: "ลบไฟล์",
    settingsTitle: "ตั้งค่า",
    settingsAccountId: "ICP Account ID",
    settingsPrincipalId: "Principal ID",
    settingsManageII: "จัดการ Internet Identity",
    settingsLogout: "ออกจากระบบ",
    settingsLanguage: "ภาษา",
    settingsSave: "บันทึกการตั้งค่า",
    settingsProfile: "โปรไฟล์",
    settingsName: "ชื่อที่แสดง",
    settingsLogoutConfirm: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
    feedbackTitle: "ส่งข้อเสนอแนะ",
    feedbackPlaceholder: "แบ่งปันประสบการณ์ ข้อเสนอแนะ หรือรายงานข้อบกพร่อง...",
    feedbackSubmit: "ส่งข้อเสนอแนะ",
    feedbackSuccess: "ส่งข้อเสนอแนะเรียบร้อยแล้ว!",
    feedbackHistory: "ประวัติข้อเสนอแนะ",
    backupTitle: "สำรองและส่งออก",
    backupDescription: "ส่งออกข้อมูลตู้เซฟทั้งหมดเป็นไฟล์ JSON สำหรับเก็บสำรอง",
    backupExport: "ส่งออกข้อมูลตู้เซฟ",
    backupSuccess: "ส่งออกข้อมูลสำรองเรียบร้อยแล้ว!",
    adminTitle: "แผงควบคุมผู้ดูแล",
    adminUsers: "ผู้ใช้ทั้งหมด",
    adminActiveUsers: "ผู้ใช้ที่ใช้งาน",
    adminRoles: "กำหนดบทบาท",
    adminFeedback: "ข้อเสนอแนะจากผู้ใช้",
    adminFeedbackEmpty: "ยังไม่มีข้อเสนอแนะ",
    adminFeedbackFrom: "จาก",
    adminUserManagement: "จัดการผู้ใช้",
    adminPrincipalId: "Principal ID",
    adminBlockUser: "บล็อก",
    adminUnblockUser: "ปลดบล็อก",
    adminDeleteUser: "ลบผู้ใช้",
    adminConfirmDelete: "ยืนยันการลบ",
    adminConfirmDeleteDesc:
      "การกระทำนี้จะลบผู้ใช้และข้อมูลทั้งหมดอย่างถาวร ไม่สามารถย้อนกลับได้",
    adminUserBlocked: "ถูกบล็อก",
    adminUserActive: "ใช้งานอยู่",
    adminPasswords: "รหัสผ่าน",
    adminNotes: "โน้ต",
    adminCopied: "คัดลอกแล้ว!",
    loading: "กำลังโหลด...",
    error: "เกิดข้อผิดพลาด",
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    confirm: "ยืนยัน",
    close: "ปิด",
    copy: "คัดลอก",
    search: "ค้นหา...",
    noData: "ไม่พบข้อมูล",
    csvImport: "นำเข้า CSV",
    csvImportTitle: "นำเข้ารหัสผ่านจาก CSV",
    csvImportDesc: "รองรับ Chrome, LastPass, Bitwarden และรูปแบบทั่วไป",
    csvImportDrop: "วางไฟล์ CSV ที่นี่หรือคลิกเพื่อเลือกไฟล์",
    csvImportPreview: "รายการที่พบ",
    csvImportDuplicates: "รายการซ้ำ",
    csvImportSkip: "ข้าม",
    csvImportOverwrite: "เขียนทับ",
    csvImportSkipAll: "ข้ามรายการซ้ำทั้งหมด",
    csvImportOverwriteAll: "เขียนทับรายการซ้ำทั้งหมด",
    csvImportStart: "นำเข้ารายการที่เลือก",
    csvImportSuccess: "นำเข้าเสร็จสมบูรณ์",
    csvImportNoFile: "ยังไม่ได้เลือกไฟล์",
    csvImportInvalid: "รูปแบบ CSV ไม่ถูกต้อง",
  },
  nl: {
    appName: "Dokmai IC",
    tagline:
      "Beveiligde Wachtwoordkluis & Identiteitsbeheer op Internet Computer",
    loginButton: "Inloggen",
    languageLabel: "Taal",
    loginWith: "Inloggen met Internet Identity",
    welcomeBack: "Welkom terug",
    navDashboard: "Dashboard",
    navPasswords: "Wachtwoorden",
    navVault: "Kluis",
    navIdentity: "Identiteit",
    navAdmin: "Beheer",
    navSecurity: "Beveiliging",
    navSettings: "Instellingen",
    navHelp: "Help",
    navFeedback: "Feedback",
    navBackup: "Back-up",
    dashWelcome: "Welkom terug",
    dashSecurityOverview: "Beveiligingsoverzicht",
    dashActiveSessions: "Actieve sessies",
    dashRecentActivity: "Recente activiteit",
    dashSecurityTips: "Beveiligingstips",
    dashQuickPasswords: "Opgeslagen wachtwoorden",
    dashQuickNotes: "Beveiligde notities",
    dashTotalPasswords: "Totaal wachtwoorden",
    dashTotalNotes: "Totaal notities",
    dashStrength: "Kluissterkte",
    pwdTitle: "Wachtwoordbeheer",
    pwdAdd: "Wachtwoord toevoegen",
    pwdEdit: "Bewerken",
    pwdDelete: "Verwijderen",
    pwdShow: "Tonen",
    pwdHide: "Verbergen",
    pwdGenerate: "Genereren",
    pwdCopy: "Kopiëren",
    pwdCopied: "Gekopieerd!",
    pwdStrength: "Sterkte",
    pwdWeak: "Zwak",
    pwdFair: "Matig",
    pwdGood: "Goed",
    pwdStrong: "Sterk",
    pwdLength: "Lengte",
    pwdUppercase: "Hoofdletters",
    pwdLowercase: "Kleine letters",
    pwdNumbers: "Cijfers",
    pwdSymbols: "Symbolen",
    pwdNoAmbiguous: "Vermijd dubbelzinnige tekens",
    pwdNoAmbiguousHint: "Uitgesloten: 0, O, I, l, 1, |",
    pwdSave: "Wachtwoord opslaan",
    pwdCancel: "Annuleren",
    pwdUsername: "Gebruikersnaam",
    pwdPassword: "Wachtwoord",
    pwdUrl: "Website URL",
    pwdNotes: "Notities",
    pwdEntryTitle: "Titel",
    vaultTitle: "Beveiligde kluis",
    vaultNotes: "Beveiligde notities",
    vaultFiles: "Bestanden",
    vaultAddNote: "Notitie toevoegen",
    vaultUploadFile: "Bestand uploaden",
    vaultNoteTitle: "Notitietitel",
    vaultNoteContent: "Notitie-inhoud",
    vaultDeleteNote: "Notitie verwijderen",
    vaultDeleteFile: "Bestand verwijderen",
    settingsTitle: "Instellingen",
    settingsAccountId: "ICP Account ID",
    settingsPrincipalId: "Principal ID",
    settingsManageII: "Internet Identity beheren",
    settingsLogout: "Uitloggen",
    settingsLanguage: "Taal",
    settingsSave: "Instellingen opslaan",
    settingsProfile: "Profiel",
    settingsName: "Weergavenaam",
    settingsLogoutConfirm: "Weet u zeker dat u wilt uitloggen?",
    feedbackTitle: "Feedback sturen",
    feedbackPlaceholder: "Deel uw ervaring, suggesties of meld een bug...",
    feedbackSubmit: "Feedback versturen",
    feedbackSuccess: "Feedback succesvol verzonden!",
    feedbackHistory: "Feedbackgeschiedenis",
    backupTitle: "Back-up en export",
    backupDescription:
      "Exporteer al uw kluisgegevens als een versleuteld JSON-bestand.",
    backupExport: "Kluisgegevens exporteren",
    backupSuccess: "Back-up succesvol geëxporteerd!",
    adminTitle: "Beheerdashboard",
    adminUsers: "Alle gebruikers",
    adminActiveUsers: "Actieve gebruikers",
    adminRoles: "Rollen toewijzen",
    adminFeedback: "Gebruikersfeedback",
    adminFeedbackEmpty: "Nog geen feedback ingediend",
    adminFeedbackFrom: "Van",
    adminUserManagement: "Gebruikersbeheer",
    adminPrincipalId: "Principal ID",
    adminBlockUser: "Blokkeren",
    adminUnblockUser: "Deblokkeren",
    adminDeleteUser: "Gebruiker verwijderen",
    adminConfirmDelete: "Verwijdering bevestigen",
    adminConfirmDeleteDesc:
      "Dit verwijdert de gebruiker en alle gegevens permanent. Deze actie kan niet ongedaan worden gemaakt.",
    adminUserBlocked: "Geblokkeerd",
    adminUserActive: "Actief",
    adminPasswords: "Wachtwoorden",
    adminNotes: "Notities",
    adminCopied: "Gekopieerd!",
    loading: "Laden...",
    error: "Er is een fout opgetreden",
    save: "Opslaan",
    cancel: "Annuleren",
    delete: "Verwijderen",
    confirm: "Bevestigen",
    close: "Sluiten",
    copy: "Kopiëren",
    search: "Zoeken...",
    noData: "Geen gegevens gevonden",
    csvImport: "CSV importeren",
    csvImportTitle: "Wachtwoorden importeren uit CSV",
    csvImportDesc:
      "Ondersteunt Chrome, LastPass, Bitwarden en generieke formaten",
    csvImportDrop: "Sleep CSV-bestand hierheen of klik om te bladeren",
    csvImportPreview: "gevonden items",
    csvImportDuplicates: "duplicaten",
    csvImportSkip: "Overslaan",
    csvImportOverwrite: "Overschrijven",
    csvImportSkipAll: "Alle duplicaten overslaan",
    csvImportOverwriteAll: "Alle duplicaten overschrijven",
    csvImportStart: "Geselecteerde importeren",
    csvImportSuccess: "Import voltooid",
    csvImportNoFile: "Geen bestand geselecteerd",
    csvImportInvalid: "Ongeldig CSV-formaat",
  },
  pl: {
    appName: "Dokmai IC",
    tagline:
      "Bezpieczny Sejf Haseł i Zarządzanie Tożsamością na Internet Computer",
    loginButton: "Zaloguj się",
    languageLabel: "Język",
    loginWith: "Zaloguj przez Internet Identity",
    welcomeBack: "Witaj ponownie",
    navDashboard: "Panel",
    navPasswords: "Hasła",
    navVault: "Sejf",
    navIdentity: "Tożsamość",
    navAdmin: "Admin",
    navSecurity: "Bezpieczeństwo",
    navSettings: "Ustawienia",
    navHelp: "Pomoc",
    navFeedback: "Opinie",
    navBackup: "Kopia zapasowa",
    dashWelcome: "Witaj ponownie",
    dashSecurityOverview: "Przegląd bezpieczeństwa",
    dashActiveSessions: "Aktywne sesje",
    dashRecentActivity: "Ostatnia aktywność",
    dashSecurityTips: "Wskazówki bezpieczeństwa",
    dashQuickPasswords: "Zapisane hasła",
    dashQuickNotes: "Bezpieczne notatki",
    dashTotalPasswords: "Łącznie haseł",
    dashTotalNotes: "Łącznie notatek",
    dashStrength: "Siła sejfu",
    pwdTitle: "Menedżer haseł",
    pwdAdd: "Dodaj hasło",
    pwdEdit: "Edytuj",
    pwdDelete: "Usuń",
    pwdShow: "Pokaż",
    pwdHide: "Ukryj",
    pwdGenerate: "Generuj",
    pwdCopy: "Kopiuj",
    pwdCopied: "Skopiowano!",
    pwdStrength: "Siła",
    pwdWeak: "Słabe",
    pwdFair: "Przeciętne",
    pwdGood: "Dobre",
    pwdStrong: "Silne",
    pwdLength: "Długość",
    pwdUppercase: "Wielkie litery",
    pwdLowercase: "Małe litery",
    pwdNumbers: "Cyfry",
    pwdSymbols: "Symbole",
    pwdNoAmbiguous: "Unikaj niejednoznacznych znaków",
    pwdNoAmbiguousHint: "Wykluczone: 0, O, I, l, 1, |",
    pwdSave: "Zapisz hasło",
    pwdCancel: "Anuluj",
    pwdUsername: "Nazwa użytkownika",
    pwdPassword: "Hasło",
    pwdUrl: "Adres URL",
    pwdNotes: "Notatki",
    pwdEntryTitle: "Tytuł",
    vaultTitle: "Bezpieczny sejf",
    vaultNotes: "Bezpieczne notatki",
    vaultFiles: "Pliki",
    vaultAddNote: "Dodaj notatkę",
    vaultUploadFile: "Prześlij plik",
    vaultNoteTitle: "Tytuł notatki",
    vaultNoteContent: "Treść notatki",
    vaultDeleteNote: "Usuń notatkę",
    vaultDeleteFile: "Usuń plik",
    settingsTitle: "Ustawienia",
    settingsAccountId: "ICP Account ID",
    settingsPrincipalId: "Principal ID",
    settingsManageII: "Zarządzaj Internet Identity",
    settingsLogout: "Wyloguj",
    settingsLanguage: "Język",
    settingsSave: "Zapisz ustawienia",
    settingsProfile: "Profil",
    settingsName: "Nazwa wyświetlana",
    settingsLogoutConfirm: "Czy na pewno chcesz się wylogować?",
    feedbackTitle: "Wyślij opinię",
    feedbackPlaceholder:
      "Podziel się swoim doświadczeniem, sugestiami lub zgłoś błąd...",
    feedbackSubmit: "Wyślij opinię",
    feedbackSuccess: "Opinia wysłana pomyślnie!",
    feedbackHistory: "Historia opinii",
    backupTitle: "Kopia zapasowa i eksport",
    backupDescription:
      "Eksportuj wszystkie dane sejfu jako zaszyfrowany plik JSON.",
    backupExport: "Eksportuj dane sejfu",
    backupSuccess: "Kopia zapasowa wyeksportowana pomyślnie!",
    adminTitle: "Panel administracyjny",
    adminUsers: "Wszyscy użytkownicy",
    adminActiveUsers: "Aktywni użytkownicy",
    adminRoles: "Przypisz role",
    adminFeedback: "Opinie użytkowników",
    adminFeedbackEmpty: "Brak przesłanych opinii",
    adminFeedbackFrom: "Od",
    adminUserManagement: "Zarządzanie użytkownikami",
    adminPrincipalId: "Principal ID",
    adminBlockUser: "Zablokuj",
    adminUnblockUser: "Odblokuj",
    adminDeleteUser: "Usuń użytkownika",
    adminConfirmDelete: "Potwierdź usunięcie",
    adminConfirmDeleteDesc:
      "Spowoduje to trwałe usunięcie użytkownika i wszystkich jego danych. Tej akcji nie można cofnąć.",
    adminUserBlocked: "Zablokowany",
    adminUserActive: "Aktywny",
    adminPasswords: "Hasła",
    adminNotes: "Notatki",
    adminCopied: "Skopiowano!",
    loading: "Ładowanie...",
    error: "Wystąpił błąd",
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    confirm: "Potwierdź",
    close: "Zamknij",
    copy: "Kopiuj",
    search: "Szukaj...",
    noData: "Nie znaleziono danych",
    csvImport: "Importuj CSV",
    csvImportTitle: "Importuj hasła z CSV",
    csvImportDesc: "Obsługuje Chrome, LastPass, Bitwarden i formaty ogólne",
    csvImportDrop: "Upuść plik CSV tutaj lub kliknij, aby przeglądać",
    csvImportPreview: "znalezionych wpisów",
    csvImportDuplicates: "duplikaty",
    csvImportSkip: "Pomiń",
    csvImportOverwrite: "Nadpisz",
    csvImportSkipAll: "Pomiń wszystkie duplikaty",
    csvImportOverwriteAll: "Nadpisz wszystkie duplikaty",
    csvImportStart: "Importuj wybrane",
    csvImportSuccess: "Import zakończony",
    csvImportNoFile: "Nie wybrano pliku",
    csvImportInvalid: "Nieprawidłowy format CSV",
  },
  zh: {
    appName: "Dokmai IC",
    tagline: "基于互联网计算机的安全密码保险库与身份管理系统",
    loginButton: "登录",
    languageLabel: "语言",
    loginWith: "使用互联网身份登录",
    welcomeBack: "欢迎回来",
    navDashboard: "仪表盘",
    navPasswords: "密码",
    navVault: "保险库",
    navIdentity: "身份",
    navAdmin: "管理员",
    navSecurity: "安全",
    navSettings: "设置",
    navHelp: "帮助",
    navFeedback: "反馈",
    navBackup: "备份",
    dashWelcome: "欢迎回来",
    dashSecurityOverview: "安全概览",
    dashActiveSessions: "活跃会话",
    dashRecentActivity: "最近活动",
    dashSecurityTips: "安全提示",
    dashQuickPasswords: "已存储密码",
    dashQuickNotes: "安全笔记",
    dashTotalPasswords: "密码总数",
    dashTotalNotes: "笔记总数",
    dashStrength: "保险库强度",
    pwdTitle: "密码管理器",
    pwdAdd: "添加密码",
    pwdEdit: "编辑",
    pwdDelete: "删除",
    pwdShow: "显示",
    pwdHide: "隐藏",
    pwdGenerate: "生成",
    pwdCopy: "复制",
    pwdCopied: "已复制!",
    pwdStrength: "强度",
    pwdWeak: "弱",
    pwdFair: "一般",
    pwdGood: "良好",
    pwdStrong: "强",
    pwdLength: "长度",
    pwdUppercase: "大写字母",
    pwdLowercase: "小写字母",
    pwdNumbers: "数字",
    pwdSymbols: "符号",
    pwdNoAmbiguous: "避免歧义字符",
    pwdNoAmbiguousHint: "排除: 0, O, I, l, 1, |",
    pwdSave: "保存密码",
    pwdCancel: "取消",
    pwdUsername: "用户名",
    pwdPassword: "密码",
    pwdUrl: "网站地址",
    pwdNotes: "备注",
    pwdEntryTitle: "标题",
    vaultTitle: "安全保险库",
    vaultNotes: "安全笔记",
    vaultFiles: "文件",
    vaultAddNote: "添加笔记",
    vaultUploadFile: "上传文件",
    vaultNoteTitle: "笔记标题",
    vaultNoteContent: "笔记内容",
    vaultDeleteNote: "删除笔记",
    vaultDeleteFile: "删除文件",
    settingsTitle: "设置",
    settingsAccountId: "ICP账户ID",
    settingsPrincipalId: "主体ID",
    settingsManageII: "管理互联网身份",
    settingsLogout: "退出登录",
    settingsLanguage: "语言",
    settingsSave: "保存设置",
    settingsProfile: "个人资料",
    settingsName: "显示名称",
    settingsLogoutConfirm: "您确定要退出登录吗?",
    feedbackTitle: "发送反馈",
    feedbackPlaceholder: "分享您的体验、建议或报告错误...",
    feedbackSubmit: "提交反馈",
    feedbackSuccess: "反馈提交成功!",
    feedbackHistory: "反馈历史",
    backupTitle: "备份与导出",
    backupDescription: "将所有保险库数据导出为加密的JSON文件以供保管。",
    backupExport: "导出保险库数据",
    backupSuccess: "备份导出成功!",
    adminTitle: "管理员控制台",
    adminUsers: "所有用户",
    adminActiveUsers: "活跃用户",
    adminRoles: "分配角色",
    adminFeedback: "用户反馈",
    adminFeedbackEmpty: "暂无反馈",
    adminFeedbackFrom: "来自",
    adminUserManagement: "用户管理",
    adminPrincipalId: "Principal ID",
    adminBlockUser: "封禁",
    adminUnblockUser: "解封",
    adminDeleteUser: "删除用户",
    adminConfirmDelete: "确认删除",
    adminConfirmDeleteDesc: "此操作将永久删除该用户及其所有数据，无法撤销。",
    adminUserBlocked: "已封禁",
    adminUserActive: "活跃",
    adminPasswords: "密码",
    adminNotes: "笔记",
    adminCopied: "已复制!",
    loading: "加载中...",
    error: "发生错误",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    confirm: "确认",
    close: "关闭",
    copy: "复制",
    search: "搜索...",
    noData: "未找到数据",
    csvImport: "导入CSV",
    csvImportTitle: "从CSV导入密码",
    csvImportDesc: "支持Chrome、LastPass、Bitwarden和通用格式",
    csvImportDrop: "将CSV文件拖放到此处或点击浏览",
    csvImportPreview: "条记录",
    csvImportDuplicates: "重复项",
    csvImportSkip: "跳过",
    csvImportOverwrite: "覆盖",
    csvImportSkipAll: "跳过所有重复项",
    csvImportOverwriteAll: "覆盖所有重复项",
    csvImportStart: "导入所选",
    csvImportSuccess: "导入完成",
    csvImportNoFile: "未选择文件",
    csvImportInvalid: "无效的CSV格式",
  },
};

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem("dokmai-lang");
    return (stored as LangCode) || "en";
  });

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem("dokmai-lang", newLang);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: translations[lang],
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

export const LANGUAGE_OPTIONS: {
  code: LangCode;
  label: string;
  flag: string;
}[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "th", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];
