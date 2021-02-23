import fetch from 'node-fetch';
import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloLink
} from '@apollo/client';
import { headers, Mutation } from '../definitions/interfaces/interfaces';

const uri = 'https://api.github.com/graphql';

const cache = new InMemoryCache();
const link = ApolloLink.from([
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

export async function mutate(mutation: Mutation): Promise<string> {
    const result = await fetch(uri, mutation);
    return await result.text();
}

export function createMutation(
    query: string,
    input: Record<string, unknown>
): Mutation {
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
