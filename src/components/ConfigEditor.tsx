import React, { ChangeEvent, PureComponent } from 'react';
import { DataSourceHttpSettings, LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DMADataSourceOptions, DMASecureJsonData } from '../types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<DMADataSourceOptions, DMASecureJsonData> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  formatToJSON = (input: string) => {
    // special characters like \ need to be escaped before inserting them in the JSON body
    let result = JSON.stringify(input);
    result = result.substring(1, result.length - 1);
    return result;
  };

  onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      dmaUsername: event.target.value,
      dmaUsernameJSON: this.formatToJSON(event.target.value)
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        dmaPassword: event.target.value,
        dmaPasswordJSON: this.formatToJSON(event.target.value)
      },
    });
  };
  onResetPassword = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        dmaPassword: false
      },
      secureJsonData: {
        ...options.secureJsonData,
        dmaPassword: ''
      },
    });
  };

  render() {
    const { onOptionsChange, options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as DMASecureJsonData;

    return (
      <div>
        <div className="gf-form-group">
          <h3>User</h3>
          <div className="gf-form">
            <FormField
              label="Username"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onUsernameChange}
              value={jsonData.dmaUsername || ''}
              placeholder="Username"
            />
          </div>
          <div className="gf-form-inline">
            <div className="gf-form">
              <SecretFormField
                isConfigured={(secureJsonFields && secureJsonFields.dmaPassword) as boolean}
                value={secureJsonData.dmaPassword || ''}
                label="Password"
                placeholder="Password"
                labelWidth={6}
                inputWidth={20}
                onReset={this.onResetPassword}
                onChange={this.onPasswordChange}
              />
            </div>
          </div>
        </div>
        <div className="gf-form-group">
          <div className="gf-form">
            <DataSourceHttpSettings
              defaultUrl="http://localhost"
              dataSourceConfig={options}
              onChange={onOptionsChange}
              showAccessOptions={false}
              showForwardOAuthIdentityOption={false}
            />
          </div>
        </div>
      </div>
    );
  }
}
