/**
 * Enterprise Database Layer
 * 
 * Handles plugin mappings, dry-run results, and audit trails
 * with enterprise-grade reliability and security.
 */

// Mock PostgreSQL for testing/development
const mockPool = {
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
}

// Dynamic import for PostgreSQL in production, mock for testing
let Pool: any
let pool: any = null
let useInMemory = false

try {
  if (process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL) {
    Pool = require('pg').Pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  } else {
    pool = mockPool
    useInMemory = true
    console.log('⚠️  Using in-memory storage for testing/development')
  }
} catch (error) {
  pool = mockPool
  useInMemory = true
  console.log('⚠️  Database connection failed, using in-memory storage:', error)
}

// In-memory storage for development/fallback
const inMemoryStorage = {
  pluginMappings: new Map<string, PluginMapping>(),
  scanResults: new Map<string, PluginScanResult>(),
  dryRunResults: new Map<string, DryRunResult>(),
}

// Plugin compatibility status enum
export enum PluginCompatibilityStatus {
  COMPATIBLE = 'compatible',
  PARTIAL = 'partial',
  UNSUPPORTED = 'unsupported',
  UNKNOWN = 'unknown'
}

// Dry-run status enum
export enum DryRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Plugin mapping interface
export interface PluginMapping {
  id: string
  jenkins_plugin: string
  plugin_version?: string
  gitlab_equivalent?: string
  compatibility_status: PluginCompatibilityStatus
  migration_notes: string
  documentation_url?: string
  workaround_required: boolean
  criticality_level: 'critical' | 'important' | 'nice_to_have'
  last_updated: Date
  verified_by: string
}

// Dry-run result interface
export interface DryRunResult {
  id: string
  project_id: string
  pipeline_id: string
  jenkins_content: string
  gitlab_yaml: string
  status: DryRunStatus
  started_at: Date
  completed_at?: Date
  total_jobs: number
  passed_jobs: number
  failed_jobs: number
  warnings: string[]
  logs: JobLog[]
  manual_steps: string[]
  created_by: string
}

// Job log interface
export interface JobLog {
  job_name: string
  status: 'success' | 'failed' | 'skipped'
  duration: number
  log_content: string
  error_message?: string
  warnings: string[]
}

// Plugin scan result interface
export interface PluginScanResult {
  id: string
  project_id: string
  jenkins_content: string
  scanned_at: Date
  total_plugins: number
  compatible_plugins: number
  partial_plugins: number
  unsupported_plugins: number
  blocking_issues: number
  plugins: ScannedPlugin[]
  ai_recommendations: string[]
  created_by: string
}

// Scanned plugin interface
export interface ScannedPlugin {
  plugin_name: string
  plugin_version?: string
  usage_context: string
  line_number: number
  compatibility_status: PluginCompatibilityStatus
  gitlab_equivalent?: string
  migration_notes: string
  is_blocking: boolean
  workaround_available: boolean
  documentation_url?: string
}

/**
 * Initialize database tables with enterprise schema
 */
export async function initializeDatabase(): Promise<void> {
  if (useInMemory || !pool) {
    console.log('📦 Using in-memory storage - skipping database initialization')
    return
  }
  
  const client = await pool.connect()
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    // Plugin mappings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plugin_mappings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        jenkins_plugin VARCHAR(255) NOT NULL,
        plugin_version VARCHAR(100),
        gitlab_equivalent TEXT,
        compatibility_status VARCHAR(50) NOT NULL,
        migration_notes TEXT NOT NULL,
        documentation_url TEXT,
        workaround_required BOOLEAN DEFAULT false,
        criticality_level VARCHAR(50) DEFAULT 'nice_to_have',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_by VARCHAR(255) NOT NULL,
        UNIQUE(jenkins_plugin, plugin_version)
      )
    `)
    
    // Plugin scan results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plugin_scan_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id VARCHAR(255) NOT NULL,
        jenkins_content TEXT NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_plugins INTEGER DEFAULT 0,
        compatible_plugins INTEGER DEFAULT 0,
        partial_plugins INTEGER DEFAULT 0,
        unsupported_plugins INTEGER DEFAULT 0,
        blocking_issues INTEGER DEFAULT 0,
        ai_recommendations JSONB DEFAULT '[]',
        created_by VARCHAR(255) NOT NULL
      )
    `)
    
    // Scanned plugins table (detailed plugin results)
    await client.query(`
      CREATE TABLE IF NOT EXISTS scanned_plugins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scan_id UUID REFERENCES plugin_scan_results(id) ON DELETE CASCADE,
        plugin_name VARCHAR(255) NOT NULL,
        plugin_version VARCHAR(100),
        usage_context TEXT,
        line_number INTEGER,
        compatibility_status VARCHAR(50) NOT NULL,
        gitlab_equivalent TEXT,
        migration_notes TEXT,
        is_blocking BOOLEAN DEFAULT false,
        workaround_available BOOLEAN DEFAULT false,
        documentation_url TEXT
      )
    `)
    
    // Dry-run results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dry_run_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id VARCHAR(255) NOT NULL,
        pipeline_id VARCHAR(255),
        jenkins_content TEXT NOT NULL,
        gitlab_yaml TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        total_jobs INTEGER DEFAULT 0,
        passed_jobs INTEGER DEFAULT 0,
        failed_jobs INTEGER DEFAULT 0,
        warnings JSONB DEFAULT '[]',
        manual_steps JSONB DEFAULT '[]',
        created_by VARCHAR(255) NOT NULL
      )
    `)
    
    // Job logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dry_run_id UUID REFERENCES dry_run_results(id) ON DELETE CASCADE,
        job_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        duration INTEGER DEFAULT 0,
        log_content TEXT,
        error_message TEXT,
        warnings JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Audit trail table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_plugin_mappings_jenkins_plugin ON plugin_mappings(jenkins_plugin)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_plugin_scan_results_project_id ON plugin_scan_results(project_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_dry_run_results_project_id ON dry_run_results(project_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at)')
    
    console.log('✅ Database initialized successfully')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Database access layer with enterprise patterns
 */
export class DatabaseService {
  /**
   * Get plugin mapping by Jenkins plugin name
   */
  static async getPluginMapping(jenkinsPlugin: string, version?: string): Promise<PluginMapping | null> {
    if (useInMemory || !pool) {
      // Use in-memory storage
      const key = version ? `${jenkinsPlugin}:${version}` : jenkinsPlugin
      return inMemoryStorage.pluginMappings.get(key) || null
    }
    
    const client = await pool.connect()
    try {
      const query = version 
        ? 'SELECT * FROM plugin_mappings WHERE jenkins_plugin = $1 AND plugin_version = $2'
        : 'SELECT * FROM plugin_mappings WHERE jenkins_plugin = $1'
      const values = version ? [jenkinsPlugin, version] : [jenkinsPlugin]
      
      const result = await client.query(query, values)
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }
  
  /**
   * Save plugin scan results
   */
  static async savePluginScanResult(scanResult: Omit<PluginScanResult, 'id' | 'scanned_at'>): Promise<string> {
    if (useInMemory || !pool) {
      // Use in-memory storage
      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const fullScanResult: PluginScanResult = {
        ...scanResult,
        id: scanId,
        scanned_at: new Date()
      }
      inMemoryStorage.scanResults.set(scanId, fullScanResult)
      return scanId
    }
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // Insert main scan result
      const scanQuery = `
        INSERT INTO plugin_scan_results 
        (project_id, jenkins_content, total_plugins, compatible_plugins, partial_plugins, 
         unsupported_plugins, blocking_issues, ai_recommendations, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `
      const scanValues = [
        scanResult.project_id,
        scanResult.jenkins_content,
        scanResult.total_plugins,
        scanResult.compatible_plugins,
        scanResult.partial_plugins,
        scanResult.unsupported_plugins,
        scanResult.blocking_issues,
        JSON.stringify(scanResult.ai_recommendations),
        scanResult.created_by
      ]
      
      const scanResultDb = await client.query(scanQuery, scanValues)
      const scanId = scanResultDb.rows[0].id
      
      // Insert individual plugin results
      for (const plugin of scanResult.plugins) {
        const pluginQuery = `
          INSERT INTO scanned_plugins 
          (scan_id, plugin_name, plugin_version, usage_context, line_number, 
           compatibility_status, gitlab_equivalent, migration_notes, is_blocking, 
           workaround_available, documentation_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `
        const pluginValues = [
          scanId,
          plugin.plugin_name,
          plugin.plugin_version,
          plugin.usage_context,
          plugin.line_number,
          plugin.compatibility_status,
          plugin.gitlab_equivalent,
          plugin.migration_notes,
          plugin.is_blocking,
          plugin.workaround_available,
          plugin.documentation_url
        ]
        
        await client.query(pluginQuery, pluginValues)
      }
      
      await client.query('COMMIT')
      return scanId
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  /**
   * Save dry-run result
   */
  static async saveDryRunResult(dryRunResult: Omit<DryRunResult, 'id' | 'started_at'>): Promise<string> {
    if (useInMemory || !pool) {
      // Use in-memory storage
      const dryRunId = `dryrun_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const fullDryRunResult: DryRunResult = {
        ...dryRunResult,
        id: dryRunId,
        started_at: new Date()
      }
      inMemoryStorage.dryRunResults.set(dryRunId, fullDryRunResult)
      return dryRunId
    }
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      const query = `
        INSERT INTO dry_run_results 
        (project_id, pipeline_id, jenkins_content, gitlab_yaml, status, completed_at,
         total_jobs, passed_jobs, failed_jobs, warnings, manual_steps, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `
      const values = [
        dryRunResult.project_id,
        dryRunResult.pipeline_id,
        dryRunResult.jenkins_content,
        dryRunResult.gitlab_yaml,
        dryRunResult.status,
        dryRunResult.completed_at,
        dryRunResult.total_jobs,
        dryRunResult.passed_jobs,
        dryRunResult.failed_jobs,
        JSON.stringify(dryRunResult.warnings),
        JSON.stringify(dryRunResult.manual_steps),
        dryRunResult.created_by
      ]
      
      const result = await client.query(query, values)
      const dryRunId = result.rows[0].id
      
      // Insert job logs
      for (const log of dryRunResult.logs) {
        const logQuery = `
          INSERT INTO job_logs (dry_run_id, job_name, status, duration, log_content, error_message, warnings)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `
        const logValues = [
          dryRunId,
          log.job_name,
          log.status,
          log.duration,
          log.log_content,
          log.error_message,
          JSON.stringify(log.warnings)
        ]
        
        await client.query(logQuery, logValues)
      }
      
      await client.query('COMMIT')
      return dryRunId
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  /**
   * Get recent plugin scan results for a project
   */
  static async getPluginScanResults(projectId: string, limit = 10): Promise<PluginScanResult[]> {
    if (useInMemory || !pool) {
      // Use in-memory storage
      const results = Array.from(inMemoryStorage.scanResults.values())
        .filter(result => result.project_id === projectId)
        .sort((a, b) => b.scanned_at.getTime() - a.scanned_at.getTime())
        .slice(0, limit)
      return results
    }
    
    const client = await pool.connect()
    try {
      const query = `
        SELECT psr.*, 
               COALESCE(sp_data.plugins, '[]') as plugins
        FROM plugin_scan_results psr
        LEFT JOIN (
          SELECT scan_id, 
                 json_agg(json_build_object(
                   'plugin_name', plugin_name,
                   'plugin_version', plugin_version,
                   'usage_context', usage_context,
                   'line_number', line_number,
                   'compatibility_status', compatibility_status,
                   'gitlab_equivalent', gitlab_equivalent,
                   'migration_notes', migration_notes,
                   'is_blocking', is_blocking,
                   'workaround_available', workaround_available,
                   'documentation_url', documentation_url
                 )) as plugins
          FROM scanned_plugins 
          GROUP BY scan_id
        ) sp_data ON psr.id = sp_data.scan_id
        WHERE psr.project_id = $1
        ORDER BY psr.scanned_at DESC
        LIMIT $2
      `
      
      const result = await client.query(query, [projectId, limit])
      return result.rows.map((row: any) => ({
        ...row,
        plugins: JSON.parse(row.plugins || '[]'),
        ai_recommendations: JSON.parse(row.ai_recommendations || '[]')
      }))
    } finally {
      client.release()
    }
  }
  
  /**
   * Log audit trail entry
   */
  static async logAuditTrail(
    action: string,
    resourceType: string,
    resourceId: string,
    userId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (useInMemory || !pool) {
      // For in-memory mode, just log to console
      console.log(`🔒 Audit: ${action} on ${resourceType}:${resourceId} by ${userId}`)
      return
    }
    
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO audit_trail (action, resource_type, resource_id, user_id, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      const values = [action, resourceType, resourceId, userId, JSON.stringify(details), ipAddress, userAgent]
      await client.query(query, values)
    } finally {
      client.release()
    }
  }
}

export default DatabaseService