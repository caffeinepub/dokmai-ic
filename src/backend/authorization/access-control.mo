import Map "mo:core/Map";
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

  public func initState() : AccessControlState {
    {
      var adminAssigned = false;
      userRoles = Map.empty<Principal, UserRole>();
    };
  };

  // Hardcoded admin principal
  let HARDCODED_ADMIN : Text = "das6p-4z7ap-pfikd-uyqal-be35z-ijkl6-gqwz6-npfvx-7sf5b-ekchz-vqe";

  public func isHardcodedAdmin(caller : Principal) : Bool {
    caller.toText() == HARDCODED_ADMIN;
  };

  // Register hardcoded admin without token check
  public func initializeAdmin(state : AccessControlState, caller : Principal) {
    if (caller.isAnonymous()) { return };
    state.userRoles.add(caller, #admin);
    state.adminAssigned := true;
  };

  // First principal that calls this function with correct token becomes admin.
  public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
    if (caller.isAnonymous()) { return };
    // Hardcoded admin: always assign admin role
    if (isHardcodedAdmin(caller)) {
      state.userRoles.add(caller, #admin);
      state.adminAssigned := true;
      return;
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
    // Hardcoded admin always returns admin role
    if (isHardcodedAdmin(caller)) { return #admin };
    switch (state.userRoles.get(caller)) {
      case (?role) { role };
      case (null) {
        Runtime.trap("User is not registered");
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
    // Hardcoded admin always returns true
    if (isHardcodedAdmin(caller)) { return true };
    getUserRole(state, caller) == #admin;
  };
};
