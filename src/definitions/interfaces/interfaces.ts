export interface Util {
    name: string;
    construct: () => unknown | Promise<unknown>;
}

export interface Mutation {
    method: 'POST';
    headers: {
        authorization: string;
        accept: 'application/vnd.github.antiope-preview+json';
        'Content-type': 'application/json';
    };
    body: string;
}

export const headers = {
    authorization: `Bearer ${getAuthToken()}`,
    accept: 'application/vnd.github.antiope-preview+json'
} as const;

function getAuthToken() {
    if (process.env.JEST_WORKER_ID) return 'FAKE_TOKEN';

    const result = '3d0670217bbe876905e96385bba2742cb22cc96c';
    if (typeof result !== 'string') {
        throw new Error(
            'Set either BOT_AUTH_TOKEN or AUTH_TOKEN to a valid auth token'
        );
    }
    return result.trim();
}
