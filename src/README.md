# DataMiner Grafana Data Source Plugin

Connect to a DataMiner agent and visualize your DataMiner data in Grafana. This plugin requires a DataMiner System.

> **⚠️ Alpha version**
>
> Everything is subject to change. **No backwards compatibility** is guaranteed. This means that you might have to redo your work once this plugin is effectively released.

## Getting started

After installing the DataMiner data source plugin in Grafana, configure the connection with your DataMiner agent:

* User: specify the username and password which Grafana should use to authenticate on the DMA. This user only has access to data inside DataMiner as configured in the DataMiner security.
* HTTP: specify the URL to connect to your DataMiner agent, for example `https://mydma.company.com`.

> **⚠️ Use a secure HTTPS connection**
>
> Without HTTPS, your username and password will be send unencrypted over the network/Internet, which means that others could see them. See the [DataMiner Help](https://docs.dataminer.services/user-guide/Advanced_Functionality/DataMiner_Agents/Configuring_a_DMA/Setting_up_HTTPS_on_a_DMA.html) on how to configure your DataMiner System to use HTTPS.

Other configuration settings can be ignored.

## Features

### Generic Query Interface (GQI)

A GQI query should be specified in JSON format. To get this JSON you can make use of the Dashboards app of DataMiner:

1. In the DataMiner Dashboards app, create a dashboard and create a query.
2. Visualize this query on the dashboard.
3. Open the developer tools (F12) and go to the `Network` tab.
4. Refresh the dashboard and find the `OpenQuerySession` network call.
5. Under payload, right click on `query:` and choose `Copy value`.
6. Paste this JSON into Grafana.

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

On some GQI results you might have to add a transformation. For example when having a GQI query that gets the latitude and longitude from element properties, since properties in DataMiner are strings you will need to add a `convert field type` transformation to convert the latitude and longitude values to numbers before you will be able to display them on a map visualization.

#### Annotations

It's possible to use data from a GQI result to annotate the data on your dashboard. This can be configured in the settings of your Grafana dashboard. For more information about annotations, refer to the Grafana documentation.

### Trend data

To get the trend data of a parameter, specify the parameter using the following format: `dmaID/elementID/parameterID` or `dmaID/elementID/tableColumnParameterID/tableRowIndex`.

> **⚠️ Limited support**
>
> Only numeric average trending is supported. This plugin currently does not support real-time trending, discreets, nor exception values.
