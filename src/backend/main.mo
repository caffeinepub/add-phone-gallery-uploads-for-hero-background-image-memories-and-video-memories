import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Management
  public type UserProfile = {
    name : Text;
    // other metadata if needed
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Media Management
  type FileType = {
    #image;
    #video;
    #audio;
    #document;
    #other : Text;
  };

  type MediaType = {
    #heroBackground;
    #image;
    #video;
    #backgroundSong;
  };

  public type PublishedMedia = {
    heroBackground : ?Storage.ExternalBlob;
    images : [?(Text, Storage.ExternalBlob)];
    videos : [?(Text, Storage.ExternalBlob)];
    backgroundSong : ?Storage.ExternalBlob;
  };

  var publishedMedia : PublishedMedia = {
    heroBackground = null;
    images = Array.tabulate<?(Text, Storage.ExternalBlob)>(43, func(_) { null });
    videos = Array.tabulate<?(Text, Storage.ExternalBlob)>(6, func(_) { null });
    backgroundSong = null;
  };

  include MixinStorage();

  // Deployment
  public type DeploymentStatus = {
    #success : Text;
    #failure : DeploymentFailure;
  };

  public type DeploymentFailure = {
    message : Text;
    details : ?Text;
  };

  public type VersionInfo = {
    version : Text;
    status : DeploymentStatus;
  };

  public type PrePublishConfig = {
    frontendBuildFailed : Bool;
    missingArtifacts : Bool;
    misconfiguredCanister : Bool;
  };

  public type PrePublishFailure = {
    reason : Text;
    details : ?Text;
  };

  public type PrePublishResult = {
    #passed;
    #failed : PrePublishFailure;
  };

  let publishedVersions = Map.empty<Text, VersionInfo>();
  var currentVersion : ?VersionInfo = null;

  // User Management APIs
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Media Publishing APIs with updated authorization
  public query ({ caller }) func getPublishedMedia() : async PublishedMedia {
    publishedMedia;
  };

  // Hero background
  public shared ({ caller }) func setHeroBackground(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish hero background");
    };
    publishedMedia := { publishedMedia with heroBackground = ?blob };
  };

  // Images
  public shared ({ caller }) func setImage(index : Nat, name : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish images");
    };
    if (index >= 43) {
      Runtime.trap("Invalid image index");
    };
    let updatedImages = Array.tabulate(
      43,
      func(i) {
        if (i == index) {
          ?(name, blob);
        } else {
          publishedMedia.images[i];
        };
      },
    );
    publishedMedia := { publishedMedia with images = updatedImages };
  };

  // Videos
  public shared ({ caller }) func setVideo(index : Nat, name : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish videos");
    };
    if (index >= 6) {
      Runtime.trap("Invalid video index");
    };
    let updatedVideos = Array.tabulate(
      6,
      func(i) {
        if (i == index) {
          ?(name, blob);
        } else {
          publishedMedia.videos[i];
        };
      },
    );
    publishedMedia := { publishedMedia with videos = updatedVideos };
  };

  // Background song
  public shared ({ caller }) func setBackgroundSong(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish background song");
    };
    publishedMedia := { publishedMedia with backgroundSong = ?blob };
  };

  // Media clearing APIs (same permissions as publishing)
  public shared ({ caller }) func clearHeroBackground() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear hero background");
    };
    publishedMedia := { publishedMedia with heroBackground = null };
  };

  public shared ({ caller }) func clearImage(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear images");
    };
    if (index >= 43) {
      Runtime.trap("Invalid image index");
    };
    let updatedImages = Array.tabulate(
      43,
      func(i) {
        if (i == index) { null } else { publishedMedia.images[i] };
      },
    );
    publishedMedia := { publishedMedia with images = updatedImages };
  };

  public shared ({ caller }) func clearVideo(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear videos");
    };
    if (index >= 6) {
      Runtime.trap("Invalid video index");
    };
    let updatedVideos = Array.tabulate(
      6,
      func(i) {
        if (i == index) { null } else { publishedMedia.videos[i] };
      },
    );
    publishedMedia := { publishedMedia with videos = updatedVideos };
  };

  public shared ({ caller }) func clearBackgroundSong() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear background song");
    };
    publishedMedia := { publishedMedia with backgroundSong = null };
  };

  // Utilities
  public shared ({ caller }) func clearAllPublishedMedia() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear all media");
    };
    publishedMedia := {
      heroBackground = null;
      images = Array.tabulate<?(Text, Storage.ExternalBlob)>(43, func(_) { null });
      videos = Array.tabulate<?(Text, Storage.ExternalBlob)>(6, func(_) { null });
      backgroundSong = null;
    };
  };

  // Deployment Management APIs
  public shared ({ caller }) func recordDeployment(version : Text, status : DeploymentStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record deployments");
    };
    let versionInfo = { version; status };
    publishedVersions.add(version, versionInfo);

    switch (status) {
      case (#success(_)) { currentVersion := ?versionInfo };
      case (#failure(_)) { currentVersion := null };
    };
  };

  public query func getCurrentVersion() : async ?VersionInfo {
    currentVersion;
  };

  public query func getVersion(version : Text) : async ?VersionInfo {
    publishedVersions.get(version);
  };

  public shared ({ caller }) func prePublishCheck(config : PrePublishConfig) : async PrePublishResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform pre-publish checks");
    };

    if (config.frontendBuildFailed) {
      return #failed({
        reason = "Frontend build failed";
        details = null;
      });
    };

    if (config.missingArtifacts) {
      return #failed({
        reason = "Missing required artifacts";
        details = null;
      });
    };

    if (config.misconfiguredCanister) {
      return #failed({
        reason = "Misconfigured canister/deploy settings";
        details = null;
      });
    };

    #passed;
  };

  public query func getAllVersions() : async [(Text, VersionInfo)] {
    publishedVersions.toArray();
  };
};
