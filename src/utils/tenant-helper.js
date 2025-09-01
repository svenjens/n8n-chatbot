/**
 * Tenant Helper Utilities for Multi-Tenant MongoDB Operations
 * Provides consistent tenant handling across all Netlify Functions
 */

import { TenantManager } from '../server/tenant-manager.js';

let tenantManager;

function initializeTenantManager() {
  if (!tenantManager) {
    tenantManager = new TenantManager();
  }
  return tenantManager;
}

/**
 * Extract tenant ID from various sources in Netlify Functions
 */
export function extractTenantId(event) {
  // Priority order: query param, header, body, default
  const tenantId = 
    event.queryStringParameters?.tenantId ||
    event.queryStringParameters?.tenant ||
    event.headers['x-tenant-id'] ||
    event.headers['x-tenant'] ||
    (event.body ? JSON.parse(event.body || '{}').tenantId : null) ||
    'koepel'; // Default fallback

  return tenantId;
}

/**
 * Get tenant configuration by ID
 */
export function getTenantConfig(tenantId) {
  const manager = initializeTenantManager();
  const tenant = manager.getTenant(tenantId);
  
  if (!tenant) {
    console.warn(`Tenant ${tenantId} not found, using default (koepel)`);
    return manager.getTenant('koepel');
  }
  
  return tenant;
}

/**
 * Validate tenant access and permissions
 */
export function validateTenantAccess(tenantId, requiredFeatures = []) {
  const tenant = getTenantConfig(tenantId);
  
  if (!tenant) {
    return { valid: false, error: 'Tenant not found' };
  }
  
  if (!tenant.active) {
    return { valid: false, error: 'Tenant is inactive' };
  }
  
  // Check required features
  for (const feature of requiredFeatures) {
    if (!tenant.features[feature]) {
      return { 
        valid: false, 
        error: `Feature '${feature}' not enabled for tenant ${tenantId}` 
      };
    }
  }
  
  return { valid: true, tenant };
}

/**
 * Build MongoDB query with tenant filtering
 */
export function buildTenantQuery(baseTenantId, additionalFilters = {}) {
  const query = { ...additionalFilters };
  
  // Always filter by tenant unless explicitly requesting 'all'
  if (baseTenantId && baseTenantId !== 'all') {
    query.tenantId = baseTenantId;
  }
  
  return query;
}

/**
 * Build period-based date filter
 */
export function buildPeriodFilter(period = '30d') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }
  
  return { createdAt: { $gte: startDate } };
}

/**
 * Add tenant context to data before storing
 */
export function addTenantContext(data, tenantId, additionalContext = {}) {
  return {
    ...data,
    tenantId: tenantId || 'koepel',
    ...additionalContext,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Get tenant-specific response headers
 */
export function getTenantHeaders(tenantId) {
  const tenant = getTenantConfig(tenantId);
  
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Tenant-Name': tenant?.name || 'Unknown',
    'Cache-Control': 'no-cache'
  };
}

/**
 * Log tenant-specific events
 */
export function logTenantEvent(tenantId, event, data = {}) {
  const tenant = getTenantConfig(tenantId);
  console.log(`[${new Date().toISOString()}] [${tenant?.name || tenantId}] ${event}:`, data);
}

/**
 * Middleware-like function for tenant processing in Netlify Functions
 */
export function processTenantRequest(event, requiredFeatures = []) {
  const tenantId = extractTenantId(event);
  const validation = validateTenantAccess(tenantId, requiredFeatures);
  
  if (!validation.valid) {
    return {
      error: true,
      response: {
        statusCode: 403,
        headers: getTenantHeaders(tenantId),
        body: JSON.stringify({ 
          error: validation.error,
          tenantId 
        })
      }
    };
  }
  
  return {
    error: false,
    tenantId,
    tenant: validation.tenant,
    headers: getTenantHeaders(tenantId)
  };
}

/**
 * Get all active tenant IDs for system-wide operations
 */
export function getActiveTenantIds() {
  const manager = initializeTenantManager();
  return manager.getAllTenants()
    .filter(tenant => tenant.active)
    .map(tenant => tenant.id);
}

/**
 * Aggregate data across multiple tenants
 */
export async function aggregateAcrossTenants(aggregationFn, tenantIds = null) {
  const targetTenants = tenantIds || getActiveTenantIds();
  const results = {};
  
  for (const tenantId of targetTenants) {
    try {
      results[tenantId] = await aggregationFn(tenantId);
    } catch (error) {
      console.error(`Aggregation failed for tenant ${tenantId}:`, error);
      results[tenantId] = null;
    }
  }
  
  return results;
}
