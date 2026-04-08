import Map "mo:core/Map";
import Principal "mo:core/Principal";

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

  // Register a caller as a user if not already known (auto-register on login)
  public func ensureRegistered(state : AccessControlState, caller : Principal) {
    if (caller.isAnonymous()) { return };
    switch (state.userRoles.get(caller)) {
      case (?_) {}; // already registered
      case (null) {
        state.userRoles.add(caller, #user);
      };
    };
  };

  public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
    if (caller.isAnonymous()) { return #guest };
    switch (state.userRoles.get(caller)) {
      case (?role) { role };
      case (null) { #guest }; // Return guest instead of trapping — unregistered users are guests
    };
  };

  public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
    if (not (isAdmin(state, caller))) {
      return; // Only admins can assign roles
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
