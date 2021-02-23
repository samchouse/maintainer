// // You can import your modules
// // import index from '../src/index'
//
// import nock from 'nock'
// // Requiring our app implementation
// import myProbotApp from '../src'
// import { Probot, ProbotOctokit } from 'probot'
// // Requiring our fixtures
// import payload from './fixtures/'
// const issueCreatedBody = { body: 'Thanks for opening this issue!' }
// const fs = require('fs')
// const path = require('path')
//
// const privateKey = fs.readFileSync(path.join(__dirname, 'fixtures/mock-cert.pem'), 'utf-8')
//
// describe('My Probot app', () => {
//     let probot: any
//
//     beforeEach(() => {
//         nock.disableNetConnect()
//         probot = new Probot({
//             id: 123,
//             privateKey,
//             // disable request throttling and retries for testing
//             Octokit: ProbotOctokit.defaults({
//                 retry: { enabled: false },
//                 throttle: { enabled: false },
//             })
//         })
//         // Load our app into probot
//         probot.load(myProbotApp)
//     })
//
//     test('creates a comment when an issue is opened', async (done) => {
//         const mock = nock('https://api.github.com')
//
//             // Test that we correctly return a test token
//             .post('/app/installations/2/access_tokens')
//             .reply(200, {
//                 token: 'test',
//                 permissions: {
//                     issues: "write"
//                 }
//             })
//
//             // Test that a comment is posted
//             .post('/repos/hiimbex/testing-things/issues/1/comments', (body: any) => {
//                 done(expect(body).toMatchObject(issueCreatedBody))
//                 return true
//             })
//             .reply(200)
//
//         // Receive a webhook event
//         await probot.receive({ name: 'issues', payload })
//
//         expect(mock.pendingMocks()).toStrictEqual([])
//     })
//
//     afterEach(() => {
//         nock.cleanAll()
//         nock.enableNetConnect()
//     })
// })
//
// // For more information about testing with Jest see:
// // https://facebook.github.io/jest/
//
// // For more information about using TypeScript in your tests, Jest recommends:
// // https://github.com/kulshekhar/ts-jest
//
// // For more information about testing with Nock see:
// // https://github.com/nock/nock

import { readdirSync, readFileSync, lstatSync } from "fs";
import { join } from "path";
import { toMatchFile } from "jest-file-snapshot";
import { process } from "../actions/compute-pr-actions";
import { deriveStateForPR } from "../other/pr-info";
import { scrubDiagnosticDetails } from "../utils/utilFunctions";
import * as cachedQueries from "./cachedQueries.json";
jest.mock("../utils/cacheQueries", () => ({
    getProjectBoardColumns: jest.fn(() => cachedQueries.getProjectBoardColumns),
    getLabels: jest.fn(() => cachedQueries.getLabels)
}));
import { executePrActions } from "../actions/execute-pr-actions";

expect.extend({ toMatchFile });

/* You can use the following command to add/update fixtures with an existing PR
 *
 *     BOT_AUTH_TOKEN=XYZ npm run create-fixture -- 43164
 */

async function testFixture(dir: string) {
    // _foo.json are input files, except for Date.now from derived.json
    const responsePath = join(dir, "_response.json");
    const filesPath = join(dir, "_files.json");
    const downloadsPath = join(dir, "_downloads.json");
    const derivedPath = join(dir, "derived.json");
    const resultPath = join(dir, "result.json");
    const mutationsPath = join(dir, "mutations.json");

    const readJSON = (file: string) => JSON.parse(readFileSync(file, "utf8"));
    const JSONString = (value: any) => scrubDiagnosticDetails(JSON.stringify(value, null, "  "));

    const response = readJSON(responsePath);
    const files = readJSON(filesPath);
    const downloads = readJSON(downloadsPath);

    const derived = await deriveStateForPR(
        response,
        (expr: string) => Promise.resolve(files[expr] as string),
        (name: string) => name in downloads ? downloads[name] : 0,
        () => new Date(readJSON(derivedPath).now)
    );

    // if (derived.type === "fail") throw new Error("Should never happen");

    if (derived.type === "fail") {
        return; 
    }

    const action = process(derived);

    expect(JSONString(action)).toMatchFile(resultPath);
    expect(JSONString(derived)).toMatchFile(derivedPath);

    const mutations = await executePrActions(action, response.data, /*dry*/ true);
    expect(JSONString(mutations.map(m => JSON.parse(m)))).toMatchFile(mutationsPath);
}

describe("Test fixtures", () => {
    const fixturesFolder = join(__dirname, "fixtures");
    readdirSync(fixturesFolder).forEach(fixtureName => {
        const fixture = join(fixturesFolder, fixtureName);
        if (lstatSync(fixture).isDirectory()) {
            it(`Fixture: ${fixtureName}`, async () => testFixture(fixture));
        }
    });
});
