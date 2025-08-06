/**
 * Performance Optimizer
 * Smart caching, memoization, and performance monitoring
 */

// Intelligent memoization cache
class SmartCache<K, V> {
  private cache = new Map<string, { value: V; timestamp: number; accessCount: number }>()
  private maxSize: number
  private ttl: number
  
  constructor(maxSize = 1000, ttlMs = 300000) { // 5 minute TTL
    this.maxSize = maxSize
    this.ttl = ttlMs
  }
  
  get(key: K): V | undefined {
    const keyStr = JSON.stringify(key)
    const entry = this.cache.get(keyStr)
    
    if (!entry) return undefined
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(keyStr)
      return undefined
    }
    
    // Update access count and timestamp
    entry.accessCount++
    entry.timestamp = Date.now()
    
    return entry.value
  }
  
  set(key: K, value: V): void {
    const keyStr = JSON.stringify(key)
    
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }
    
    this.cache.set(keyStr, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    })
  }
  
  private evictLeastUsed(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    let leastUsedKey = ''
    let leastAccess = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
      if (entry.accessCount < leastAccess) {
        leastAccess = entry.accessCount
        leastUsedKey = key
      }
    }
    
    // Remove the least accessed item, or oldest if tie
    const keyToRemove = leastAccess < 5 ? leastUsedKey : oldestKey
    this.cache.delete(keyToRemove)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

// Performance monitoring
class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics = new Map<string, { count: number; totalTime: number; maxTime: number; minTime: number }>()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startTimer(operation: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(operation, duration)
    }
  }
  
  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.minTime = Math.min(existing.minTime, duration)
    } else {
      this.metrics.set(operation, {
        count: 1,
        totalTime: duration,
        maxTime: duration,
        minTime: duration
      })
    }
  }
  
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [operation, metric] of this.metrics.entries()) {
      result[operation] = {
        calls: metric.count,
        avgTime: metric.totalTime / metric.count,
        maxTime: metric.maxTime,
        minTime: metric.minTime,
        totalTime: metric.totalTime
      }
    }
    
    return result
  }
  
  reset(): void {
    this.metrics.clear()
  }
}

// Memoization decorator for expensive operations
function memoize<T extends (...args: any[]) => any>(fn: T, cache?: SmartCache<Parameters<T>, ReturnType<T>>): T {
  const memoCache = cache || new SmartCache<Parameters<T>, ReturnType<T>>()
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const cached = memoCache.get(args)
    if (cached !== undefined) {
      return cached
    }
    
    const result = fn(...args)
    memoCache.set(args, result)
    return result
  }) as T
}

// Performance-optimized utility functions
export class PerformanceOptimizer {
  private static regexCache = new SmartCache<string, RegExp>()
  private static parseCache = new SmartCache<string, any>()
  private static monitor = PerformanceMonitor.getInstance()
  
  /**
   * Cached regex compilation for better performance
   */
  static getCachedRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}::${flags || ''}`
    const cached = this.regexCache.get(key)
    
    if (cached) return cached
    
    const regex = new RegExp(pattern, flags)
    this.regexCache.set(key, regex)
    return regex
  }
  
  /**
   * Fast Jenkins file parsing with intelligent caching
   */
  static parseJenkinsfile = memoize((content: string): any => {
    const endTimer = this.monitor.startTimer('parseJenkinsfile')
    
    try {
      // Optimized parsing using cached regexes
      const stageRegex = this.getCachedRegex(/stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{/g.source, 'g')
      const envRegex = this.getCachedRegex(/environment\s*\{([\s\S]*?)\}/g.source, 'g')
      const stepRegex = this.getCachedRegex(/steps\s*\{([\s\S]*?)\}/g.source, 'g')
      
      const result = {
        stages: [] as Array<{name: string, index: number}>,
        environment: {} as Record<string, string>,
        plugins: [] as string[],
        isDeclarative: content.includes('pipeline {'),
        isScripted: content.includes('node {') || content.includes('node('),
        lineCount: content.split('\n').length
      }
      
      // Extract stages efficiently
      let match
      while ((match = stageRegex.exec(content)) !== null) {
        result.stages.push({
          name: match[1],
          index: match.index
        })
      }
      
      // Extract environment variables
      const envMatch = envRegex.exec(content)
      if (envMatch) {
        const envContent = envMatch[1]
        const varRegex = this.getCachedRegex(/(\w+)\s*=\s*['"]([^'"]+)['"]/g.source, 'g')
        let varMatch
        while ((varMatch = varRegex.exec(envContent)) !== null) {
          result.environment[varMatch[1]] = varMatch[2]
        }
      }
      
      return result
    } finally {
      endTimer()
    }
  })
  
  /**
   * Batch process multiple operations efficiently
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 10,
    concurrency = 3
  ): Promise<R[]> {
    const endTimer = this.monitor.startTimer('batchProcess')
    const results: R[] = []
    
    try {
      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        
        // Process batch with limited concurrency
        const batchPromises = batch.map(async (item) => processor(item))
        const semaphore = new Array(Math.min(concurrency, batch.length)).fill(null)
        
        const batchResults = await Promise.all(
          semaphore.map(async (_, index) => {
            const promises: Promise<R>[] = []
            for (let j = index; j < batchPromises.length; j += concurrency) {
              promises.push(batchPromises[j])
            }
            return Promise.all(promises)
          })
        )
        
        results.push(...batchResults.flat())
      }
      
      return results
    } finally {
      endTimer()
    }
  }
  
  /**
   * Debounced function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }
  
  /**
   * Throttled function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  /**
   * Memory-efficient string processing
   */
  static processLargeString(
    content: string,
    processor: (chunk: string, index: number) => void,
    chunkSize = 10000
  ): void {
    const endTimer = this.monitor.startTimer('processLargeString')
    
    try {
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize)
        processor(chunk, Math.floor(i / chunkSize))
      }
    } finally {
      endTimer()
    }
  }
  
  /**
   * Smart array operations with early exit conditions
   */
  static smartFind<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    maxChecks?: number
  ): T | undefined {
    const limit = maxChecks || array.length
    
    for (let i = 0; i < Math.min(array.length, limit); i++) {
      if (predicate(array[i], i)) {
        return array[i]
      }
    }
    
    return undefined
  }
  
  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): Record<string, any> {
    return {
      ...this.monitor.getMetrics(),
      cacheStats: {
        regexCacheSize: this.regexCache.size(),
        parseCacheSize: this.parseCache.size()
      },
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null
    }
  }
  
  /**
   * Clear all caches and reset metrics
   */
  static clearCaches(): void {
    this.regexCache.clear()
    this.parseCache.clear()
    this.monitor.reset()
  }
  
  /**
   * Optimize object operations
   */
  static fastClone<T>(obj: T): T {
    // Fast cloning for simple objects
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as any
    if (Array.isArray(obj)) return obj.map(item => this.fastClone(item)) as any
    
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.fastClone(obj[key])
      }
    }
    
    return cloned
  }
  
  /**
   * Memory-efficient object merging
   */
  static smartMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    for (const source of sources) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const value = source[key]
          if (value !== undefined) {
            (target as any)[key] = value
          }
        }
      }
    }
    return target
  }
}

// Optimized Jenkins plugin detection
export class OptimizedPluginScanner {
  private static pluginCache = new SmartCache<string, any[]>()
  
  /**
   * High-performance plugin scanning with smart caching
   */
  static scanPlugins = memoize((content: string): any[] => {
    const endTimer = PerformanceMonitor.getInstance().startTimer('scanPlugins')
    
    try {
      const plugins: any[] = []
      const pluginPatterns = [
        { key: 'maven-integration', regex: PerformanceOptimizer.getCachedRegex('maven|mvn', 'i') },
        { key: 'gradle', regex: PerformanceOptimizer.getCachedRegex('gradle', 'i') },
        { key: 'docker-workflow', regex: PerformanceOptimizer.getCachedRegex('docker', 'i') },
        { key: 'git', regex: PerformanceOptimizer.getCachedRegex('\\bgit\\b', 'i') },
        { key: 'junit', regex: PerformanceOptimizer.getCachedRegex('junit|publishTestResults', 'i') },
        { key: 'nodejs', regex: PerformanceOptimizer.getCachedRegex('node|npm|yarn', 'i') },
        { key: 'sonarqube', regex: PerformanceOptimizer.getCachedRegex('sonar', 'i') }
      ]
      
      // Process in chunks for large files
      PerformanceOptimizer.processLargeString(content, (chunk) => {
        pluginPatterns.forEach(pattern => {
          if (pattern.regex.test(chunk)) {
            if (!plugins.find(p => p.key === pattern.key)) {
              plugins.push({
                key: pattern.key,
                name: pattern.key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: pattern.key.includes('test') ? 'testing' : 'build'
              })
            }
          }
        })
      })
      
      return plugins
    } finally {
      endTimer()
    }
  })
}

// Export optimized functions
export {
  SmartCache,
  PerformanceMonitor,
  memoize
}