/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CommentAuthorAssociation, IssueState } from "./../../graphql-global-types";

// ====================================================
// GraphQL query operation: Issue
// ====================================================

export interface Issue_repository_issue_author {
  __typename: "EnterpriseUserAccount" | "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface Issue_repository_issue_labels_nodes {
  __typename: "Label";
  /**
   * Identifies the label name.
   */
  name: string;
}

export interface Issue_repository_issue_labels {
  __typename: "LabelConnection";
  /**
   * A list of nodes.
   */
  nodes: (Issue_repository_issue_labels_nodes | null)[] | null;
}

export interface Issue_repository_issue_comments_nodes_author {
  __typename: "EnterpriseUserAccount" | "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface Issue_repository_issue_comments_nodes_reactions_nodes_user {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface Issue_repository_issue_comments_nodes_reactions_nodes {
  __typename: "Reaction";
  /**
   * Identifies the user who created this reaction.
   */
  user: Issue_repository_issue_comments_nodes_reactions_nodes_user | null;
}

export interface Issue_repository_issue_comments_nodes_reactions {
  __typename: "ReactionConnection";
  /**
   * A list of nodes.
   */
  nodes: (Issue_repository_issue_comments_nodes_reactions_nodes | null)[] | null;
}

export interface Issue_repository_issue_comments_nodes {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: Issue_repository_issue_comments_nodes_author | null;
  /**
   * The body as Markdown.
   */
  body: string;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * A list of Reactions left on the Issue.
   */
  reactions: Issue_repository_issue_comments_nodes_reactions;
}

export interface Issue_repository_issue_comments {
  __typename: "IssueCommentConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
  /**
   * A list of nodes.
   */
  nodes: (Issue_repository_issue_comments_nodes | null)[] | null;
}

export interface Issue_repository_issue_timelineItems_nodes_AddedToProjectEvent {
  __typename: "AddedToProjectEvent" | "AssignedEvent" | "ClosedEvent" | "CommentDeletedEvent" | "ConnectedEvent" | "ConvertedNoteToIssueEvent" | "CrossReferencedEvent" | "DemilestonedEvent" | "DisconnectedEvent" | "LabeledEvent" | "LockedEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MilestonedEvent" | "PinnedEvent" | "ReferencedEvent" | "RemovedFromProjectEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlabeledEvent" | "UnlockedEvent" | "UnmarkedAsDuplicateEvent" | "UnpinnedEvent" | "UnsubscribedEvent" | "UserBlockedEvent";
}

export interface Issue_repository_issue_timelineItems_nodes_IssueComment_author {
  __typename: "EnterpriseUserAccount" | "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface Issue_repository_issue_timelineItems_nodes_IssueComment {
  __typename: "IssueComment";
  /**
   * The actor who authored the comment.
   */
  author: Issue_repository_issue_timelineItems_nodes_IssueComment_author | null;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
}

export interface Issue_repository_issue_timelineItems_nodes_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
}

export interface Issue_repository_issue_timelineItems_nodes_MovedColumnsInProjectEvent_actor {
  __typename: "EnterpriseUserAccount" | "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface Issue_repository_issue_timelineItems_nodes_MovedColumnsInProjectEvent {
  __typename: "MovedColumnsInProjectEvent";
  /**
   * Identifies the actor who performed the event.
   */
  actor: Issue_repository_issue_timelineItems_nodes_MovedColumnsInProjectEvent_actor | null;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
}

export type Issue_repository_issue_timelineItems_nodes = Issue_repository_issue_timelineItems_nodes_AddedToProjectEvent | Issue_repository_issue_timelineItems_nodes_IssueComment | Issue_repository_issue_timelineItems_nodes_ReopenedEvent | Issue_repository_issue_timelineItems_nodes_MovedColumnsInProjectEvent;

export interface Issue_repository_issue_timelineItems {
  __typename: "IssueTimelineItemsConnection";
  /**
   * A list of nodes.
   */
  nodes: (Issue_repository_issue_timelineItems_nodes | null)[] | null;
}

export interface Issue_repository_issue_projectCards_nodes_project {
  __typename: "Project";
  id: string;
  /**
   * The project's number.
   */
  number: number;
  /**
   * The project's name.
   */
  name: string;
}

export interface Issue_repository_issue_projectCards_nodes_column {
  __typename: "ProjectColumn";
  id: string;
  /**
   * The project column's name.
   */
  name: string;
}

export interface Issue_repository_issue_projectCards_nodes {
  __typename: "ProjectCard";
  id: string;
  /**
   * The project that contains this card.
   */
  project: Issue_repository_issue_projectCards_nodes_project;
  /**
   * The project column this card is associated under. A card may only belong to one
   * project column at a time. The column field will be null if the card is created
   * in a pending state and has yet to be associated with a column. Once cards are
   * associated with a column, they will not become pending in the future.
   */
  column: Issue_repository_issue_projectCards_nodes_column | null;
}

export interface Issue_repository_issue_projectCards {
  __typename: "ProjectCardConnection";
  /**
   * A list of nodes.
   */
  nodes: (Issue_repository_issue_projectCards_nodes | null)[] | null;
}

export interface Issue_repository_issue {
  __typename: "Issue";
  id: string;
  /**
   * Identifies the issue title.
   */
  title: string;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * The actor who authored the comment.
   */
  author: Issue_repository_issue_author | null;
  /**
   * Author's association with the subject of the comment.
   */
  authorAssociation: CommentAuthorAssociation;
  /**
   * A list of labels associated with the object.
   */
  labels: Issue_repository_issue_labels | null;
  /**
   * Identifies the issue number.
   */
  number: number;
  /**
   * Identifies the state of the issue.
   */
  state: IssueState;
  /**
   * A list of comments associated with the Issue.
   */
  comments: Issue_repository_issue_comments;
  /**
   * A list of events, comments, commits, etc. associated with the issue.
   */
  timelineItems: Issue_repository_issue_timelineItems;
  /**
   * List of project cards associated with this issue.
   */
  projectCards: Issue_repository_issue_projectCards;
}

export interface Issue_repository {
  __typename: "Repository";
  /**
   * The name of the repository.
   */
  name: string;
  /**
   * Returns a single issue from the current repository by number.
   */
  issue: Issue_repository_issue | null;
}

export interface Issue {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: Issue_repository | null;
}

export interface IssueVariables {
  issue_number: number;
}
