import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

/** Regeln aus `docs/alpha-2/reputation-and-concessions.md`. */
describe('reputation and concession API', () => {
  let app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.close(); app = buildApp(undefined, { enableTestReset: true }); });

  const atLambrecht = () => app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
  const trade = async (cityId: string, goodId: string, direction: 'buy' | 'sell', quantity: number, key: string) => {
    const quote = (await app.inject({ method: 'POST', url: `/api/cities/${cityId}/market/quote`, payload: { goodId, direction, quantity } })).json();
    return app.inject({ method: 'POST', url: `/api/cities/${cityId}/market/trade`, payload: { goodId, direction, quantity, marketVersion: quote.marketVersion, idempotencyKey: key } });
  };
  const reputation = async (cityId = 'lambrecht') => (await app.inject({ method: 'GET', url: `/api/cities/${cityId}/buildings` })).json().reputation;
  const seed = (payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/test/seed', payload });
  const tick = (key: string) => app.inject({ method: 'POST', url: '/api/debug/tick', payload: { idempotencyKey: key } });

  it('starts every city at zero reputation with the documented status', async () => {
    await atLambrecht();
    expect(await reputation()).toEqual({ cityId: 'lambrecht', value: 0, status: 'Fremder' });
  });

  it('grants one point per full ten tons of useful improvement', async () => {
    await atLambrecht();
    // Lehm steht in Lambrecht bei 45 Tonnen unter dem Zielbestand 100: ein Verkauf ist nützlich.
    await seed({ cargo: { clay: 40 } });
    expect((await trade('lambrecht', 'clay', 'sell', 20, 'clay-sell')).statusCode).toBe(200);
    expect(await reputation()).toMatchObject({ value: 2, status: 'Fremder' });
  });

  it('counts a trade beyond the target stock only up to the target stock', async () => {
    await atLambrecht();
    // Ziegel stehen bei 30 Tonnen, Zielbestand 80: von 60 verkauften Tonnen zählen nur 50.
    await seed({ cargo: { bricks: 60 } });
    expect((await trade('lambrecht', 'bricks', 'sell', 60, 'bricks-sell')).statusCode).toBe(200);
    expect(await reputation()).toMatchObject({ value: 5 });
  });

  it('ignores trades in the useless direction and below the minimum quantity', async () => {
    await atLambrecht();
    // Holz liegt mit 200 Tonnen über dem Zielbestand 100; ein Verkauf verschlechtert den Markt.
    await seed({ cargo: { wood: 20 } });
    await trade('lambrecht', 'wood', 'sell', 20, 'wood-sell');
    expect((await reputation()).value).toBe(0);
    // Ein nützlicher Kauf unter zehn Tonnen handelt, erzeugt aber keinen Ruf.
    await trade('lambrecht', 'wood', 'buy', 9, 'wood-buy-small');
    expect((await reputation()).value).toBe(0);
  });

  it('shares one hourly improvement budget per city and good against churn', async () => {
    await atLambrecht();
    await seed({ cargo: { clay: 60 } });
    // Der Kontingentstart entspricht der Entfernung zum Zielbestand: 100 - 45 = 55 Tonnen.
    await trade('lambrecht', 'clay', 'sell', 50, 'clay-first');
    expect((await reputation()).value).toBe(5);
    await trade('lambrecht', 'clay', 'buy', 30, 'clay-back');
    await trade('lambrecht', 'clay', 'sell', 30, 'clay-again');
    // Nach dem Rückkauf bleiben nur die restlichen fünf Tonnen des Kontingents übrig.
    expect((await reputation()).value).toBe(5);
    expect((await tick('hour-1')).statusCode).toBe(200);
    // Der Tick löscht das Kontingent; es wird aus dem tatsächlichen Marktbestand neu bestimmt.
    await trade('lambrecht', 'clay', 'buy', 40, 'clay-next-hour-buy');
    await trade('lambrecht', 'clay', 'sell', 40, 'clay-next-hour-sell');
    expect((await reputation()).value).toBe(9);
  });

  it('collects the remainder below ten tons only within the running hour', async () => {
    await atLambrecht();
    await seed({ cargo: { clay: 30 } });
    await trade('lambrecht', 'clay', 'sell', 15, 'clay-15');
    expect((await reputation()).value).toBe(1);
    await trade('lambrecht', 'clay', 'sell', 15, 'clay-15-again');
    expect((await reputation()).value).toBe(3);
    await tick('hour-1');
    await seed({ cargo: { clay: 15 } });
    await trade('lambrecht', 'clay', 'sell', 15, 'clay-after-tick');
    expect((await reputation()).value).toBe(4);
  });

  it('reports the four documented reputation levels and caps at one hundred', async () => {
    await atLambrecht();
    for (const [value, status] of [[0, 'Fremder'], [19, 'Fremder'], [20, 'Bekannter Händler'], [49, 'Bekannter Händler'], [50, 'Angesehener Händler'], [79, 'Angesehener Händler'], [80, 'Vertrauenswürdiger Bürger'], [100, 'Vertrauenswürdiger Bürger']] as const) {
      await seed({ reputation: { lambrecht: value } });
      expect(await reputation()).toEqual({ cityId: 'lambrecht', value, status });
    }
    await seed({ reputation: { lambrecht: 99 }, cargo: { clay: 30 } });
    await trade('lambrecht', 'clay', 'sell', 30, 'clay-cap');
    expect((await reputation()).value).toBe(100);
  });

  it('keeps reputation local to a single city', async () => {
    await atLambrecht();
    await seed({ cargo: { clay: 20 } });
    await trade('lambrecht', 'clay', 'sell', 20, 'clay-local');
    expect((await reputation()).value).toBe(2);
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.14, latitude: 49.4 } });
    expect((await reputation('neustadt')).value).toBe(0);
  });

  it('sells a concession only with enough reputation and gold and books it atomically', async () => {
    await atLambrecht();
    const buy = () => app.inject({ method: 'POST', url: '/api/cities/lambrecht/concession' });

    const tooLow = await buy();
    expect(tooLow.statusCode).toBe(409);
    expect(tooLow.json()).toMatchObject({ error: { code: 'REPUTATION_TOO_LOW' } });

    await seed({ reputation: { lambrecht: 80 }, gold: 9_999 });
    const tooPoor = await buy();
    expect(tooPoor.statusCode).toBe(409);
    expect(tooPoor.json()).toMatchObject({ error: { code: 'INSUFFICIENT_GOLD' } });
    expect((await app.inject({ method: 'GET', url: '/api/player' })).json().gold).toBe(9_999);

    await seed({ gold: 100_000 });
    const bought = await buy();
    expect(bought.statusCode).toBe(200);
    expect(bought.json()).toMatchObject({ hasConcession: true, concessionPrice: 10_000 });
    expect((await app.inject({ method: 'GET', url: '/api/player' })).json().gold).toBe(90_000);

    const again = await buy();
    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ error: { code: 'CONCESSION_ALREADY_OWNED' } });
    expect((await app.inject({ method: 'GET', url: '/api/player' })).json().gold).toBe(90_000);
  });

  it('refuses every Alpha 2 command for an unreachable city', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.04, latitude: 49.4 } });
    for (const request of [
      { method: 'GET' as const, url: '/api/cities/lambrecht/buildings' },
      { method: 'POST' as const, url: '/api/cities/lambrecht/concession' },
      { method: 'POST' as const, url: '/api/cities/lambrecht/buildings', payload: { buildingType: 'kontor' } },
      { method: 'POST' as const, url: '/api/cities/lambrecht/kontor/transfer', payload: { goodId: 'wood', quantity: 1, direction: 'store' } },
    ]) {
      const response = await app.inject(request);
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ error: { code: 'CITY_NOT_REACHABLE' } });
    }
  });
});
