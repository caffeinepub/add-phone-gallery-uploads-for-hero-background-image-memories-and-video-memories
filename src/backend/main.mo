import Map "mo:core/Map";
import Text "mo:core/Text";
import Migration "migration";
import Iter "mo:core/Iter";

(with migration = Migration.run)
actor {
  type DeploymentStatus = {
    #success : Text;
    #failure : DeploymentFailure;
  };

  type DeploymentFailure = {
    message : Text;
    details : ?Text;
  };

  type VersionInfo = {
    version : Text;
    status : DeploymentStatus;
  };

  type PrePublishConfig = {
    frontendBuildFailed : Bool;
    missingArtifacts : Bool;
    misconfiguredCanister : Bool;
  };

  type PrePublishFailure = {
    reason : Text;
    details : ?Text;
  };

  type PrePublishResult = {
    #passed;
    #failed : PrePublishFailure;
  };

  let publishedVersions = Map.empty<Text, VersionInfo>();
  var currentVersion : ?VersionInfo = null;

  public func recordDeployment(version : Text, status : DeploymentStatus) : async () {
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

  public func prePublishCheck(config : PrePublishConfig) : async PrePublishResult {
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
