import chalk from 'chalk';
import { chalkPresets } from './utils/chalk-presets';

export const config = Object.assign({}, {
    handlers: ['load-env', 'start-webhook'],
    utils: ['chalk-presets']
});

(async () => {
    const handlers = config.handlers;

    for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        try {
            await require(`./handlers/${handler}`);
        } catch (err) {
            console.error(err);
            console.error(`${chalkPresets.error('Failed')} loading handler ${chalk.bold(handler)}`);
        }
    }
})();
