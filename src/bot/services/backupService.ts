import { env } from "@/config/env";
import { Logger } from "@/utils/logger";

interface BackupResult {
  success: boolean;
  data?: string;
  error?: string;
}

export class BackupService {
  /**
   * Create a database backup using pg_dump
   * This requires pg_dump to be installed on the system
   */
  async createBackup(): Promise<BackupResult> {
    try {
      // Parse DATABASE_URL to extract connection details
      const dbUrl = new URL(env.DATABASE_URL);
      const host = dbUrl.hostname;
      const port = dbUrl.port || "5432";
      const database = dbUrl.pathname.slice(1); // Remove leading slash
      const user = dbUrl.username;
      const password = dbUrl.password;

      // Set PGPASSWORD environment variable for pg_dump
      process.env.PGPASSWORD = password;

      // Execute pg_dump command
      const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-acl --format=plain`;

      const proc = Bun.spawn(["sh", "-c", command], {
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      // Clear PGPASSWORD after use
      delete process.env.PGPASSWORD;

      if (exitCode !== 0) {
        Logger.error("pg_dump failed", { stderr, exitCode });
        return {
          success: false,
          error: `Backup failed: ${stderr}`,
        };
      }

      return {
        success: true,
        data: stdout,
      };
    } catch (error) {
      Logger.error("Error creating backup", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a backup using SQL queries (alternative method)
   * This doesn't require pg_dump but may not capture all database objects
   */
  async createSqlBackup(): Promise<BackupResult> {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(env.DATABASE_URL);

      // Get all table names
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;

      let backupSql = "-- Database Backup\n";
      backupSql += `-- Generated at: ${new Date().toISOString()}\n\n`;

      // For each table, get its data
      for (const table of tables) {
        const tableName = table.table_name;
        backupSql += `-- Table: ${tableName}\n`;

        // Get table structure
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `;

        backupSql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        const columnDefs = columns.map((col: any) => {
          let def = `  ${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        backupSql += columnDefs.join(',\n');
        backupSql += "\n);\n\n";

        // Get table data
        const rows = await sql`SELECT * FROM ${sql.unsafe(tableName)}`;
        
        if (rows.length > 0) {
          const columnsList = columns.map((c: any) => c.column_name).join(', ');
          backupSql += `INSERT INTO ${tableName} (${columnsList}) VALUES\n`;
          
          const values = rows.map((row: any) => {
            const vals = Object.values(row).map((v: any) => {
              if (v === null) return 'NULL';
              if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
              if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
              return v;
            });
            return `  (${vals.join(', ')})`;
          });
          
          backupSql += values.join(',\n');
          backupSql += ";\n\n";
        }
      }

      return {
        success: true,
        data: backupSql,
      };
    } catch (error) {
      Logger.error("Error creating SQL backup", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a backup and save to file
   */
  async createBackupFile(filename?: string): Promise<{ success: boolean; filepath?: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFilename = `backup-${timestamp}.sql`;
      const finalFilename = filename || defaultFilename;
      const filepath = `./data/${finalFilename}`;

      // Try pg_dump first, fall back to SQL backup
      let result = await this.createBackup();
      
      if (!result.success) {
        Logger.warn("pg_dump failed, trying SQL backup method");
        result = await this.createSqlBackup();
      }

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "Failed to create backup",
        };
      }

      // Write backup to file
      await Bun.write(filepath, result.data);

      return {
        success: true,
        filepath,
      };
    } catch (error) {
      Logger.error("Error creating backup file", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const backupService = new BackupService();
