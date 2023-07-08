/* eslint max-len: "off" */

const NODE_ENV = process.env.NODE_ENV || 'dev';
const inspect = NODE_ENV === 'dev' ? ' --inspect' : '';

const config = {
  apps: [
    {
      name: `ac-communityTool-${NODE_ENV}`,
      script: 'src/app.js',
      node_args: `--max_old_space_size=4096 --trace-deprecation --trace-warnings${inspect}`,
      watch: ['src/**/*.js', 'loaders/**/*.js', 'src/config'],
      ignore_watch: ['node_modules', '*.log'],
      merge_logs: true,
    },
  ]
};

module.exports = config;
