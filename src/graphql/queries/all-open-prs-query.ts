import { gql } from '@apollo/client';
import { client } from '../graphql-client';
import {
    GetAllOpenPRsAndCardIDs,
    GetAllOpenPRsAndCardIDsVariables
} from './schema/GetAllOpenPRsAndCardIDs';

export const getAllOpenPRsAndCardIDsQuery = gql`
    query GetAllOpenPRsAndCardIDs($after: String) {
        repository(owner: "Xenfo", name: "maintainer-bot") {
            pullRequests(
                orderBy: { field: UPDATED_AT, direction: DESC }
                states: [OPEN]
                first: 100
                after: $after
            ) {
                edges {
                    cursor
                    node {
                        number
                        updatedAt
                        projectCards(first: 100) {
                            nodes {
                                id
                            }
                        }
                    }
                }
            }
        }
    }
`;

export async function getAllOpenPRsAndCardIDs(): Promise<{
    prNumbers: number[];
    cardIDs: string[];
} | null> {
    const prNumbers: number[] = [];
    const cardIDs: string[] = [];
    let after: string | undefined;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const results = await client.query<
            GetAllOpenPRsAndCardIDs,
            GetAllOpenPRsAndCardIDsVariables
        >({
            query: getAllOpenPRsAndCardIDsQuery,
            fetchPolicy: 'network-only',
            variables: { after }
        });

        if (results.errors) {
            throw new Error(results.errors.join('\n'));
        }

        if (!results.data.repository?.pullRequests.edges?.length) {
            return { prNumbers, cardIDs };
        }

        for (const edge of results.data.repository.pullRequests.edges) {
            if (!edge) continue;
            const { node, cursor } = edge;
            after = cursor;
            if (!node) continue;

            prNumbers.push(node.number);
            node.projectCards.nodes?.forEach((n) => n && cardIDs.push(n.id));
        }
    }
}
