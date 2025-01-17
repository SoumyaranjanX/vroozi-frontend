import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap, retry, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IActivity } from '@shared/models/activity.model';

export interface DashboardMetrics {
  activeContracts: {
    count: number;
    averageAge: number;
    oldestContract: Date | null;
  };
  processingQueue: {
    count: number;
    averageProcessingTime: number;
    successRate: number;
    failures: number;
  };
  pendingReview: {
    count: number;
    urgentReviews: number;
    averageWaitTime: number;
  };
  posGenerated: {
    count: number;
    totalPos: number;
    averagePerContract: number;
  };
  totalContracts: number;
  lastUpdated: Date;
}

export interface StatusDistribution {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;
  private readonly MAX_RETRIES = 3;

  private metricsSubject = new BehaviorSubject<DashboardMetrics>({
    activeContracts: {
      count: 0,
      averageAge: 0,
      oldestContract: null,
    },
    processingQueue: {
      count: 0,
      averageProcessingTime: 0,
      successRate: 0,
      failures: 0,
    },
    pendingReview: {
      count: 0,
      urgentReviews: 0,
      averageWaitTime: 0,
    },
    posGenerated: {
      count: 0,
      totalPos: 0,
      averagePerContract: 0,
    },
    totalContracts: 0,
    lastUpdated: new Date(),
  });

  private activitiesSubject = new BehaviorSubject<IActivity[]>([]);

  metrics$ = this.metricsSubject.asObservable();
  activities$ = this.activitiesSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches dashboard metrics from the API
   * @param refresh Force refresh the cache
   */
  fetchDashboardData(refresh: boolean = false): Observable<DashboardMetrics> {
    console.log('Fetching dashboard data...');
    return this.http
      .get<DashboardMetrics>(`${this.apiUrl}/metrics`, {
        params: { refresh: refresh.toString() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      .pipe(
        retry(this.MAX_RETRIES),
        map(rawMetrics => this.transformMetrics(rawMetrics)),
        tap(metrics => this.metricsSubject.next(metrics)),
        catchError(this.handleError)
      );
  }

  /**
   * Fetches status distribution over time
   * @param days Number of days to analyze
   */
  getStatusDistribution(days: number = 30): Observable<StatusDistribution> {
    return this.http
      .get<StatusDistribution>(`${this.apiUrl}/status-distribution`, {
        params: { days: days.toString() },
      })
      .pipe(retry(this.MAX_RETRIES), catchError(this.handleError));
  }

  /**
   * Transforms raw backend metrics to frontend format
   */
  private transformMetrics(rawMetrics: any): DashboardMetrics {
    return {
      activeContracts: {
        count: rawMetrics.status_counts.active_contracts.count || 0,
        averageAge: rawMetrics.status_counts.active_contracts.average_age || 0,
        oldestContract: rawMetrics.status_counts.active_contracts.oldest_contract
          ? new Date(rawMetrics.status_counts.active_contracts.oldest_contract)
          : null,
      },
      processingQueue: {
        count: rawMetrics.status_counts.processing_queue.count || 0,
        averageProcessingTime: rawMetrics.status_counts.processing_queue.average_processing_time || 0,
        successRate: rawMetrics.status_counts.processing_queue.success_rate || 0,
        failures: rawMetrics.status_counts.processing_queue.failures || 0,
      },
      pendingReview: {
        count: rawMetrics.status_counts.pending_review.count || 0,
        urgentReviews: rawMetrics.status_counts.pending_review.urgent_reviews || 0,
        averageWaitTime: rawMetrics.status_counts.pending_review.average_wait_time || 0,
      },
      posGenerated: {
        count: rawMetrics.status_counts.pos_generated.count || 0,
        totalPos: rawMetrics.status_counts.pos_generated.total_pos || 0,
        averagePerContract: rawMetrics.status_counts.pos_generated.average_pos_per_contract || 0,
      },
      totalContracts: rawMetrics.status_counts.total_contracts || 0,
      lastUpdated: new Date(rawMetrics.status_counts.last_updated),
    };
  }

  /**
   * Generic error handler for HTTP operations
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
