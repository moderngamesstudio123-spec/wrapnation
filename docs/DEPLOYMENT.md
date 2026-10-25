# Wrap Nation Deployment & Maintenance Guide

## 1. Quick Deploy with Docker Compose
The fastest production deployment method on any Linux VPS (Ubuntu/Debian, AWS EC2, DigitalOcean, Hetzner):

```bash
# 1. Clone repository
git clone <repo_url>
cd "Wrap Nation"

# 2. Configure environment variables
cp .env.example .env
nano .env

# 3. Start PostgreSQL and Next.js Web App in background
docker compose up -d --build

# 4. Run database seed to populate menu and demo credentials
docker compose exec app npm run db:seed
```

---

## 2. Deploying on Railway / Render
1. Create a new PostgreSQL database service on Railway.
2. Link the repository and set the following environment variables:
   - `DATABASE_URL`: Your Railway PostgreSQL connection URL
   - `SESSION_SECRET`: Random 32+ character string
   - `HMAC_SECRET`: Random 32+ character string
   - `PRINTER_AGENT_RAW_KEY`: Long secret token for shop print agent
   - `NEXT_PUBLIC_APP_URL`: Your assigned custom or Railway domain
3. Build command: `npx prisma generate && npm run build`
4. Start command: `npm start`
5. Once deployed, run the seed script from Railway CLI:
   ```bash
   railway run npm run db:seed
   ```

---

## 3. Database Backup & Restore Instructions

### Automated Daily Backup Script (`backup.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wrapnation"
DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Dump database
docker exec -t wrapnation_postgres pg_dump -U wrapnation wrapnation_db > "$BACKUP_DIR/wrapnation_$DATE.sql"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +30 -delete
echo "Backup completed: wrapnation_$DATE.sql"
```

Add to cron (`crontab -e`):
```cron
0 3 * * * /bin/bash /path/to/backup.sh > /var/log/wrapnation_backup.log 2>&1
```

### Database Restore Procedure
```bash
# Stop application to prevent writes
docker compose stop app

# Drop and recreate database
docker exec -it wrapnation_postgres dropdb -U wrapnation wrapnation_db
docker exec -it wrapnation_postgres createdb -U wrapnation wrapnation_db

# Restore from SQL dump file
cat /var/backups/wrapnation/wrapnation_YYYYMMDD_HHMMSS.sql | docker exec -i wrapnation_postgres psql -U wrapnation -d wrapnation_db

# Restart application
docker compose start app
```

---

## 4. Customer Data Retention & PII Cleanup
Run the automated PII purge script every 90 days to comply with Indian data privacy requirements:
```bash
npm run cleanup:pii
```
This script sanitizes customer names, phone numbers, and cooking notes older than 90 days while preserving anonymized financial records for tax and accounting audits.
