import moment = require('moment');
import express from 'express';
import crypto from 'crypto';

export function noNulls<T>(
    arr: ReadonlyArray<T | null | undefined> | null | undefined
): T[] {
    if (arr == null) return [];
    return arr.filter((arr) => arr != null) as T[];
}

export function notUndefined<T>(arg: T | undefined): arg is T {
    return arg !== undefined;
}

export async function someAsync<T>(
    arr: ReadonlyArray<T>,
    f: (t: T) => Promise<boolean>
): Promise<boolean> {
    for (const x of arr) {
        if (await f(x)) {
            return true;
        }
    }
    return false;
}

export function findLast<T, U extends T>(
    arr: readonly T[] | null | undefined,
    predicate: (item: T) => item is U
): U | undefined;
export function findLast<T>(
    arr: readonly T[] | null | undefined,
    predicate: (item: T) => boolean
): T | undefined;
export function findLast<T>(
    arr: readonly T[] | null | undefined,
    predicate: (item: T) => boolean
): T | undefined {
    if (!arr) {
        return undefined;
    }
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            return arr[i];
        }
    }
    return undefined;
}

export function forEachReverse<T, U>(
    arr: readonly T[] | null | undefined,
    action: (item: T) => U | undefined
): U | undefined {
    if (!arr) {
        return undefined;
    }
    for (let i = arr.length - 1; i >= 0; i--) {
        const result = action(arr[i]);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}

export function daysSince(date: Date, now: Date | string): number {
    return Math.floor(moment(now).diff(moment(date), 'days'));
}

export function authorNotBot(
    node:
        | { login: string }
        | { author?: { login: string } | null }
        | { actor?: { login: string } | null }
): boolean {
    return (
        ('author' in node && node.author!.login !== 'typescript-bot') ||
        ('actor' in node && node.actor!.login !== 'typescript-bot') ||
        ('login' in node && node.login !== 'typescript-bot')
    );
}

export function scrubDiagnosticDetails(s: string): string {
    return s.replace(
        /<details><summary>Diagnostic Information.*?<\/summary>(?:\\n)+```json\\n{.*?\\n}\\n```(?:\\n)+<\/details>/gs,
        '... diagnostics scrubbed ...'
    );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function verifyPostData(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const payload = JSON.stringify(req.body);
    if (!payload) {
        return res.status(204);
    }

    const sig = req.get('X-Hub-Signature') || '';
    const hmac = crypto.createHmac('sha1', process.env.SECRET!);
    const digest = Buffer.from(
        'sha1=' + hmac.update(payload).digest('hex'),
        'utf8'
    );
    const checksum = Buffer.from(sig, 'utf8');
    if (
        checksum.length !== digest.length ||
        !crypto.timingSafeEqual(digest, checksum)
    ) {
        return res
            .status(500)
            .send(`Request body digest did not match X-Hub-Signature`);
    }
    return next();
}
