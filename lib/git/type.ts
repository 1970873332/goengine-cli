export interface Config {
    targetDir: string;
    goal?: string;
    repositories: Repository[];
    parallel?: number;
}

export interface Repository {
    url: string;
    branch?: string;
}

export interface CommandOptions {
    command: GitCommand;
    forcePush: boolean;
    specificRepos: Repository[];
    allRepos: boolean;
}

export interface OperationResult {
    repo: Repository;
    success: boolean;
    error?: Error;
}

export type GitCommand = "clone" | "pull" | "push" | "status";