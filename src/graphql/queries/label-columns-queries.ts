import { gql } from '@apollo/client';

export const GetLabels = gql`
    query GetLabels {
        repository(name: "Xenfo", owner: "maintainer-bot") {
            labels(first: 100) {
                nodes {
                    id
                    name
                }
            }
        }
    }
`;

export const GetProjectColumns = gql`
    query GetProjectColumns {
        repository(name: "Xenfo", owner: "maintainer-bot") {
            project(number: 1) {
                id
                columns(first: 30) {
                    nodes {
                        id
                        name
                    }
                }
            }
        }
    }
`;
