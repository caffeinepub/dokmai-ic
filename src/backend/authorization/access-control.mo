import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

module {
  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  // Hardcoded admin principal ID
  let HARDCODED_ADMIN : Text = "das6p-4z7ap-pfikd-uyqal-be35z-ijkl6-gqwz6-npfvx-7sf5b-ekchz-vqe";

  public func initState() : AccessControlState {
    let state = {
      var adminAssigned = true;
      userRoles = Map.empty<Principal, UserRole>();
    };
    // Seed hardcoded admin
    let adminPrincipal = Principal.fromText(HARDCODED_ADMIN);
    state.userRoles.add(adminPrincipal, #admin);
    state;
  };

  // First principal that calls this function becomes admin, all other principals become users.
  public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
    if (caller.isAnonymous()) { return };
    // Always ensure hardcoded admin is set
    let adminPrincipal = Principal.fromText(HARDCODED_ADMIN);
    switch (state.userRoles.get(adminPrincipal)) {
      case (null) { state.userRoles.add(adminPrincipal, #admin); state.adminAssigned := true; };
      case (?_) {};
    };
    switch (state.userRoles.get(caller)) {
      case (?_) {};
      case (null) {
        if (not state.adminAssigned and userProvidedToken == adminToken) {
          state.userRoles.add(caller, #admin);
          state.adminAssigned := true;
        } else {
          state.userRoles.add(caller, #user);
        };
      };
    };
  };

  public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
    if (caller.isAnonymous()) { return #guest };
    // Always treat hardcoded admin as admin
    if (Principal.fromText(HARDCODED_ADMIN) == caller) { return #admin };
    switch (state.userRoles.get(caller)) {
      case (?role) { role };
      case (null) {
        // Return guest instead of trapping so isAdmin returns false gracefully
        #guest;
      };
    };
  };

  public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
    if (not (isAdmin(state, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign user roles");
    };
    state.userRoles.add(user, role);
  };

  public func hasPermission(state : AccessControlState, caller : Principal, requiredRole : UserRole) : Bool {
    let userRole = getUserRole(state, caller);
    if (userRole == #admin or requiredRole == #guest) { true } else {
      userRole == requiredRole;
    };
  };

  public func isAdmin(state : AccessControlState, caller : Principal) : Bool {
    getUserRole(state, caller) == #admin;
  };
};
