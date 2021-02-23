import { GetIssueInfo } from '../graphql/queries/issue-query';
import {
    Issue as IssueQueryResult,
    Issue_repository_issue as Issue,
    Issue_repository_issue_timelineItems,
    Issue_repository_issue_timelineItems_nodes_ReopenedEvent,
    Issue_repository_issue_timelineItems_nodes_IssueComment,
    Issue_repository as Repo
} from '../graphql/queries/schema/Issue';
import { CommentAuthorAssociation } from '../graphql/queries/graphql-global-types';
import { client } from '../graphql/graphql-client';
import { ApolloQueryResult } from '@apollo/client';
import { findLast, daysSince, authorNotBot } from '../utils/utilFunctions';
import { IssueState } from '../graphql/graphql-global-types';

// Complete failure, won't be passed to `process` (no PR found)
export interface BotFail {
    readonly type: 'fail';
    readonly message: string;
}

// Some error found, will be passed to `process` to report in a comment
export interface BotError {
    readonly type: 'error';
    readonly issue_number: number;
    readonly message: string;
    readonly author: string | undefined;
}

export interface BotEnsureRemovedFromProject {
    readonly type: 'remove';
    readonly issue_number: number;
    readonly message: string;
    readonly isDraft: boolean;
}

export interface IssueInfo {
    readonly type: 'info';

    /** ISO8601 date string for the time the PR info was created at */
    readonly now: string;

    readonly issue_number: number;

    /**
     * The GitHub login of the PR author
     */
    readonly author: string;

    /**
     * The date the anyone had a meaningful interaction with the PR
     */
    readonly lastCommentDate: Date | undefined;

    /**
     * The date the PR was last reopened by a maintainer
     */
    readonly reopenedDate?: Date;

    /**
     * Integer count of days of inactivity from the author
     */
    readonly stalenessInDays: number;

    readonly isFirstContribution: boolean;

    readonly wontFix: boolean;
}

// Just the networking
export async function queryIssueInfo(
    issueNumber: number
): Promise<ApolloQueryResult<IssueQueryResult>> {
    return await client.query<IssueQueryResult>({
        query: GetIssueInfo,
        variables: {
            issue_number: issueNumber
        },
        fetchPolicy: 'network-only'
    });
}

// The GQL response => Useful data for us
export async function deriveStateForIssue(
    info: ApolloQueryResult<IssueQueryResult>,
    getNow = () => new Date()
): Promise<IssueInfo | BotFail | BotError | BotEnsureRemovedFromProject> {
    const issueInfo = info.data.repository?.issue;

    if (!issueInfo)
        return botFail(
            `No PR with this number exists, (${JSON.stringify(info)})`
        );
    if (issueInfo.author == null)
        return botError(issueInfo.number, 'PR author does not exist');

    if (issueInfo.state !== IssueState.OPEN)
        return botEnsureRemovedFromProject(
            issueInfo.number,
            'PR is not active',
            false
        );

    const author = issueInfo.author.login;

    const isFirstContribution =
        issueInfo.authorAssociation ===
        CommentAuthorAssociation.FIRST_TIME_CONTRIBUTOR;

    const createdDate = new Date(issueInfo.createdAt);
    const lastCommentDate = getLastCommentActivityDate(issueInfo.timelineItems);
    const reopenedDate = getReopenedDate(issueInfo.timelineItems);
    const now = getNow().toISOString();
    const activityDates = [createdDate, lastCommentDate, reopenedDate];

    return {
        type: 'info',
        now,
        issue_number: issueInfo.number,
        author,
        stalenessInDays: Math.min(
            ...activityDates.map((date) => daysSince(date || createdDate, now))
        ),
        reopenedDate,
        lastCommentDate,
        isFirstContribution,
        wontFix: getWontFix(issueInfo)
    };

    function botFail(message: string): BotFail {
        return { type: 'fail', message };
    }

    function botError(issue_number: number, message: string): BotError {
        return {
            type: 'error',
            message,
            issue_number,
            author: issueInfo?.author?.login
        };
    }

    function botEnsureRemovedFromProject(
        issue_number: number,
        message: string,
        isDraft: boolean
    ): BotEnsureRemovedFromProject {
        return { type: 'remove', issue_number, message, isDraft };
    }

    function getWontFix(issueInfo: Issue) {
        const wontFix = issueInfo.labels?.nodes?.filter(
            (l) => l?.name === 'wontfix'
        )?.[0];
        return !(wontFix === undefined);
    }
}

type ReopenedEvent = Issue_repository_issue_timelineItems_nodes_ReopenedEvent;

/** Either: when the PR was last opened, or switched to ready from draft */
function getReopenedDate(timelineItems: Issue_repository_issue_timelineItems) {
    const lastItem = findLast(
        timelineItems.nodes,
        (item): item is ReopenedEvent => item?.__typename === 'ReopenedEvent'
    );

    return lastItem && lastItem.createdAt && new Date(lastItem.createdAt);
}

type IssueComment = Issue_repository_issue_timelineItems_nodes_IssueComment;

function getLastCommentActivityDate(
    timelineItems: Issue_repository_issue_timelineItems
) {
    const lastIssueComment = findLast(
        timelineItems.nodes,
        (item): item is IssueComment => {
            return item?.__typename === 'IssueComment' && authorNotBot(item!);
        }
    );

    if (lastIssueComment) {
        const latestDate = [lastIssueComment?.createdAt].sort()[0];
        return new Date(latestDate);
    }
    return undefined;
}
