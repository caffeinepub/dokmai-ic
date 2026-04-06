import AccessControl "./access-control";
import Prim "mo:prim";
import Principal "mo:core/Principal";

mixin (accessControlState : AccessControl.AccessControlState) {
  // Hardcoded admin principal — always seeded at startup
  let HARDCODED_ADMIN : Principal = Principal.fromText("das6p-4z7ap-pfikd-uyqal-be35z-ijkl6-gqwz6-npfvx-7sf5b-ekchz-vqe");

  // Seed the hardcoded admin into the role map on first access
  private func ensureAdminSeeded() {
    switch (accessControlState.userRoles.get(HARDCODED_ADMIN)) {
      case (null) {
        accessControlState.userRoles.add(HARDCODED_ADMIN, #admin);
        accessControlState.adminAssigned := true;
      };
      case (?_) {};
    };
  };

  // Initialize auth — registers caller as user (or admin if token matches).
  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    ensureAdminSeeded();
    if (caller.isAnonymous()) { return };
    if (caller == HARDCODED_ADMIN) { return };
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) { return };
      case (null) {
        switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
          case (?adminToken) {
            if (not accessControlState.adminAssigned and userSecret == adminToken) {
              accessControlState.userRoles.add(caller, #admin);
              accessControlState.adminAssigned := true;
            } else {
              accessControlState.userRoles.add(caller, #user);
            };
          };
          case (null) {
            accessControlState.userRoles.add(caller, #user);
          };
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    ensureAdminSeeded();
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    ensureAdminSeeded();
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    ensureAdminSeeded();
    AccessControl.isAdmin(accessControlState, caller);
  };
};
