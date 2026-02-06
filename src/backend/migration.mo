import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type UserProfile = {
    name : Text;
  };

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

  public type PublishedMedia = {
    heroBackground : ?Storage.ExternalBlob;
    images : [?(Text, Storage.ExternalBlob)];
    videos : [?(Text, Storage.ExternalBlob)];
    backgroundSong : ?Storage.ExternalBlob;
  };

  type OldPublishedMedia = {
    heroBackground : ?Storage.ExternalBlob;
    images : [?(Text, Storage.ExternalBlob)];
    videos : [?(Text, Storage.ExternalBlob)];
    backgroundSong : ?Storage.ExternalBlob;
  };

  type OldActor = {
    publishedMedia : OldPublishedMedia;
    publishedVersions : Map.Map<Text, VersionInfo>;
    currentVersion : ?VersionInfo;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    publishedMedia : PublishedMedia;
    publishedVersions : Map.Map<Text, VersionInfo>;
    currentVersion : ?VersionInfo;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    // Ensure all arrays are initialized to correct length
    let images : [?(Text, Storage.ExternalBlob)] = if (old.publishedMedia.images.size() < 43) {
      Array.tabulate<?(Text, Storage.ExternalBlob)>(
        43,
        func(i) {
          if (i < old.publishedMedia.images.size()) {
            old.publishedMedia.images[i];
          } else {
            null;
          };
        },
      );
    } else {
      old.publishedMedia.images;
    };

    let videos : [?(Text, Storage.ExternalBlob)] = if (old.publishedMedia.videos.size() < 6) {
      Array.tabulate<?(Text, Storage.ExternalBlob)>(
        6,
        func(i) {
          if (i < old.publishedMedia.videos.size()) {
            old.publishedMedia.videos[i];
          } else {
            null;
          };
        },
      );
    } else {
      old.publishedMedia.videos;
    };

    {
      publishedMedia = {
        old.publishedMedia with
        images;
        videos;
      };
      publishedVersions = old.publishedVersions;
      currentVersion = old.currentVersion;
      userProfiles = old.userProfiles;
    };
  };
};
