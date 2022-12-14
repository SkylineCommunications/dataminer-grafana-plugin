import defaults from 'lodash/defaults';

import React, { ChangeEvent, FormEvent, PureComponent } from 'react';
import { LegacyForms, Select, TextArea } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { defaultQuery, DMADataSourceOptions, DMAQuery } from '../types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, DMAQuery, DMADataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target as HTMLInputElement | HTMLTextAreaElement;
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: value });
  };

  onUseDynamicUnitsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, useDynamicUnits: event.target.checked });
    // executes the query
    onRunQuery();
  };

  onTypeChange = (value: SelectableValue<"Trend" | "GQI">) => {
    const { onChange, query } = this.props;
    onChange({ ...query, type: value.value });
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryText, useDynamicUnits, type } = query;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <Select
            isMulti={false}
            isClearable={false}
            isSearchable={false}
            value={type || 'GQI'}
            onChange={this.onTypeChange}
            options={[{ label: 'GQI', value: 'GQI' }, { label: 'Trend', value: 'Trend' }]}
          />
          { type === 'GQI' && <FormField
            labelWidth={10}
            inputWidth={1}
            defaultChecked={useDynamicUnits}
            onChange={this.onUseDynamicUnitsChange}
            label="Use dynamic units"
            type="checkbox"
          /> }
        </div>
        <div className="gf-form">
          <TextArea
            value={queryText || ''}
            onChange={this.onQueryTextChange}
            rows={10}
            placeholder={ type === 'Trend' ? 'dmaid/elementId/parameterId/tableIndex' : 'Query as JSON'}
            style={{width:"100%"}}
          />
        </div>
      </div>
    );
  }
}
