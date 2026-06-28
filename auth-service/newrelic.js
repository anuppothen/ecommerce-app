'use strict';

exports.config = {
  // ── Identity ────────────────────────────────────────────────────
  // This is how the service appears in New Relic APM
  app_name: ['Ecommerce - Auth Service'],

  // License key is loaded from environment variable
  // Never hardcode this in the file
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  // ── Logging ─────────────────────────────────────────────────────
  logging: {
    // New Relic agent's own log level — separate from your app logs
    level: 'info',
    filepath: 'stdout', // Log to console so Docker captures it
  },

  // ── Distributed Tracing ─────────────────────────────────────────
  // Enables following a request across multiple services
  distributed_tracing: {
    enabled: true,
  },

  // ── Application Logging ─────────────────────────────────────────
  // Forwards your Winston logs to New Relic automatically
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
    },
    local_decorating: {
      enabled: false,
    },
  },

  // ── Error Collection ────────────────────────────────────────────
  error_collector: {
    enabled: true,
    ignore_status_codes: [404], // 404s are expected, don't treat as errors
  },

  // ── Transaction Tracing ─────────────────────────────────────────
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f', // Trace slow transactions
    record_sql: 'obfuscated', // Record SQL but hide sensitive values
  },

  // ── Slow SQL ────────────────────────────────────────────────────
  slow_sql: {
    enabled: true,
  },
};