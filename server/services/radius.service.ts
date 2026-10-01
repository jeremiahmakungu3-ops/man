import { Voucher, PackagePlan, Customer, RadiusSession } from '../../src/types/index.ts';

export interface RadCheckRecord {
  id?: number;
  username: string;
  attribute: string;
  op: string; // ':=', '==', '+=', etc.
  value: string;
}

export interface RadReplyRecord {
  id?: number;
  username: string;
  attribute: string;
  op: string; // ':=', '+=', '='
  value: string;
}

export class RadiusService {
  /**
   * Translates an XCLOUD Package plan into FreeRADIUS radreply attributes
   * such as Mikrotik-Rate-Limit ("5M/10M"), Session-Timeout, and data quota
   */
  generatePackageReplyAttributes(plan: PackagePlan): RadReplyRecord[] {
    const replies: RadReplyRecord[] = [];

    // MikroTik Rate Limit: rx/tx in kbps or Mbps
    const rateLimit = `${plan.uploadSpeedKbps}k/${plan.downloadSpeedKbps}k`;
    replies.push({
      username: '',
      attribute: 'Mikrotik-Rate-Limit',
      op: ':=',
      value: rateLimit,
    });

    if (plan.durationMinutes > 0) {
      replies.push({
        username: '',
        attribute: 'Session-Timeout',
        op: ':=',
        value: (plan.durationMinutes * 60).toString(),
      });
    }

    if (plan.dataLimitMb > 0) {
      const bytes = plan.dataLimitMb * 1024 * 1024;
      replies.push({
        username: '',
        attribute: 'Mikrotik-Total-Limit',
        op: ':=',
        value: bytes.toString(),
      });
    }

    if (plan.deviceLimit > 0) {
      replies.push({
        username: '',
        attribute: 'Simultaneous-Use',
        op: ':=',
        value: plan.deviceLimit.toString(),
      });
    }

    return replies;
  }

  /**
   * Generates RADIUS records for a newly created or redeemed voucher
   */
  generateVoucherRadiusRecords(voucher: Voucher): { check: RadCheckRecord[]; reply: RadReplyRecord[] } {
    const check: RadCheckRecord[] = [
      {
        username: voucher.code,
        attribute: 'Cleartext-Password',
        op: ':=',
        value: voucher.pin || voucher.code,
      },
    ];

    const rateLimit = `${voucher.uploadSpeedKbps}k/${voucher.downloadSpeedKbps}k`;
    const reply: RadReplyRecord[] = [
      {
        username: voucher.code,
        attribute: 'Mikrotik-Rate-Limit',
        op: ':=',
        value: rateLimit,
      },
      {
        username: voucher.code,
        attribute: 'Session-Timeout',
        op: ':=',
        value: (voucher.durationMinutes * 60).toString(),
      },
    ];

    if (voucher.dataLimitMb > 0) {
      reply.push({
        username: voucher.code,
        attribute: 'Mikrotik-Total-Limit',
        op: ':=',
        value: (voucher.dataLimitMb * 1024 * 1024).toString(),
      });
    }

    return { check, reply };
  }

  /**
   * Generates FreeRADIUS SQL commands to populate `nas` and `radcheck` in PostgreSQL
   */
  generateSqlInsertForNas(nasIp: string, shortname: string, secret: string): string {
    return `INSERT INTO nas (nasname, shortname, type, secret, description) ` +
           `VALUES ('${nasIp}', '${shortname}', 'other', '${secret}', 'XCLOUD Managed NAS') ` +
           `ON CONFLICT (nasname) DO UPDATE SET secret = EXCLUDED.secret;`;
  }
}
