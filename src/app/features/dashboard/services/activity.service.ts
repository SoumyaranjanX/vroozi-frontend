import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IActivity } from '@shared/models/activity.model';

@Injectable({
    providedIn: 'root'
})
export class ActivityService {
    private readonly apiUrl = `${environment.apiUrl}/activities`;
    private activitiesCache$?: Observable<IActivity[]>;
    private readonly MAX_RETRIES = 3;

    constructor(private readonly http: HttpClient) {}

    invalidateActivitiesCache(): void {
        this.activitiesCache$ = undefined;
    }

    getActivities(): Observable<IActivity[]> {
        if (!this.activitiesCache$) {
            this.activitiesCache$ = this.http.get<IActivity[]>(this.apiUrl).pipe(
                retry(this.MAX_RETRIES),
                map(activities => activities.map(activity => this.transformActivity(activity))),
                map(activities => activities.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )),
                shareReplay(1),
                catchError(this.handleError)
            );
        }
        return this.activitiesCache$;
    }

    private transformActivity(activity: any): IActivity {
        return {
            id: activity.id || activity._id,
            type: activity.type,
            action: activity.action,
            description: activity.description,
            timestamp: new Date(activity.timestamp),
            userId: activity.userId,
            userName: activity.userName,
            metadata: activity.metadata || {}
        };
    }

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