import * as git from 'git-rev-sync';

const version = (
  process.env.SOURCE_VERSION ||
  process.env.HEROKU_SLUG_COMMIT ||
  process.env.GIT_REV ||
  git.short()
).substr(0, 5);

export default () => version;
