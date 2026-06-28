'use strict';

exports.config = {
  app_name: ['Ecommerce - Cart Service'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  logging: {
    level: 'info',
    filepath: 'stdout',
  },

  distributed_tracing: {
    enabled: true,
  },

  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
    },
    local_decorating: {
      enabled: false,
    },
  },

  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },

  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
  },

  slow_sql: {
    enabled: false, // Cart uses Redis not SQL
  },
};