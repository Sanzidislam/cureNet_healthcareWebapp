import db from '../models/index.js';

const { AuditLog } = db;

/**
 * Write an audit log entry. Fire-and-forget; errors are logged but do not throw.
 * @param {{ action: string, userId?: number, entityType?: string, entityId?: string|number, details?: object|string, ip?: string }} opts
 */
export async function logAudit(opts) {
  try {
    const detailsStr =
      typeof opts.details === 'string' ? opts.details : opts.details ? JSON.stringify(opts.details) : null;
    await AuditLog.create({
      action: opts.action,
      userId: opts.userId ?? null,
      entityType: opts.entityType ?? null,
      entityId: opts.entityId != null ? String(opts.entityId) : null,
      details: detailsStr,
      ip: opts.ip ?? null,
    });
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}
