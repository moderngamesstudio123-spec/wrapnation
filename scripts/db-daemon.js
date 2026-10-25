const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');

const port = parseInt(process.env.DB_PORT || '5433', 10);
const databaseDir = path.resolve(__dirname, '../.pgdata');

const pg = new EmbeddedPostgres({
  port,
  databaseDir,
  user: 'wrapnation',
  password: 'wrapnation_secure_pass',
  initialDatabase: 'wrapnation_db',
  persistent: true
});

async function main() {
  try {
    await pg.initialise();
  } catch (e) {
    // Already initialized
  }
  await pg.start();
  console.log(`[Database] PostgreSQL ready on postgresql://wrapnation:wrapnation_secure_pass@localhost:${port}/wrapnation_db`);

  const shutdown = async () => {
    console.log('[Database] Stopping PostgreSQL...');
    try {
      await pg.stop();
    } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('[Database] Failed to start PostgreSQL:', err);
  process.exit(1);
});
