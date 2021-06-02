import { Probot } from 'probot';
import { readFileSync } from 'fs';
import { join } from 'path';

export = (app: Probot) => {
  app.log('Yay! The app was loaded!');

  app.on('issues.opened', async (context) => {
    const issueComment = context.issue({
      body: 'Thanks for opening this issue!'
    });
    await context.octokit.issues.createComment(issueComment);
  });

  app.on('installation.created', async (context) => {
    const owner = context.payload.installation.account.login;
    for (const repository of context.payload.repositories) {
      const repo = repository.name;
      const branch = `new-branch-${Math.floor(Math.random() * 9999)}`;

      const reference = await context.octokit.git.getRef({
        repo,
        owner,
        ref: 'heads/master'
      });

      await context.octokit.git.createRef({
        repo,
        owner,
        ref: `refs/heads/${branch}`,
        sha: reference.data.object.sha
      });

      await context.octokit.repos.createOrUpdateFileContents({
        repo,
        owner,
        path: '.github/maintainer.json',
        message: 'adds config file',
        content: readFileSync(
          join(__dirname, './config/maintainer.json')
        ).toString('base64'),
        branch
      });

      await context.octokit.pulls.create({
        repo,
        owner,
        title: 'Configure Maintainer Bot',
        head: branch,
        base: 'master',
        body: 'Adds my new file!',
        maintainer_can_modify: true
      });
    }
  });
};
