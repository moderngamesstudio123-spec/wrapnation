const EmbeddedPostgres = require('embedded-postgres').default;

async function test() {
  console.log('Testing EmbeddedPostgres...');
  const pg = new EmbeddedPostgres({
    port: 5433,
    databaseDir: './.pgdata',
    user: 'wrapnation',
    password: 'wrapnation_secure_pass',
    initialDatabase: 'wrapnation_db',
    persistent: true
  });

  try {
    await pg.initialise();
    console.log('Postgres initialized');
    await pg.start();
    console.log('Postgres started on port 5433');
    await pg.stop();
    console.log('Postgres stopped cleanly');
  } catch (err) {
    console.error('EmbeddedPostgres error:', err);
  }
}

test();
