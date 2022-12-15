import defaults from 'lodash/defaults';

import {
    DataQueryRequest,
    DataQueryResponse,
    DataSourceApi,
    DataSourceInstanceSettings,
    MutableDataFrame,
    FieldType,
} from '@grafana/data';

import { DMAQuery, DMADataSourceOptions, defaultQuery, DMAGenericInterfaceSessionInfo, DMAGenericInterfaceResultPage, GIClientColumnType, DMATrendData } from './types';
import API from './api';
import moment from 'moment-timezone';

export class DataSource extends DataSourceApi<DMAQuery, DMADataSourceOptions> {
    private _api: API;

    constructor(instanceSettings: DataSourceInstanceSettings<DMADataSourceOptions>) {
        super(instanceSettings);

        this._api = new API(instanceSettings.url || '');
        this.annotations = {};
    }

    async query(options: DataQueryRequest<DMAQuery>): Promise<DataQueryResponse> {
        const { range } = options;
        const from = range!.from.valueOf();
        const to = range!.to.valueOf();

        const data = options.targets.map(target => {
            const query = defaults(target, defaultQuery);

            switch (query.type) {
                case 'Trend':
                    return this._trend(query, from, to);
                default:
                    return this._gqi(query, from, to, options.timezone, options.maxDataPoints);
            }
        });

        return Promise.all(data).then(data => ({ data }));
    }

    async testDatasource() {
        const defaultErrorMessage = 'Cannot connect to the API on the DataMiner Agent.';

        try {
            const response = await this._api.authenticate();

            if (response) {
                return {
                    status: 'success',
                    message: 'Success'
                };
            } else {
                return {
                    status: 'error',
                    message: defaultErrorMessage
                };
            }
        } catch (err: any) {
            if (typeof err === 'string') {
                return {
                    status: 'error',
                    message: err
                };
            } else {
                let message = 'JSON API: ';
                message += err.message ? err.message : defaultErrorMessage;
                return {
                    status: 'error',
                    message
                };
            }
        }
    }

    private async _trend(query: DMAQuery, from: number, to: number): Promise<MutableDataFrame> {

        const arr = (query.queryText || '').split('/');
        if (arr.length < 3) { throw new Error("Invalid trend request."); }
        const dmaId = parseInt(arr[0], 10);
        const elementId = parseInt(arr[1], 10);
        const parameterId = parseInt(arr[2], 10);
        const tableIndex = arr.length > 3 ? arr[3] : null;

        return this._api.get<DMATrendData>('Json.asmx', 'GetTrendDataForTableParameterV2', {
            dmaID: dmaId,
            elementID: elementId,
            parameterID: parameterId,
            tableIndex: tableIndex,
            utcStartTime: from,
            utcEndTime: to,
            isRealTime: false
        }).then(result => {
            if (result.Error) {
                throw new Error(result.Error);
            }

            const frame = new MutableDataFrame({
                refId: query.refId,
                fields: [
                    { name: 'Timespan', type: FieldType.time },
                    { name: 'Avg', type: FieldType.number }
                ]
            });

            if (result.Min) {
                frame.addField({ name: 'Min', type: FieldType.number });
            }
            if (result.Max) {
                frame.addField({ name: 'Max', type: FieldType.number });
            }

            if (!result.NoData
                && result.Avg
                && result.Timestamps) {
                for (let i = 0; i < result.Avg.length; i++) {
                    const values = [result.Timestamps[i], result.Avg[i]];
                    if (result.Min) {
                        values.push(result.Min[i]);
                    }
                    if (result.Max) {
                        values.push(result.Max[i]);
                    }
                    frame.appendRow(values);
                }
            }

            return frame;
        });
    }

    private async _gqi(query: DMAQuery, from: number, to: number, timezone: string, maxDataPoints?: number): Promise<MutableDataFrame> {
        let gqiQuery: Record<string, unknown> = {};
        try {
            let gqiQueryString = query.queryText || '{}';
            gqiQueryString = gqiQueryString.replace(/\[gf-starttime\]/g, from.toString());
            gqiQueryString = gqiQueryString.replace(/\[gf-endtime\]/g, to.toString());
            gqiQuery = JSON.parse(gqiQueryString || '{}');
        } catch (err) {
            throw new Error(`Invalid query: ${(err as Error).message}`);
        }


        if (!timezone || timezone === 'browser') {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        return this._api.get<DMAGenericInterfaceSessionInfo>('Internal.asmx', 'OpenQuerySession', {
            options: {
                EnableUpdates: false,
                TimeZoneID: timezone,
                UseDynamicUnits: query.useDynamicUnits
            },
            query: gqiQuery
        })
        .then(async session => {
            const frame = new MutableDataFrame({
                refId: query.refId,
                fields: []
            });

            if (session) {
                session.Columns?.forEach(column => {
                    frame.addField({ name: column.Name || '', type: this._convertColumnType(column.ClientType) });
                });

                const maxPoints = maxDataPoints || 200;
                while (frame.length < maxPoints) {
                    const page = await this._getNextPage(session, frame);
                    if (!page || page.IsLast) {
                        break;
                    }
                }

                this._api.get<void>('Internal.asmx', 'CloseQuerySession', { sessionID: session.ID }).catch(() => {});
            }

            return frame;
        });
    }

    private async _getNextPage(session: DMAGenericInterfaceSessionInfo, frame: MutableDataFrame): Promise<DMAGenericInterfaceResultPage> {
        return this._api.get<DMAGenericInterfaceResultPage>('Internal.asmx', 'GetNextQuerySessionPage', {
            sessionID: session.ID,
            start: frame.length,
            pageSize: 300
        }).then(page => {
            if (page) {
                page.Rows?.forEach(row => {
                    if (row?.Cells && session.Columns) {
                        const values = [];
                        for (let i = 0; i < row.Cells.length; i++) {
                            const cell = row.Cells[i];
                            const column = session.Columns[i];
                            values.push(this._convertValue(cell.Value, column.ClientType || 'string'));
                        }
                        frame.appendRow(values);
                    }
                });
            }
            return page;
        });
    }

    private _convertColumnType(type?: GIClientColumnType): FieldType {
        switch (type) {
            case 'number':
                return FieldType.number;
            case 'date':
                return FieldType.time;
            case 'boolean':
                return FieldType.boolean;
        }
        return FieldType.string;
    }

    private _convertValue(value: string | number | boolean | undefined, type: GIClientColumnType): string | number | boolean | undefined {
        switch (type) {
            case 'date':
                if (typeof value === 'string') {
                    return moment(value).valueOf();
                }
                break;
        }
        return value;
    }
}
