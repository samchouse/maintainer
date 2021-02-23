import { gql } from '@apollo/client';

export const GetIssueInfo = gql`
    query Issue($issue_number: Int!) {
        repository(name: "maintainer-bot", owner: "Xenfo") {
            name
            issue(number: $issue_number) {
                id
                title
                createdAt
                author {
                    login
                }
                authorAssociation
                labels(first: 100) {
                    nodes {
                        name
                    }
                }
                number
                state
                comments(first: 100) {
                    totalCount
                    nodes {
                        id
                        author {
                            login
                        }
                        body
                        createdAt
                        reactions(first: 100, content: THUMBS_UP) {
                            nodes {
                                user {
                                    login
                                }
                            }
                        }
                    }
                }
                timelineItems(
                    last: 200
                    itemTypes: [
                        ISSUE_COMMENT
                        REOPENED_EVENT
                        MOVED_COLUMNS_IN_PROJECT_EVENT
                    ]
                ) {
                    nodes {
                        ... on IssueComment {
                            author {
                                login
                            }
                            createdAt
                        }
                        ... on ReopenedEvent {
                            createdAt
                        }
                        ... on MovedColumnsInProjectEvent {
                            actor {
                                login
                            }
                            createdAt
                        }
                    }
                }
                projectCards(first: 10) {
                    nodes {
                        id
                        project {
                            id
                            number
                            name
                        }
                        column {
                            id
                            name
                        }
                    }
                }
                labels(first: 100) {
                    nodes {
                        name
                    }
                }
            }
        }
    }
`;
