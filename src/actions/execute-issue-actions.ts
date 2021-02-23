import { Actions } from './compute-issue-actions';
import {
    Issue as IssueQueryResult,
    Issue_repository_issue
} from '../graphql/queries/schema/Issue';
import { Mutation } from '../definitions/interfaces/interfaces';
import { createMutation, mutate } from '../graphql/graphql-client';
import { getLabels, getProjectBoardColumns } from '../utils/cacheQueries';

const ProjectBoardNumber = 1;

const addComment = `mutation($input: AddCommentInput!) { addComment(input: $input) { clientMutationId } }`;
const deleteComment = `mutation($input: DeleteIssueCommentInput!) { deleteIssueComment(input: $input) { clientMutationId } }`;
const editComment = `mutation($input: UpdateIssueCommentInput!) { updateIssueComment(input: $input) { clientMutationId } }`;
const addLabels = `mutation($input: AddLabelsToLabelableInput!) { addLabelsToLabelable(input: $input) { clientMutationId } }`;
const removeLabels = `mutation($input: RemoveLabelsFromLabelableInput!) { removeLabelsFromLabelable(input: $input) { clientMutationId } }`;
const closeIssue = `mutation($input: CloseIssueInput!) { closeIssue(input: $input) { clientMutationId } }`;

const addProjectCard = `mutation($input: AddProjectCardInput!) { addProjectCard(input: $input) { clientMutationId } }`;
const moveProjectCard = `mutation($input: MoveProjectCardInput!) { moveProjectCard(input: $input) { clientMutationId } }`;
const deleteProjectCard = `mutation($input: DeleteProjectCardInput!) { deleteProjectCard(input: $input) { clientMutationId } }`;

export async function executeIssueActions(
    actions: Actions,
    info: IssueQueryResult,
    dry?: boolean
): Promise<string[]> {
    const issue = info.repository?.issue!;

    let mutations: Mutation[] = [];

    const labelMutations = await getMutationsForLabels(actions, issue);
    mutations = mutations.concat(labelMutations);

    const projectMutations = await getMutationsForProjectChanges(
        actions,
        issue
    );
    mutations = mutations.concat(projectMutations);

    const commentMutations = getMutationsForComments(actions, issue);
    mutations = mutations.concat(commentMutations);

    const commentRemovalMutations = getMutationsForCommentRemovals(
        actions,
        issue
    );
    mutations = mutations.concat(commentRemovalMutations);

    const prStateMutations = getMutationsForChangingIssueState(actions, issue);
    mutations = mutations.concat(prStateMutations);

    if (!dry) {
        // Perform mutations one at a time
        for (const mutation of mutations) {
            await mutate(mutation);
        }
    }

    return mutations.map((m) => m.body);
}

const prefix = '\n<!--typescript_bot_';
const suffix = '-->';

async function getMutationsForLabels(
    actions: Actions,
    issue: Issue_repository_issue
) {
    const labels = issue.labels?.nodes!;
    const mutations: Mutation[] = [];
    const labelsToAdd: string[] = [];
    const labelsToRemove: string[] = [];

    if (!actions.shouldUpdateLabels) {
        return mutations;
    }

    for (const key of Object.keys(
        actions.labels
    ) as (keyof typeof actions['labels'])[]) {
        const exists = labels.some((l) => l && l.name === key);
        if (exists && !actions.labels[key]) labelsToRemove.push(key);
        if (!exists && actions.labels[key]) labelsToAdd.push(key);
    }

    if (labelsToAdd.length) {
        const labelIds: string[] = [];
        for (const label of labelsToAdd) {
            labelIds.push(await getLabelIdByName(label));
        }

        mutations.push(
            createMutation(addLabels, {
                input: { labelIds, labelableId: issue.id }
            })
        );
    }

    if (labelsToRemove.length) {
        const labelIds: string[] = [];
        for (const label of labelsToRemove) {
            labelIds.push(await getLabelIdByName(label));
        }

        mutations.push(
            createMutation(removeLabels, {
                input: { labelIds, labelableId: issue.id }
            })
        );
    }

    return mutations;
}

async function getMutationsForProjectChanges(
    actions: Actions,
    issue: Issue_repository_issue
) {
    const mutations: Mutation[] = [];

    if (actions.shouldRemoveFromActiveColumns) {
        const card = issue.projectCards.nodes?.find(
            (card) => card?.project.number === ProjectBoardNumber
        );
        if (card && card.column?.name !== 'Recently Merged') {
            mutations.push(
                createMutation(deleteProjectCard, {
                    input: { cardId: card.id }
                })
            );
        }
        return mutations;
    }

    if (!actions.shouldUpdateProjectColumn) {
        return mutations;
    }

    // Create a project card if needed, otherwise move if needed
    if (actions.targetColumn) {
        const extantCard = issue.projectCards.nodes?.find(
            (n) => !!n?.column && n.project.number === ProjectBoardNumber
        );
        const targetColumnId = await getProjectBoardColumnIdByName(
            actions.targetColumn
        );
        if (extantCard) {
            if (extantCard.column?.name !== actions.targetColumn) {
                mutations.push(
                    createMutation(moveProjectCard, {
                        input: {
                            cardId: extantCard.id,
                            columnId: targetColumnId
                        }
                    })
                );
            }
        } else {
            mutations.push(
                createMutation(addProjectCard, {
                    input: {
                        contentId: issue.id,
                        projectColumnId: targetColumnId
                    }
                })
            );
        }
    }
    return mutations;
}

function getMutationsForComments(
    actions: Actions,
    issue: Issue_repository_issue
) {
    const mutations: Mutation[] = [];
    for (const wantedComment of actions.responseComments) {
        let exists = false;
        for (const actualComment of issue.comments.nodes ?? []) {
            if (actualComment?.author?.login !== 'typescript-bot') continue;
            const parsed = parseComment(actualComment.body);
            if (parsed?.tag !== wantedComment.tag) continue;
            exists = true;
            if (parsed.status === wantedComment.status) continue; // Comment is up-to-date; skip
            // Edit it
            const body = makeComment(wantedComment.status, wantedComment.tag);
            if (body === actualComment.body) break;
            mutations.push(
                createMutation(editComment, {
                    input: { id: actualComment.id, body }
                })
            );
            break;
        }

        if (!exists) {
            mutations.push(
                createMutation(addComment, {
                    input: {
                        subjectId: issue.id,
                        body: makeComment(
                            wantedComment.status,
                            wantedComment.tag
                        )
                    }
                })
            );
        }
    }

    return mutations;
}

function getMutationsForCommentRemovals(
    actions: Actions,
    issue: Issue_repository_issue
) {
    const mutations: Mutation[] = [];

    const ciMessageToKeep = actions.responseComments.find((c) =>
        c.tag.startsWith('ci-complaint')
    );
    const botComments = (issue.comments.nodes ?? []).filter(
        (comment) => comment?.author?.login === 'typescript-bot'
    );
    for (const comment of botComments) {
        if (!comment) continue;

        const parsed = parseComment(comment.body);
        if (!parsed) continue;

        // Remove stale CI 'your build is green' notifications
        if (parsed.tag.includes('ci-') && parsed.tag !== ciMessageToKeep?.tag) {
            mutations.push(
                createMutation(deleteComment, { input: { id: comment.id } })
            );
        }
    }

    return mutations;
}

function getMutationsForChangingIssueState(
    actions: Actions,
    issue: Issue_repository_issue
) {
    const mutations: Mutation[] = [];

    if (actions.shouldClose) {
        mutations.push(
            createMutation(closeIssue, { input: { pullRequestId: issue.id } })
        );
    }
    return mutations;
}

function parseComment(
    body: string
): undefined | { status: string; tag: string } {
    const start = body.lastIndexOf(prefix);
    const end = body.lastIndexOf(suffix);
    return start < 0 || end < 0 || end + suffix.length != body.length
        ? undefined
        : {
              status: body.substr(0, start),
              tag: body.substr(
                  start + prefix.length,
                  end - start - prefix.length
              )
          };
}

function makeComment(body: string, tag: string) {
    return `${body}${prefix}${tag}${suffix}`;
}

async function getProjectBoardColumnIdByName(name: string): Promise<string> {
    const columns = await getProjectBoardColumns();
    console.log(columns);
    const res = columns.filter((e) => e && e.name === name)[0]?.id;
    if (res !== undefined) {
        return res;
    }
    throw new Error(`No project board column named "${name}" exists`);
}

export async function getLabelIdByName(name: string): Promise<string> {
    const labels = await getLabels();
    const res = labels.find((l) => l.name === name)?.id;
    if (res !== undefined) {
        return res;
    }
    throw new Error(`No label named "${name}" exists`);
}
