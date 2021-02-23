import { queryIssueInfo, deriveStateForIssue } from '../other/issue-info';
import * as compute from '../actions/compute-issue-actions';
import { executeIssueActions } from '../actions/execute-issue-actions';
import { runQueryToGetPRMetadataForSHA1 } from '../graphql/queries/SHA1-to-PR-query';
import { app } from './start-webhook';
import { verifyPostData } from '../utils/utilFunctions';

const prHandlers = new Map();

app.post('/payload', verifyPostData, async (req, res) => {
    console.log(
        res
            .status(501)
            .send(`NOOPing because typescript-bot triggered the request`)
    );
    const event = req.headers['x-github-event'];

    if (Array.isArray(event)) return;

    // https://developer.github.com/webhooks/
    const acceptedEventsToActions = {
        pull_request: [
            'opened',
            'closed',
            'reopened',
            'edited',
            'synchronized',
            'ready_for_review'
        ],
        issues: ['opened', 'closed', 'reopened', 'edited'],
        pull_request_review: ['submitted', 'dismissed'],
        issue_comment: ['created', 'edited', 'deleted'],
        project_card: ['moved'],
        check_suite: ['completed'],
        issue: ['opened', 'closed', 'reopened', 'edited']
    };

    const acceptedEvents = Object.keys(acceptedEventsToActions);

    // Bail if not a PR
    if (!acceptedEvents.includes(event!)) {
        console.log(
            `Skipped webhook ${event}, do not know how to handle the event - accepts: ${acceptedEvents.join(
                ', '
            )}`
        );

        return res.status(501).send('NOOPing due to unknown event');
    }

    const webhook = req.body;
    const action = 'action' in webhook ? webhook.action : 'status';

    if (webhook.sender.login === 'typescript-bot') {
        console.log(
            `Skipped webhook because it was triggered by typescript-bot`
        );

        return res
            .status(501)
            .send(`NOOPing because typescript-bot triggered the request`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const allowListedActions = acceptedEventsToActions[event];
    if (
        !allowListedActions.includes(action) &&
        !allowListedActions.includes('*')
    ) {
        console.log(
            `Skipped webhook, ${action} on ${event}, do not know how to handle the action`
        );

        return res
            .status(501)
            .send(`NOOPing due to not supporting ${action} on ${event}`);
    }

    let prNumber = -1;
    let prTitle = '(title not fetched)'; // this is only used for logging, not worth an API lookup => not always set
    if ('pull_request' in webhook) {
        prNumber = webhook.pull_request.number;
        prTitle = webhook.pull_request.title;
    } else if ('issue' in webhook) {
        prNumber = webhook.issue.number;
        prTitle = webhook.issue.title;
    } else if ('project_card' in webhook) {
        // Hack to get the PR number, could be found directly only in `content_url`
        const cardURL = webhook.project_card.content_url;
        const numberInURL = cardURL.match(/\/\d+$/);
        if (!numberInURL)
            throw new Error(
                `Could not get PR for project card URL: ${cardURL}`
            );
        prNumber = +numberInURL[0].substring(1);
    } else if ('check_suite' in webhook) {
        // See https://github.com/maintainers/early-access-feedback/issues/114 for more context on getting a PR from a SHA
        // TLDR: it's not in the API, and this search hack has been in used on Peril for the last ~3 years
        // => Instead of an arbitrary search, use `associatedPullRequests` (https://developer.github.com/v4/changelog/2019-03-08-schema-changes/)
        const owner = webhook.repository.owner.login;
        const repo = webhook.repository.name;
        const sha = webhook.check_suite.head_sha;
        const pr = await runQueryToGetPRMetadataForSHA1(owner, repo, sha);
        if (!pr || pr.closed) {
            const whatFailed = !pr ? 'a PR' : 'an open PR';
            console.log(
                `Skipped webhook, could not find ${whatFailed} for the sha referenced in the status (${sha})`
            );

            return res
                .status(501)
                .send(
                    `NOOPing due to not finding ${whatFailed} for the sha ${sha}`
                );
        }

        prNumber = pr.number;
    }

    if (prNumber === -1)
        throw new Error(
            `PR Number was not set from a webhook - ${event} on ${action}`
        );

    if (prHandlers.has(prNumber)) prHandlers.get(prNumber)(); // cancel older handler for the same pr
    const aborted = await new Promise((res) => {
        const timeout = setTimeout(() => res(false), 30000);
        prHandlers.set(prNumber, () => {
            clearTimeout(timeout);
            res(true);
        });
    });
    if (aborted) {
        console.log(
            `Skipped webhook, superseded by a newer one for ${prNumber}`
        );

        return res.status(501).send('NOOPing due to a newer webhook');
    }
    prHandlers.delete(prNumber);

    console.log(`Getting info for PR ${prNumber} - ${prTitle}`);

    // Generate the info for the PR from scratch
    const info = await queryIssueInfo(prNumber);
    const state = await deriveStateForIssue(info);

    console.log(info);
    console.log(state);

    // If it didn't work, bail early
    if (state.type === 'fail') {
        const isIssueNotPR =
            state.message.startsWith('No PR with this number exists') &&
            'issue' in webhook;
        if (isIssueNotPR) {
            return res
                .status(501)
                .send(`NOOPing due to ${prNumber} not being a PR`);
        } else {
            console.log(`Failed because of: ${state.message}`);
            return res.status(422).send(`Failed because of: ${state.message}`);
        }
    }

    // Convert the info to a set of actions for the bot
    const actions = compute.process(state);

    console.log(actions);

    // Act on the actions
    console.log(await executeIssueActions(actions, info.data));

    return res.status(200).end();
});
