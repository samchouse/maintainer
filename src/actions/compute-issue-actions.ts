import * as Comments from '../other/comments';
import {
    BotEnsureRemovedFromProject,
    BotError,
    IssueInfo
} from '../other/issue-info';

type ColumnName =
    | 'Needs Author Action'
    | 'Closed'
    | 'Other'
    | 'Needs Maintainer Action';

type LabelName =
    | 'bug'
    | 'documentation'
    | 'dependencies'
    | 'Abandoned'
    | 'help wanted'
    | 'enhancement'
    | 'question'
    | 'Bot Error';

export interface Actions {
    issue_number: number;
    targetColumn?: ColumnName;
    labels: { [L in LabelName]?: boolean };
    responseComments: Comments.Comment[];
    shouldClose: boolean;
    shouldUpdateLabels: boolean;
    shouldUpdateProjectColumn: boolean;
    shouldRemoveFromActiveColumns: boolean;
}

function createDefaultActions(issue_number: number): Actions {
    return {
        issue_number,
        targetColumn: 'Other',
        labels: {
            bug: false,
            documentation: false,
            dependencies: false,
            'help wanted': false,
            enhancement: false,
            question: false,
            Abandoned: false
        },
        responseComments: [],
        shouldClose: false,
        shouldUpdateLabels: true,
        shouldUpdateProjectColumn: true,
        shouldRemoveFromActiveColumns: false
    };
}

function createEmptyActions(issue_number: number): Actions {
    return {
        issue_number: issue_number,
        labels: {},
        responseComments: [],
        shouldClose: false,
        shouldUpdateLabels: false,
        shouldUpdateProjectColumn: false,
        shouldRemoveFromActiveColumns: false
    };
}

interface ExtendedPrInfo extends IssueInfo {
    readonly orig: IssueInfo;
    readonly staleness: Staleness;
}

function extendPrInfo(info: IssueInfo): ExtendedPrInfo {
    const staleness = getStaleness(info);
    return {
        ...info,
        orig: info,
        staleness
    };
}

export function process(
    issueInfo: IssueInfo | BotEnsureRemovedFromProject | BotError
): Actions {
    if (issueInfo.type === 'remove') {
        if (issueInfo.isDraft) {
            return {
                ...createEmptyActions(issueInfo.issue_number),
                targetColumn: 'Needs Author Action',
                shouldUpdateProjectColumn: true
            };
        } else {
            return {
                ...createEmptyActions(issueInfo.issue_number),
                shouldRemoveFromActiveColumns: true
            };
        }
    }

    const context = createDefaultActions(issueInfo.issue_number);

    if (issueInfo.type === 'error') {
        context.targetColumn = 'Other';
        context.labels['Bot Error'] = true;
        context.responseComments.push(
            Comments.HadError(issueInfo.author, issueInfo.message)
        );
        return context;
    }

    // Collect some additional info
    const info = extendPrInfo(issueInfo);

    context.labels['Abandoned'] = info.staleness === Staleness.Abandoned;

    // Update intro comment
    context.responseComments.push({
        tag: 'welcome',
        status: createWelcomeComment(info)
    });

    // Some step should override this
    context.targetColumn = 'Other';

    if (info.wontFix) {
        // Could be abandoned
        switch (info.staleness) {
            case Staleness.NearlyYSYL:
            case Staleness.YSYL:
                throw new Error('Internal Error: unexpected Staleness.YSYL');
            case Staleness.NearlyAbandoned:
                context.responseComments.push(
                    Comments.NearlyAbandoned(info.author)
                );
                break;
            case Staleness.Abandoned:
                context.responseComments.push(
                    Comments.SorryAbandoned(info.author)
                );
                context.shouldClose = true;
                context.shouldRemoveFromActiveColumns = true;
                break;
        }
    }
    // Stale & doesn't need author attention => move to maintainer queue
    // ("Abandoned" can happen here for a PR that is not broken, but didn't get any supporting reviews for a long time)
    else if (
        info.staleness === Staleness.YSYL ||
        info.staleness === Staleness.Abandoned
    ) {
        context.targetColumn = 'Needs Maintainer Action';
    }

    return context;
}

const enum Staleness {
    Fresh,
    PayAttention,
    NearlyYSYL,
    YSYL,
    NearlyAbandoned,
    Abandoned
}

function getStaleness(info: IssueInfo) {
    return info.stalenessInDays <= 6
        ? Staleness.Fresh
        : info.stalenessInDays <= 22
        ? Staleness.PayAttention
        : info.stalenessInDays <= 30
        ? Staleness.NearlyAbandoned
        : Staleness.Abandoned;
}

function createWelcomeComment(info: ExtendedPrInfo) {
    let content = '';

    function display(...lines: string[]) {
        lines.forEach((line) => (content += line + '\n'));
    }

    const specialWelcome = !info.isFirstContribution
        ? ``
        : ` I see this is your first time submitting to ____ 👋 — I'm the bot who will help you through the process of getting through your issue.`;
    display(
        `@${info.author} Thank you for submitting this issue!${specialWelcome}`,
        ``,
        `***This is a live comment which I will keep updated.***`,
        ``
    );

    return content.trimEnd();
}
