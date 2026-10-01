import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  getNotifications(): Promise<Notification[]> {
    return firstValueFrom(this.http.get<Notification[]>('/api/notifications'));
  }

  getNotificationsByCorrelation(correlationId: string): Promise<Notification[]> {
    return firstValueFrom(
      this.http.get<Notification[]>(`/api/notifications/correlation/${correlationId}`),
    );
  }
}
