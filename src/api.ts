import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';
import { Observable, lastValueFrom, from as fromPromise, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

class WebAPIResponse<T> {
    d!: T;
}

export default class API {
    private _baseUrl: string;
    private _isConnecting = false;
    private _connectionId = '';
    private _connectPromise: Promise<string> | null = null;

    constructor(baseUrl: string) {
        this._baseUrl = baseUrl;
    }

    async get<T>(api: 'Json.asmx' | 'Internal.asmx', method: string, data?: Record<string, unknown>, retry = false): Promise<T> {
        const req: BackendSrvRequest = {
            url: `${this._baseUrl}/API/v1/${api}/${method}`,
            method: 'POST'
        };

        if (data) {
            if (this._requiresAuthentication(method)) {
                if (this._isConnecting) {
                    await this._connectPromise;
                }
                if (!this._connectionId) {
                    if (!retry) {
                        await this.authenticate(true);
                    }
                    if (!this._connectionId) {
                        throw new Error('No connetion to the DataMiner agent.');
                    }
                }
                data.connection = this._connectionId;
            }

            req.data = JSON.stringify(data);
            req.headers = { 'Content-Type': 'application/json' };
        }

        return await lastValueFrom(this._get(req, data, retry));
    }

    async authenticate(retry = false): Promise<string> {
        this._connectionId = '';
        try {
            if (!this._connectPromise || (retry && !this._isConnecting)) {
                this._isConnecting = true;
                this._connectPromise = this.get<string>('Json.asmx', 'ConnectApp', undefined, retry);
            }
            this._connectionId = await this._connectPromise;
            this._isConnecting = false;
        }
        catch (error) {
            this._isConnecting = false;
            throw new Error('Could not set up a connection with the DataMiner agent.');
        }
        return this._connectionId;
    }

    private _requiresAuthentication(method: string) {
        return method !== 'ConnectApp';
    }

    private _get<T>(req: BackendSrvRequest, data?: Record<string, unknown>, retry = false): Observable<T> {
        return getBackendSrv().fetch<WebAPIResponse<T>>(req).pipe(
            map(response => response.data.d),
            catchError(error => {
                if (!retry && error?.data?.ExceptionType === 'Skyline.DataMiner.Web.Common.NoConnectionWebApiException') {
                    return fromPromise(this.authenticate(true)).pipe(
                        switchMap(connection => {
                            if (connection) {
                                if (data) {
                                    data.connection = connection;
                                    req.data = JSON.stringify(data);
                                }
                                return this._get<T>(req, data, true);
                            } else {
                                return throwError(() => new Error('Request failed.'));
                            }
                        })
                    );
                }
                if (error?.data?.Message) {
                    return throwError(() => new Error(error.data.Message));
                }
                if (error?.status) {
                    return throwError(() => new Error(`Request failed (HTTP${error.status})`));
                }
                return throwError(() => new Error('Request failed.'));
            })
        )
    }
}
