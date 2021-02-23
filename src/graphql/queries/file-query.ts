import { gql } from '@apollo/client';

export const GetFileContent = gql`
    query GetFileContent($owner: String!, $name: String!, $expr: String!) {
        repository(owner: $owner, name: $name) {
            object(expression: $expr) {
                ... on Blob {
                    text
                    byteSize
                }
            }
        }
    }
`;
