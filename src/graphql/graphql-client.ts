import fetch from 'node-fetch';
import { ApolloClient } from 'apollo-client';
import {
    InMemoryCache,
    IntrospectionFragmentMatcher
} from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';

export interface Mutation {
    method: 'POST';
    headers: {
        authorization: string;
        accept: 'application/vnd.github.antiope-preview+json';
        'Content-type': 'application/json';
    };
    body: string;
}

const headers = {
    authorization: `Bearer ${getAuthToken()}`,
    accept: 'application/vnd.github.antiope-preview+json'
} as const;

const uri = 'https://api.github.com/graphql';

const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData: {
        __schema: {
            types: []
        }
    }
});
const cache = new InMemoryCache({ fragmentMatcher });
const link = ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
            graphQLErrors.map(({ message, locations, path }) =>
                console.log(
                    `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                )
            );
        if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    new HttpLink({
        uri,
        headers,
        fetch
    })
]);

export const client = new ApolloClient({
    link,
    cache,
    defaultOptions: {
        query: {
            errorPolicy: 'all'
        }
    }
});

export async function mutate(mutation: Mutation) {
    const result = await fetch(uri, mutation);
    return await result.text();
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function createMutation(query: string, input: object): Mutation {
    return {
        method: 'POST',
        headers: {
            ...headers,
            'Content-type': 'application/json'
        },
        body: JSON.stringify(
            {
                query,
                variables: input
            },
            undefined,
            2
        )
    };
}

function getAuthToken() {
    if (process.env.JEST_WORKER_ID) return 'FAKE_TOKEN';

    const result = 'e2047580907410f11332c7b23706260c0b90155d';
    if (typeof result !== 'string') {
        throw new Error(
            'Set either BOT_AUTH_TOKEN or AUTH_TOKEN to a valid auth token'
        );
    }
    return result.trim();
}
