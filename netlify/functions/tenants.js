/**
 * Netlify Function: Tenant Management
 * Serverless tenant management API
 */

import { TenantManager } from '../../src/server/tenant-manager.js';
import { WhiteLabelService } from '../../src/server/white-label-service.js';

// Initialize services (singleton for serverless)
let tenantManager, whiteLabelService;

function initializeServices() {
  if (!tenantManager) {
    tenantManager = new TenantManager();
    whiteLabelService = new WhiteLabelService();
  }
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    initializeServices();

    const path = event.path.replace('/.netlify/functions/tenants', '');
    const method = event.httpMethod;
    const pathParts = path.split('/').filter(part => part);

    // GET /api/tenants - List all tenants
    if (method === 'GET' && pathParts.length === 0) {
      const tenants = tenantManager.getAllTenants().map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        active: tenant.active,
        features: tenant.features,
        createdAt: tenant.createdAt
      }));
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          tenants, 
          stats: tenantManager.getTenantStats(),
          platform: 'Netlify Functions'
        })
      };
    }

    // GET /api/tenants/:id - Get specific tenant
    if (method === 'GET' && pathParts.length === 1) {
      const tenantId = pathParts[0];
      const tenant = tenantManager.getTenant(tenantId);
      
      if (!tenant) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: `Tenant ${tenantId} not found` })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tenant)
      };
    }

    // POST /api/tenants - Create new tenant
    if (method === 'POST' && pathParts.length === 0) {
      const tenantData = JSON.parse(event.body);
      
      try {
        const result = await whiteLabelService.createTenant(tenantData);
        
        return {
          statusCode: 201,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
    }

    // PUT /api/tenants/:id - Update tenant
    if (method === 'PUT' && pathParts.length === 1) {
      const tenantId = pathParts[0];
      const updates = JSON.parse(event.body);
      
      try {
        const updated = await whiteLabelService.updateTenant(tenantId, updates);
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updated)
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
    }

    // DELETE /api/tenants/:id - Delete tenant
    if (method === 'DELETE' && pathParts.length === 1) {
      const tenantId = pathParts[0];
      
      try {
        await whiteLabelService.deleteTenant(tenantId);
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ success: true })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
    }

    // Route not found
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Route not found',
        path: event.path,
        method: event.httpMethod
      })
    };

  } catch (error) {
    console.error('Tenants Function Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
