
// import datadog from 'datadog-metrics';
// import ddtrace from 'dd-trace';

// import version from '../utils/version';

// const Sentry = require('@sentry/node');

// let cpuUsage = process.cpuUsage();

// function collectMemoryStats() {
//   const memUsage = process.memoryUsage();
//   datadog.gauge('memory.rss', memUsage.rss);
//   datadog.gauge('memory.heapTotal', memUsage.heapTotal);
//   datadog.gauge('memory.heapUsed', memUsage.heapUsed);

//   cpuUsage = process.cpuUsage(cpuUsage);
//   datadog.gauge('cpu.system', cpuUsage.system);
//   datadog.gauge('cpu.user', cpuUsage.user);
// }

// we still want prod to work locally so disable if no keys exist
if (
  process.env.NODE_ENV === 'production' &&
  process.env.SENTRY_DSN &&
  process.env.DD_API_KEY
) {
  // Sentry.init({ dsn: process.env.SENTRY_DSN, release: version() });
  // datadog.init({ apiKey: process.env.DD_API_KEY, host: process.env.HOST, prefix: 'storyforj.' });
  // const tracer = ddtrace.init({
  //   plugins: false,
  //   env: process.env.ENV_NAME,
  //   hostname: process.env.HOST,
  //   service: 'storyforj',
  // });
  // tracer.use('koa');
  // tracer.use('graphql');
  // tracer.use('pg');
  // setInterval(collectMemoryStats, 5000);
}

export default (_err, _ctx) => {
  // Sentry.captureException(err, { req: ctx.request });
};
