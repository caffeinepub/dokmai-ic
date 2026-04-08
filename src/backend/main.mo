import Text "mo:core/Text";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  type Username = Text;
  type Language = { #en; #th; #nl; #pl; #zh };
  type StrongPassword = Text;
  type FeedbackStatus = { #unread; #read; #resolved };

  type CustomField = {
    name : Text;
    value : Text;
    fieldType : Text; // "text", "password", "url"
  };

  // Legacy PasswordEntry type (stable store — original schema, no new fields)
  type PasswordEntryLegacy = {
    title : Text;
    username : Username;
    password : StrongPassword;
    url : Text;
    notes : Text;
    blob : ?Storage.ExternalBlob;
  };

  // Current PasswordEntry type (in-memory, with new fields)
  type PasswordEntry = {
    title : Text;
    username : Username;
    password : StrongPassword;
    url : Text;
    notes : Text;
    email : Text;
    category : Text;
    totp : Text;
    customFields : [CustomField];
    blob : ?Storage.ExternalBlob;
  };

  module PasswordEntry {
    public func compare(entry1 : PasswordEntry, entry2 : PasswordEntry) : Order.Order {
      switch (Text.compare(entry1.title, entry2.title)) {
        case (#equal) { Text.compare(entry1.username, entry2.username) };
        case (order) { order };
      };
    };
  };

  type SecureNote = {
    title : Text;
    content : Text;
    blob : ?Storage.ExternalBlob;
  };

  module SecureNote {
    public func compare(note1 : SecureNote, note2 : SecureNote) : Order.Order {
      Text.compare(note1.title, note2.title);
    };
  };

  type UserProfile = {
    name : Text;
    language : Language;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.name, profile2.name);
    };
  };

  // Legacy vault type (stable — uses legacy PasswordEntry without new fields)
  type PasswordVaultLegacy = {
    entries : [PasswordEntryLegacy];
    notes : [SecureNote];
    profile : UserProfile;
  };

  // Current vault type (in-memory, with new PasswordEntry)
  type PasswordVault = {
    entries : [PasswordEntry];
    notes : [SecureNote];
    profile : UserProfile;
  };

  // Legacy Feedback type (without id/status) — kept for stable var compatibility
  type FeedbackLegacy = {
    message : Text;
    timestamp : Int;
  };

  // V2 Feedback type (with id/status but no reply) — kept for stable var compatibility
  type FeedbackV2 = {
    id : Nat;
    message : Text;
    timestamp : Int;
    status : FeedbackStatus;
  };

  // V3 Feedback type with reply support — used in feedbackEntriesV3
  type Feedback = {
    id : Nat;
    message : Text;
    timestamp : Int;
    status : FeedbackStatus;
    adminReply : ?Text;
    adminReplyTimestamp : ?Int;
  };

  type FeedbackWithPrincipal = {
    principal : Principal;
    id : Nat;
    message : Text;
    timestamp : Int;
    status : FeedbackStatus;
    adminReply : ?Text;
    adminReplyTimestamp : ?Int;
  };

  // Feedback for user queries (no principal needed)
  type FeedbackForUser = {
    id : Nat;
    message : Text;
    timestamp : Int;
    status : FeedbackStatus;
    adminReply : ?Text;
    adminReplyTimestamp : ?Int;
  };

  type UserWithPrincipal = {
    principal : Principal;
    name : Text;
    language : Language;
    isBlocked : Bool;
    passwordCount : Nat;
    noteCount : Nat;
  };

  type UserStats = {
    passwordCount : Nat;
    noteCount : Nat;
  };

  type SystemStats = {
    totalUsers : Nat;
    blockedUsers : Nat;
    totalPasswords : Nat;
    totalNotes : Nat;
    totalFeedback : Nat;
    unreadFeedback : Nat;
  };

  type LoginActivity = {
    principal : Principal;
    lastLoginTimestamp : Int;
    loginCount : Nat;
  };

  module LoginActivity {
    public func compare(a : LoginActivity, b : LoginActivity) : Order.Order {
      Int.compare(b.lastLoginTimestamp, a.lastLoginTimestamp);
    };
  };


  type PasswordHistoryEntry = {
    password : Text;
    changedAt : Int;
  };

  module Feedback {
    public func compare(feedback1 : Feedback, feedback2 : Feedback) : Order.Order {
      Int.compare(feedback1.timestamp, feedback2.timestamp);
    };
  };

  module FeedbackWithPrincipal {
    public func compare(f1 : FeedbackWithPrincipal, f2 : FeedbackWithPrincipal) : Order.Order {
      Int.compare(f2.timestamp, f1.timestamp);
    };
  };

  module _Principal {
    public func compare(principal1 : Principal, principal2 : Principal) : Order.Order {
      principal1.toBlob().compare(principal2.toBlob());
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();
  let userIdSet = Set.empty<Principal>();

  // Stable store uses legacy type (original schema) to preserve compatibility
  let passwordVaults = Map.empty<Principal, PasswordVaultLegacy>();

  // In-memory store uses new type (with extended fields)
  let passwordVaultsV2 = Map.empty<Principal, PasswordVault>();
  var passwordVaultsMigrated : Bool = false;

  // feedbackEntries uses the legacy type to preserve stable compatibility
  let feedbackEntries = Map.empty<Principal, [FeedbackLegacy]>();
  let blockedUsers = Set.empty<Principal>();
  let loginActivityLog = Map.empty<Principal, LoginActivity>();
  // Password history: composite key "principalText|title" -> list of old passwords (max 10)
  let passwordHistory = Map.empty<Text, [PasswordHistoryEntry]>();

  var feedbackIdCounter : Nat = 0;

  // V2 stable store — kept with original type to avoid compatibility errors
  var systemAnnouncement : ?Text = null;
  var maintenanceMode : Bool = false;
  let feedbackEntriesV2 = Map.empty<Principal, [FeedbackV2]>();
  var feedbackMigrated : Bool = false;

  // V3 in-memory store with reply support (non-stable, rebuilt on each upgrade from v2)
  let feedbackEntriesV3 = Map.empty<Principal, [Feedback]>();
  var feedbackV3Ready : Bool = false;

  // Migrate legacy passwordVaults -> passwordVaultsV2 (adds default values for new fields)
  func migratePasswordVaults() {
    if (passwordVaultsMigrated) return;
    for ((principal, legacyVault) in passwordVaults.entries()) {
      let migratedEntries = legacyVault.entries.map(func(e : PasswordEntryLegacy) : PasswordEntry {
        {
          title = e.title;
          username = e.username;
          password = e.password;
          url = e.url;
          notes = e.notes;
          email = "";
          category = "";
          totp = "";
          customFields = [];
          blob = e.blob;
        }
      });
      passwordVaultsV2.add(principal, {
        entries = migratedEntries;
        notes = legacyVault.notes;
        profile = legacyVault.profile;
      });
    };
    passwordVaultsMigrated := true;
  };

  func ensurePasswordVaults() {
    if (not passwordVaultsMigrated) { migratePasswordVaults() };
  };

  // Migrate legacy -> v2 (runs once)
  func migrateFeedback() {
    if (feedbackMigrated) return;
    for ((principal, legacyFeedbacks) in feedbackEntries.entries()) {
      let upgraded = legacyFeedbacks.map(func(fb : FeedbackLegacy) : FeedbackV2 {
        feedbackIdCounter += 1;
        { id = feedbackIdCounter; message = fb.message; timestamp = fb.timestamp; status = #read }
      });
      feedbackEntriesV2.add(principal, upgraded);
    };
    feedbackMigrated := true;
  };

  // Migrate v2 -> v3 (adds reply fields, runs once per session)
  func migrateToV3() {
    if (feedbackV3Ready) return;
    migrateFeedback();
    for ((principal, v2Feedbacks) in feedbackEntriesV2.entries()) {
      let v3 = v2Feedbacks.map(func(fb : FeedbackV2) : Feedback {
        { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status; adminReply = null; adminReplyTimestamp = null }
      });
      feedbackEntriesV3.add(principal, v3);
    };
    feedbackV3Ready := true;
  };

  func ensureV3() {
    if (not feedbackV3Ready) { migrateToV3() };
  };

  // Sync v3 back to v2 (for stable persistence — stores without reply fields)
  func _syncV3ToV2() {
    for ((principal, v3Feedbacks) in feedbackEntriesV3.entries()) {
      let v2 = v3Feedbacks.map(func(fb : Feedback) : FeedbackV2 {
        { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status }
      });
      feedbackEntriesV2.add(principal, v2);
    };
  };

  func getPasswordEntryOrTrap(id : Principal, title : Text) : PasswordEntry {
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(id)) {
      case (?vault) {
        switch (vault.entries.find(func(entry) { entry.title == title })) {
          case (?entry) { entry };
          case (null) { Runtime.trap("Password entry for title " # title # " does not exist."); };
        };
      };
      case (null) { Runtime.trap("Password vault not found"); };
    };
  };

  func getSecureNoteOrTrap(id : Principal, title : Text) : SecureNote {
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(id)) {
      case (?vault) {
        switch (vault.notes.find(func(note) { note.title == title })) {
          case (?note) { note };
          case (null) { Runtime.trap("Secure note for title " # title # " does not exist."); };
        };
      };
      case (null) { Runtime.trap("Password vault not found"); };
    };
  };

  public shared ({ caller }) func addPasswordEntryToVault(
    title : Text,
    username : Username,
    password : StrongPassword,
    url : Text,
    notes : Text,
    email : Text,
    category : Text,
    totp : Text,
    customFields : [CustomField],
    blob : ?Storage.ExternalBlob
  ) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Only users can add password entries") };
    // Auto-register user if not yet known
    AccessControl.ensureRegistered(accessControlState, caller);
    userIdSet.add(caller);
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        if (vault.entries.find(func(entry) { entry.title == title }) != null) {
          Runtime.trap("Password entry for title " # title # " already exists.");
        };
        let newEntry = { title; username; password; url; notes; email; category; totp; customFields; blob };
        passwordVaultsV2.add(caller, {
          entries = vault.entries.concat([newEntry]);
          notes = vault.notes;
          profile = vault.profile;
        });
      };
      case (null) {
        userIdSet.add(caller);
        let newEntry = { title; username; password; url; notes; email; category; totp; customFields; blob };
        let newVault = {
          entries = [newEntry];
          notes = [];
          profile = { name = "New User"; language = #en };
        };
        passwordVaultsV2.add(caller, newVault);
      };
    };
  };

  public query ({ caller }) func getPasswordEntryFromVault(title : Text) : async PasswordEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve password entries");
    };
    getPasswordEntryOrTrap(caller, title);
  };

  public query ({ caller }) func getAllPasswordEntriesFromVault() : async [PasswordEntry] {
    if (caller.isAnonymous()) { return [] };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) { vault.entries };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func deletePasswordEntryFromVault(title : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete password entries");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        let currEntries = vault.entries;
        let filteredEntries = currEntries.filter(func(entry) { entry.title != title });
        if (currEntries.size() == filteredEntries.size()) {
          Runtime.trap("Password entry for title " # title # " does not exist.");
        };
        passwordVaultsV2.add(caller, { entries = filteredEntries; notes = vault.notes; profile = vault.profile });
        // Clean up history for deleted entry
        passwordHistory.remove(historyKey(caller, title));
      };
      case (null) {
        Runtime.trap("Password entry for title " # title # " does not exist.");
      };
    };
  };

  // Helper: record old password in history (keeps max 10)
  func historyKey(caller : Principal, title : Text) : Text {
    caller.toText() # "|" # title
  };

  func recordPasswordHistory(caller : Principal, title : Text, oldPassword : Text, timestamp : Int) {
    let entry : PasswordHistoryEntry = { password = oldPassword; changedAt = timestamp };
    let key = historyKey(caller, title);
    let existing : [PasswordHistoryEntry] = switch (passwordHistory.get(key)) {
      case (?arr) { arr };
      case (null) { [] };
    };
    // Prepend and keep max 10
    let updated = [entry].concat(existing);
    let trimmed = if (updated.size() > 10) {
      updated.vals().take(10).toArray()
    } else { updated };
    passwordHistory.add(key, trimmed);
  };

  // Update an existing password entry (records old password in history)
  public shared ({ caller }) func updatePasswordEntryInVault(
    title : Text,
    username : Username,
    password : StrongPassword,
    url : Text,
    notes : Text,
    email : Text,
    category : Text,
    totp : Text,
    customFields : [CustomField],
    blob : ?Storage.ExternalBlob,
    timestamp : Int
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update password entries");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        switch (vault.entries.find(func(e : PasswordEntry) : Bool { e.title == title })) {
          case (?oldEntry) {
            // Record old password in history before overwriting
            if (oldEntry.password != password) {
              recordPasswordHistory(caller, title, oldEntry.password, timestamp);
            };
            let updated = vault.entries.map(func(e : PasswordEntry) : PasswordEntry {
              if (e.title == title) { { title; username; password; url; notes; email; category; totp; customFields; blob } }
              else { e }
            });
            passwordVaultsV2.add(caller, { entries = updated; notes = vault.notes; profile = vault.profile });
          };
          case (null) { Runtime.trap("Password entry for title " # title # " does not exist.") };
        };
      };
      case (null) { Runtime.trap("Password vault not found") };
    };
  };

  // User: get password history for a specific entry (most recent first)
  public query ({ caller }) func getPasswordHistory(title : Text) : async [PasswordHistoryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their password history");
    };
    let key = historyKey(caller, title);
    switch (passwordHistory.get(key)) {
      case (?entries) { entries };
      case (null) { [] };
    };
  };

  // User: clear password history for a specific entry
  public shared ({ caller }) func clearPasswordHistory(title : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their password history");
    };
    passwordHistory.remove(historyKey(caller, title));
  };

  public shared ({ caller }) func addSecureNoteToVault(title : Text, content : Text, blob : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add secure notes");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        if (vault.notes.find(func(note) { note.title == title }) != null) { Runtime.trap("Secure note for title " # title # " already exists.") };
        let newNote = { title; content; blob };
        passwordVaultsV2.add(caller, { entries = vault.entries; notes = vault.notes.concat([newNote]); profile = vault.profile });
      };
      case (null) {
        userIdSet.add(caller);
        let newNote = { title; content; blob };
        let newVault = { entries = []; notes = [newNote]; profile = { name = "New User"; language = #en } };
        passwordVaultsV2.add(caller, newVault);
      };
    };
  };

  public query ({ caller }) func getSecureNoteFromVault(title : Text) : async SecureNote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve secure notes");
    };
    getSecureNoteOrTrap(caller, title);
  };

  public query ({ caller }) func getAllSecureNotesFromVault() : async [SecureNote] {
    if (caller.isAnonymous()) { return [] };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) { vault.notes.sort() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func deleteSecureNoteFromVault(title : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete secure notes");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        let currNotes = vault.notes;
        let filteredNotes = currNotes.filter(func(note) { note.title != title });
        if (currNotes.size() == filteredNotes.size()) {
          Runtime.trap("Secure note for title " # title # " does not exist.");
        };
        passwordVaultsV2.add(caller, { entries = vault.entries; notes = filteredNotes; profile = vault.profile });
      };
      case (null) {
        Runtime.trap("Secure note for title " # title # " does not exist.");
      };
    };
  };

  public shared ({ caller }) func submitFeedbackEntry(message : Text, timestamp : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit feedback");
    };
    ensureV3();
    feedbackIdCounter += 1;
    let newFeedback : Feedback = { id = feedbackIdCounter; message; timestamp; status = #unread; adminReply = null; adminReplyTimestamp = null };
    let newV2 : FeedbackV2 = { id = feedbackIdCounter; message; timestamp; status = #unread };
    // Legacy copy
    let legacyCopy = { message; timestamp };
    switch (feedbackEntries.get(caller)) {
      case (?existing) { feedbackEntries.add(caller, existing.concat([legacyCopy])) };
      case (null) { feedbackEntries.add(caller, [legacyCopy]) };
    };
    // V2 stable store
    switch (feedbackEntriesV2.get(caller)) {
      case (?existing) { feedbackEntriesV2.add(caller, existing.concat([newV2])) };
      case (null) { feedbackEntriesV2.add(caller, [newV2]) };
    };
    // V3 in-memory store
    switch (feedbackEntriesV3.get(caller)) {
      case (?existing) { feedbackEntriesV3.add(caller, existing.concat([newFeedback])) };
      case (null) { feedbackEntriesV3.add(caller, [newFeedback]) };
    };
  };

  public query ({ caller }) func getAllFeedbackEntriesForPrincipal(id : Principal) : async [FeedbackLegacy] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view feedback entries");
    };
    switch (feedbackEntries.get(id)) {
      case (?existingFeedback) { existingFeedback };
      case (null) { [] };
    };
  };

  // Admin: get all feedback from all users, sorted newest first
  public shared ({ caller }) func getAllFeedbackEntries() : async [FeedbackWithPrincipal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all feedback entries");
    };
    ensureV3();
    var result : [FeedbackWithPrincipal] = [];
    for ((principal, feedbacks) in feedbackEntriesV3.entries()) {
      for (fb in feedbacks.vals()) {
        result := result.concat([{ principal; id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status; adminReply = fb.adminReply; adminReplyTimestamp = fb.adminReplyTimestamp }]);
      };
    };
    result.sort();
  };

  // User: get own feedback with admin replies
  public shared ({ caller }) func getUserFeedbackWithReplies() : async [FeedbackForUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their feedback");
    };
    ensureV3();
    switch (feedbackEntriesV3.get(caller)) {
      case (?feedbacks) {
        feedbacks.map(func(fb : Feedback) : FeedbackForUser {
          { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status; adminReply = fb.adminReply; adminReplyTimestamp = fb.adminReplyTimestamp }
        })
      };
      case (null) { [] };
    };
  };

  // Admin: reply to a feedback entry
  public shared ({ caller }) func adminReplyFeedback(user : Principal, feedbackId : Nat, reply : Text, replyTimestamp : Int) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reply to feedback");
    };
    ensureV3();
    switch (feedbackEntriesV3.get(user)) {
      case (?feedbacks) {
        let updated = feedbacks.map(func(fb : Feedback) : Feedback {
          if (fb.id == feedbackId) { { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = #resolved; adminReply = ?reply; adminReplyTimestamp = ?replyTimestamp } }
          else { fb }
        });
        feedbackEntriesV3.add(user, updated);
        // Sync back to v2 for stable persistence
        let v2Updated = updated.map(func(fb : Feedback) : FeedbackV2 {
          { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status }
        });
        feedbackEntriesV2.add(user, v2Updated);
      };
      case (null) { Runtime.trap("No feedback found for this user") };
    };
  };

  // Admin: mark a feedback entry as read
  public shared ({ caller }) func markFeedbackAsRead(user : Principal, feedbackId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark feedback as read");
    };
    ensureV3();
    switch (feedbackEntriesV3.get(user)) {
      case (?feedbacks) {
        let updated = feedbacks.map(func(fb : Feedback) : Feedback {
          if (fb.id == feedbackId) { { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = #read; adminReply = fb.adminReply; adminReplyTimestamp = fb.adminReplyTimestamp } }
          else { fb }
        });
        feedbackEntriesV3.add(user, updated);
        let v2Updated = updated.map(func(fb : Feedback) : FeedbackV2 {
          { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status }
        });
        feedbackEntriesV2.add(user, v2Updated);
      };
      case (null) { Runtime.trap("No feedback found for this user") };
    };
  };

  // Admin: mark a feedback entry as resolved
  public shared ({ caller }) func markFeedbackAsResolved(user : Principal, feedbackId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark feedback as resolved");
    };
    ensureV3();
    switch (feedbackEntriesV3.get(user)) {
      case (?feedbacks) {
        let updated = feedbacks.map(func(fb : Feedback) : Feedback {
          if (fb.id == feedbackId) { { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = #resolved; adminReply = fb.adminReply; adminReplyTimestamp = fb.adminReplyTimestamp } }
          else { fb }
        });
        feedbackEntriesV3.add(user, updated);
        let v2Updated = updated.map(func(fb : Feedback) : FeedbackV2 {
          { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status }
        });
        feedbackEntriesV2.add(user, v2Updated);
      };
      case (null) { Runtime.trap("No feedback found for this user") };
    };
  };

  // Admin: delete a specific feedback entry
  public shared ({ caller }) func adminDeleteFeedback(user : Principal, feedbackId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete feedback");
    };
    ensureV3();
    switch (feedbackEntriesV3.get(user)) {
      case (?feedbacks) {
        let filtered = feedbacks.filter(func(fb : Feedback) : Bool { fb.id != feedbackId });
        feedbackEntriesV3.add(user, filtered);
        let v2Filtered = filtered.map(func(fb : Feedback) : FeedbackV2 {
          { id = fb.id; message = fb.message; timestamp = fb.timestamp; status = fb.status }
        });
        feedbackEntriesV2.add(user, v2Filtered);
      };
      case (null) { Runtime.trap("No feedback found for this user") };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) { vault.profile };
      case (null) { { name = "New User"; language = #en } };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(user)) {
      case (?vault) { vault.profile };
      case (null) { { name = "New User"; language = #en } };
    };
  };

  public query ({ caller }) func getUserProfileFromVault() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) { vault.profile };
      case (null) { { name = "New User"; language = #en } };
    };
  };

  public query ({ caller }) func listAllUserProfiles() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can list all user profiles.")
    };
    ensurePasswordVaults();
    let allProfiles = passwordVaultsV2.values().map(func(vault) { vault.profile }).toArray().sort();
    allProfiles;
  };

  // Admin: list all users with principal IDs, stats, and blocked status
  public query ({ caller }) func listAllUsersWithPrincipals() : async [UserWithPrincipal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can list users with principals.");
    };
    ensurePasswordVaults();
    var result : [UserWithPrincipal] = [];
    for (principal in userIdSet.values()) {
      let (name, language, passwordCount, noteCount) = switch (passwordVaultsV2.get(principal)) {
        case (?vault) { (vault.profile.name, vault.profile.language, vault.entries.size(), vault.notes.size()) };
        case (null) { ("New User", #en, 0, 0) };
      };
      let isBlocked = blockedUsers.contains(principal);
      result := result.concat([{ principal; name; language; isBlocked; passwordCount; noteCount }]);
    };
    result;
  };

  // Admin: block a user
  public shared ({ caller }) func blockUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can block users");
    };
    blockedUsers.add(user);
    AccessControl.assignRole(accessControlState, caller, user, #guest);
  };

  // Admin: unblock a user
  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unblock users");
    };
    blockedUsers.remove(user);
    AccessControl.assignRole(accessControlState, caller, user, #user);
  };

  // Admin: delete a user and all their data
  public shared ({ caller }) func adminDeleteUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    passwordVaults.remove(user);
    passwordVaultsV2.remove(user);
    userIdSet.remove(user);
    feedbackEntries.remove(user);
    feedbackEntriesV2.remove(user);
    feedbackEntriesV3.remove(user);
    blockedUsers.remove(user);
  };

  // Admin: get stats for a specific user
  public query ({ caller }) func getUserStats(user : Principal) : async UserStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user stats");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(user)) {
      case (?vault) { { passwordCount = vault.entries.size(); noteCount = vault.notes.size() } };
      case (null) { { passwordCount = 0; noteCount = 0 } };
    };
  };

  // Admin: check if a user is blocked
  public query ({ caller }) func isUserBlocked(user : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check block status");
    };
    blockedUsers.contains(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        passwordVaultsV2.add(caller, { entries = vault.entries; notes = vault.notes; profile = profile });
      };
      case (null) {
        userIdSet.add(caller);
        passwordVaultsV2.add(caller, { entries = []; notes = []; profile = profile });
      };
    };
  };

  public shared ({ caller }) func updateUserProfileInVault(name : Text, language : Language) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    let updatedProfile = { name; language };
    ensurePasswordVaults();
    switch (passwordVaultsV2.get(caller)) {
      case (?vault) {
        passwordVaultsV2.add(caller, { entries = vault.entries; notes = vault.notes; profile = updatedProfile });
      };
      case (null) {
        userIdSet.add(caller);
        passwordVaultsV2.add(caller, { entries = []; notes = []; profile = updatedProfile });
      };
    };
    updatedProfile;
  };

  public query ({ caller }) func getActiveUserCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user statistics");
    };
    userIdSet.size();
  };

  // Admin: get system-wide stats
  public query ({ caller }) func getSystemStats() : async SystemStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view system stats");
    };
    ensurePasswordVaults();
    var totalPasswords : Nat = 0;
    var totalNotes : Nat = 0;
    for ((_, vault) in passwordVaultsV2.entries()) {
      totalPasswords += vault.entries.size();
      totalNotes += vault.notes.size();
    };
    var totalFeedback : Nat = 0;
    var unreadFeedback : Nat = 0;
    for ((_, feedbacks) in feedbackEntriesV3.entries()) {
      for (fb in feedbacks.vals()) {
        totalFeedback += 1;
        if ("unread" == (switch (fb.status) { case (#unread) "unread"; case (_) "other" })) {
          unreadFeedback += 1;
        };
      };
    };
    {
      totalUsers = userIdSet.size();
      blockedUsers = blockedUsers.size();
      totalPasswords;
      totalNotes;
      totalFeedback;
      unreadFeedback;
    };
  };

  // User: record login activity (called on login) — auto-registers user on first call
  public shared ({ caller }) func recordLoginActivity(timestamp : Int) : async () {
    if (caller.isAnonymous()) { return };
    // Auto-register user if not yet known
    AccessControl.ensureRegistered(accessControlState, caller);
    userIdSet.add(caller);
    switch (loginActivityLog.get(caller)) {
      case (?existing) {
        loginActivityLog.add(caller, { principal = caller; lastLoginTimestamp = timestamp; loginCount = existing.loginCount + 1 });
      };
      case (null) {
        loginActivityLog.add(caller, { principal = caller; lastLoginTimestamp = timestamp; loginCount = 1 });
      };
    };
  };

  // Admin: get login activity log sorted by most recent first
  public query ({ caller }) func getLoginActivityLog() : async [LoginActivity] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view login activity");
    };
    loginActivityLog.values().toArray().sort();
  };

  // Admin: set or clear system announcement
  public shared ({ caller }) func setSystemAnnouncement(text : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set system announcements");
    };
    systemAnnouncement := text;
  };

  // All authenticated users: get the current system announcement
  public query ({ caller }) func getSystemAnnouncement() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    systemAnnouncement;
  };

  // Admin: enable or disable maintenance mode
  public shared ({ caller }) func setMaintenanceMode(enabled : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set maintenance mode");
    };
    maintenanceMode := enabled;
  };

  // Public: get maintenance mode status (no auth required)
  public query func getMaintenanceMode() : async Bool {
    maintenanceMode;
  };

};
