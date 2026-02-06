import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PublishedMedia {
    backgroundSong?: ExternalBlob;
    heroBackground?: ExternalBlob;
    videos: Array<[string, ExternalBlob] | null>;
    images: Array<[string, ExternalBlob] | null>;
}
export interface PrePublishConfig {
    missingArtifacts: boolean;
    misconfiguredCanister: boolean;
    frontendBuildFailed: boolean;
}
export type DeploymentStatus = {
    __kind__: "failure";
    failure: DeploymentFailure;
} | {
    __kind__: "success";
    success: string;
};
export interface DeploymentFailure {
    message: string;
    details?: string;
}
export interface PrePublishFailure {
    details?: string;
    reason: string;
}
export type PrePublishResult = {
    __kind__: "failed";
    failed: PrePublishFailure;
} | {
    __kind__: "passed";
    passed: null;
};
export interface UserProfile {
    name: string;
}
export interface VersionInfo {
    status: DeploymentStatus;
    version: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllPublishedMedia(): Promise<void>;
    clearBackgroundSong(): Promise<void>;
    clearHeroBackground(): Promise<void>;
    clearImage(index: bigint): Promise<void>;
    clearVideo(index: bigint): Promise<void>;
    getAllVersions(): Promise<Array<[string, VersionInfo]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentVersion(): Promise<VersionInfo | null>;
    getPublishedMedia(): Promise<PublishedMedia>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVersion(version: string): Promise<VersionInfo | null>;
    isCallerAdmin(): Promise<boolean>;
    prePublishCheck(config: PrePublishConfig): Promise<PrePublishResult>;
    recordDeployment(version: string, status: DeploymentStatus): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBackgroundSong(blob: ExternalBlob): Promise<void>;
    setHeroBackground(blob: ExternalBlob): Promise<void>;
    setImage(index: bigint, name: string, blob: ExternalBlob): Promise<void>;
    setVideo(index: bigint, name: string, blob: ExternalBlob): Promise<void>;
}
