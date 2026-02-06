import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldPublishedMedia = {
    heroBackground : ?Storage.ExternalBlob;
    images : [?(Text, Storage.ExternalBlob)];
    videos : [?(Text, Storage.ExternalBlob)];
    backgroundSong : ?Storage.ExternalBlob;
  };

  type OldActor = {
    imageUploaderAllowlist : [Principal];
    userProfiles : Map.Map<Principal, { name : Text }>;
    publishedMedia : OldPublishedMedia;
    publishedVersions : Map.Map<Text, {
      version : Text;
      status : {
        #success : Text;
        #failure : {
          message : Text;
          details : ?Text;
        };
      };
    }>;
    currentVersion : ?{
      version : Text;
      status : {
        #success : Text;
        #failure : {
          message : Text;
          details : ?Text;
        };
      };
    };
  };

  type NewPublishedMedia = {
    heroBackground : ?Storage.ExternalBlob;
    images : [?(Text, Storage.ExternalBlob)];
    videos : [?(Text, Storage.ExternalBlob)];
    backgroundSong : ?Storage.ExternalBlob;
  };

  type NewActor = {
    imageUploaderAllowlist : [Principal];
    userProfiles : Map.Map<Principal, { name : Text }>;
    publishedMedia : NewPublishedMedia;
    publishedVersions : Map.Map<Text, {
      version : Text;
      status : {
        #success : Text;
        #failure : {
          message : Text;
          details : ?Text;
        };
      };
    }>;
    currentVersion : ?{
      version : Text;
      status : {
        #success : Text;
        #failure : {
          message : Text;
          details : ?Text;
        };
      };
    };
  };

  public func run(old : OldActor) : NewActor {
    { old with publishedMedia = migratePublishedMedia(old.publishedMedia) };
  };

  func migratePublishedMedia(old : OldPublishedMedia) : NewPublishedMedia {
    { old with images = old.images.sliceToArray(0, old.images.size()) };
  };
};
