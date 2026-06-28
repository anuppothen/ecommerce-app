'use strict';

exports.config = {
  app_name: ['Ecommerce - Product Service'],
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
    record_sql: 'obfuscated',
  },

  slow_sql: {
    enabled: true,
  },
};