import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
};

export class BookingApi {
  private token = '';

  constructor(private readonly request: APIRequestContext) {}

  async login(username: string, password: string): Promise<void> {
    const res = await this.request.post('/auth', { data: { username, password } });
    expect(res.status()).toBe(200);
    this.token = (await res.json()).token;
    expect(this.token).toBeTruthy();
  }

  create(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  // Restful Booker reads the token from a cookie
  update(id: number, booking: Booking, withToken = true): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, {
      data: booking,
      headers: withToken ? { Cookie: `token=${this.token}` } : {},
    });
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: { Cookie: `token=${this.token}` } });
  }
}
