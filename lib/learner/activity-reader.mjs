import twilio from 'twilio';

/** A learner-scoped capability with no write methods; the transport also rejects writes. */
export function createActivityReader(config, learnerId, clientFactory = twilio) {
  if (!/^[0-9a-f]{40}$/.test(learnerId)) throw new Error('invalid_learner');
  const client = clientFactory(config.keySid, config.keySecret, { accountSid: config.accountSid, logLevel: 'silent', timeout: 5000 });
  const request = client.request.bind(client);
  client.request = options => {
    if (String(options.method).toUpperCase() !== 'GET') throw new Error('read_only_transport');
    return request(options);
  };
  const service = client.sync.v1.services(config.syncServiceSid);
  const collection = service.syncMaps(`learner-${learnerId}`).syncMapItems;
  return {
    async head() {
      try {
        const item = await collection('progress-head').fetch();
        if (typeof item.revision !== 'string' || !item.revision) throw new Error('invalid_revision');
        return { revision: item.revision };
      } catch (error) {
        if (error?.status === 404) return null;
        throw error;
      }
    },
    async list() {
      let page;
      try { page = await collection.page({ pageSize: 100 }); }
      catch (error) {
        if (error?.status !== 404) throw error;
        // A missing learner map is empty; a missing/misconfigured Sync service
        // is an upstream failure and must not look like an empty history.
        await service.fetch();
        return [];
      }
      const items = page.instances.map(item => ({ key: item.key, data: item.data, revision: item.revision }));
      while (page.nextPageUrl) {
        page = await collection.getPage(page.nextPageUrl);
        items.push(...page.instances.map(item => ({ key: item.key, data: item.data, revision: item.revision })));
      }
      return items;
    },
  };
}

/** Retirements can overlap pagination; retry only when the authoritative head changed. */
export async function readConsistentActivity(reader, analyze) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const before = await reader.head();
    const items = await reader.list();
    const after = await reader.head();
    if (before?.revision !== after?.revision) continue;
    const heads = items.filter(item => item.key === 'progress-head');
    if (heads.length > 1 || (before && (heads.length !== 1 || heads[0].revision !== before.revision)) || (!before && heads.length)) {
      // An unchanged head with missing data is corruption; never fall back to legacy.
      if ((await reader.head())?.revision !== before?.revision) continue;
      throw new Error('invalid_progress_snapshot');
    }
    try { return analyze(items); }
    catch (error) {
      if ((await reader.head())?.revision !== before?.revision) continue;
      throw error;
    }
  }
  throw new Error('progress_conflict');
}
