import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface DMAQuery extends DataQuery {
    queryText?: string;
    useDynamicUnits?: boolean;
    type?: 'GQI' | 'Trend'
}

export const defaultQuery: Partial<DMAQuery> = {
    queryText: `{
        "__type": "Skyline.DataMiner.Web.Common.v1.DMAGenericInterfaceQuery",
        "ID": "Elements",
        "Version": 0.19,
        "Options": [],
        "Child": null
    }`,
    useDynamicUnits: true,
    type: 'GQI'
};

/**
 * These are options configured for each DataSource instance
 */
export interface DMADataSourceOptions extends DataSourceJsonData {
    dmaUsername?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface DMASecureJsonData {
    dmaPassword?: string;
}



export type GIServerColumnType =
    'boolean' |
    'datetime' |
    'timerange' |
    GIServiceNumericColumnType |
    'guid' |
    'string';

export type GIServiceNumericColumnType =
    'double' |
    'float' |
    'int' |
    'long';

export type GIClientColumnType =
    'number' |
    'string' |
    'guid' |
    'boolean' |
    'date';

export class DMAObject {
    DataMinerID?: number;
    ID?: number;
    Name?: string;
}

export class DMAGenericInterfaceColumnInfo {
    ServerType?: GIServerColumnType;
    Origin?: DMAObject;

    hidden?: boolean;

    ID?: string;
    ClientType?: GIClientColumnType = 'string';
    Name?: string = '';
}

export class DMAGenericInterfaceColumnLink {
    Column?: string;
    Link?: number;
}

export class DMAGenericInterfaceColumnBase {
    Columns?: DMAGenericInterfaceColumnInfo[];
    ColumnLinks?: DMAGenericInterfaceColumnLink[];
}

export class DMAGenericInterfaceSessionInfo extends DMAGenericInterfaceColumnBase {
    ID!: string;
}

export class DMAGenericInterfaceCell {
    Value?: string | boolean | number;
    DisplayValue?: string;
}

export class DMAGenericInterfaceRowIdentifier {
    ID?: number;
    Value?: DMAObject;
}

export class DMAGenericInterfaceRow {
    Cells?: DMAGenericInterfaceCell[];
    Identifiers?: DMAGenericInterfaceRowIdentifier[] = [];
}

export class DMAGenericInterfaceResultPage {
    Rows?: DMAGenericInterfaceRow[];
    IsLast?: boolean;
}

export class DMAParameterEditDiscreet
{
    Display?: string;
    Value?: string;
}

export class DMATrendData {
    Avg?: number[];
    Min?: number[];
    Max?: number[];
    Timestamps?: number[];
    StartTime?: number;
    EndTime?: number;
    Error?: string;
    Units?: string;
    Logarithmic?: boolean;
    NoData?: boolean;
    Exceptions?: DMAParameterEditDiscreet[];
    Discreets?: DMAParameterEditDiscreet[];
}
