import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VersionInfo {
    status: DeploymentStatus;
    version: string;
}
export type DeploymentStatus = {
    __kind__: "failure";
    failure: DeploymentFailure;
} | {
    __kind__: "success";
    success: string;
};
export type PrePublishResult = {
    __kind__: "failed";
    failed: PrePublishFailure;
} | {
    __kind__: "passed";
    passed: null;
};
export interface DeploymentFailure {
    message: string;
    details?: string;
}
export interface PrePublishConfig {
    missingArtifacts: boolean;
    misconfiguredCanister: boolean;
    frontendBuildFailed: boolean;
}
export interface PrePublishFailure {
    details?: string;
    reason: string;
}
export interface backendInterface {
    getAllVersions(): Promise<Array<[string, VersionInfo]>>;
    getCurrentVersion(): Promise<VersionInfo | null>;
    getVersion(version: string): Promise<VersionInfo | null>;
    prePublishCheck(config: PrePublishConfig): Promise<PrePublishResult>;
    recordDeployment(version: string, status: DeploymentStatus): Promise<void>;
}
