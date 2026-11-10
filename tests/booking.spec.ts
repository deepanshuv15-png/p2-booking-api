import { test, expect } from '@playwright/test';
import { Booking, BookingApi } from '../api/BookingApi';

const newBooking: Booking = {
  firstname: 'Deepanshu',
  lastname: 'Tester',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2027-01-10', checkout: '2027-01-12' },
  additionalneeds: 'Breakfast',
};

// The CRUD steps depend on each other (create first, delete last), so run them in order.
test.describe.serial('Booking CRUD', () => {
  let api: BookingApi;
  let bookingId: number;

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Accept: 'application/json' } });
    api = new BookingApi(request);
    await api.login(process.env.BOOKER_USER || 'admin', process.env.BOOKER_PASSWORD || 'password123');
  });

  test('POST creates a booking', async () => {
    const res = await api.create(newBooking);
    expect(res.status()).toBe(200);              // this API returns 200, not 201
    const body = await res.json();
    expect(typeof body.bookingid).toBe('number');
    expect(body.booking).toMatchObject(newBooking);
    bookingId = body.bookingid;
  });

  test('GET reads the same booking back', async () => {
    const res = await api.get(bookingId);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ firstname: 'Deepanshu', totalprice: 150 });
  });

  test('PUT without a token is refused', async () => {
    const res = await api.update(bookingId, { ...newBooking, totalprice: 999 }, false);
    expect(res.status()).toBe(403);
  });

  test('PUT with a token updates the price', async () => {
    const res = await api.update(bookingId, { ...newBooking, totalprice: 200 });
    expect(res.status()).toBe(200);
    expect((await res.json()).totalprice).toBe(200);
  });

  test('DELETE removes it, then GET gives 404', async () => {
    const res = await api.delete(bookingId);
    expect(res.status()).toBe(201);              // a known quirk of this practice API
    expect((await api.get(bookingId)).status()).toBe(404);
  });
});

test('login with a wrong password gives no token', async ({ request }) => {
  const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });
  expect(res.status()).toBe(200);                // returns 200 with a "reason", not 401
  expect(await res.json()).toEqual({ reason: 'Bad credentials' });
});
