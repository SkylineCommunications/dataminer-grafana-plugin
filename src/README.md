# DataMiner Grafana Data Source Plugin

Connect to a DataMiner Agent and visualize your DataMiner data in Grafana. This plugin requires a DataMiner System.

> **⚠️ Alpha version**
>
> Everything is subject to change. **No backwards compatibility** is guaranteed. This means that you might have to redo your work once this plugin is effectively released.

## Getting started

After installing the DataMiner data source plugin in Grafana, configure the connection with your DataMiner Agent:

* User: Specify the username and password that Grafana should use to authenticate on the DMA. These credentials will only provide access to data inside DataMiner as configured in the DataMiner security.
* HTTP: Specify the URL to connect to your DataMiner Agent, for example `https://mydma.company.com`.

> **⚠️ Use a secure HTTPS connection**
>
> Without HTTPS, your username and password will be sent unencrypted over the network/internet, which means that others could see them. Refer to the [DataMiner User Guide](https://docs.dataminer.services/user-guide/Advanced_Functionality/DataMiner_Agents/Configuring_a_DMA/Setting_up_HTTPS_on_a_DMA.html) for information on how to configure your DataMiner System to use HTTPS.

Other configuration settings can be ignored.

## Features

### Generic Query Interface (GQI)

A GQI query should be specified in JSON format. To get a correctly configured query, you can make use of the DataMiner Dashboards app:

1. In the DataMiner Dashboards app, create a dashboard and create a query.
2. Visualize this query on the dashboard.
3. Open the developer tools (F12) and go to the *Network* tab.
4. Refresh the dashboard and find the *OpenQuerySession* network call.
5. Under payload, right-click *query:* and select *Copy value*.
6. Paste the copied JSON code into Grafana.

#### Time range filter

Your GQI query can contain one or more datetime filters. To apply the time range filter from Grafana, you can manually edit the filter condition of the GQI query by replacing the numeric timestamp value with one of the following placeholders: `[gf-starttime]` and `[gf-endtime]`.

For example:

``` JSON
{
    "ID": "Value",
    "Value": {
        "Value": [gf-starttime],
        "Type": "datetime",
        "__type": "Skyline.DataMiner.Web.Common.v1.DMAPrimitiveValue"
    },
    "Type": "datetime",
    "__type": "Skyline.DataMiner.Web.Common.v1.DMAGenericInterfaceQueryChosenOption"
}
```

#### Transformations

You may have to add a transformation to some GQI results. This could for example be the case when you have a GQI query that gets the latitude and longitude from element properties: since properties in DataMiner are strings, you will need to add a *Convert field type* transformation to convert the latitude and longitude values to numbers before you can display them on a map visualization.

#### Annotations

You can use data from a GQI result to annotate the data on your dashboard. This can be configured in the settings of your Grafana dashboard. For more information about annotations, refer to the [Grafana documentation](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/).

### Trend data

To get the trend data of a parameter, specify the parameter using the following format: `dmaID/elementID/parameterID` or `dmaID/elementID/tableColumnParameterID/tableRowIndex`. This will request the trend data from within the time range specified on the dashboard. If the time range is less than 48 hours, 5-minute interval points will be returned, otherwise 60-minute interval points.

> **⚠️ Limited support**
>
> Only numeric average trending is supported. This plugin currently does not support real-time trending, discrete values, or exception values.
