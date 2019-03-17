//
// LIBRARY REQUIREMENTS
//
// In the require function, we include the necessary libraries and modules for
// the HTML dashboard. Then, we pass variable names for these libraries and
// modules as function parameters, in order.
//
// When you add libraries or modules, remember to retain this mapping order
// between the library or module and its function parameter. You can do this by
// adding to the end of these lists, as shown in the commented examples below.

require([
    "splunkjs/mvc",
    "splunkjs/mvc/utils",
    "splunkjs/mvc/tokenutils",
    "underscore",
    "jquery",
    "splunkjs/mvc/simplexml",
    "splunkjs/mvc/layoutview",
    "splunkjs/mvc/simplexml/dashboardview",
    "splunkjs/mvc/simplexml/dashboard/panelref",
    "splunkjs/mvc/simplexml/element/chart",
    "splunkjs/mvc/simplexml/element/event",
    "splunkjs/mvc/simplexml/element/html",
    "splunkjs/mvc/simplexml/element/list",
    "splunkjs/mvc/simplexml/element/map",
    "splunkjs/mvc/simplexml/element/single",
    "splunkjs/mvc/simplexml/element/table",
    "splunkjs/mvc/simplexml/element/visualization",
    "splunkjs/mvc/simpleform/formutils",
    "splunkjs/mvc/simplexml/eventhandler",
    "splunkjs/mvc/simplexml/searcheventhandler",
    "splunkjs/mvc/simpleform/input/dropdown",
    "splunkjs/mvc/simpleform/input/radiogroup",
    "splunkjs/mvc/simpleform/input/linklist",
    "splunkjs/mvc/simpleform/input/multiselect",
    "splunkjs/mvc/simpleform/input/checkboxgroup",
    "splunkjs/mvc/simpleform/input/text",
    "splunkjs/mvc/simpleform/input/timerange",
    "splunkjs/mvc/simpleform/input/submit",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/savedsearchmanager",
    "splunkjs/mvc/postprocessmanager",
    "splunkjs/mvc/simplexml/urltokenmodel"
    // Add comma-separated libraries and modules manually here, for example:
    // ..."splunkjs/mvc/simplexml/urltokenmodel",
    // "splunkjs/mvc/tokenforwarder"
    ],
    function(
        mvc,
        utils,
        TokenUtils,
        _,
        $,
        DashboardController,
        LayoutView,
        Dashboard,
        PanelRef,
        ChartElement,
        EventElement,
        HtmlElement,
        ListElement,
        MapElement,
        SingleElement,
        TableElement,
        VisualizationElement,
        FormUtils,
        EventHandler,
        SearchEventHandler,
        DropdownInput,
        RadioGroupInput,
        LinkListInput,
        MultiSelectInput,
        CheckboxGroupInput,
        TextInput,
        TimeRangeInput,
        SubmitButton,
        SearchManager,
        SavedSearchManager,
        PostProcessManager,
        UrlTokenModel

        // Add comma-separated parameter names here, for example:
        // ...UrlTokenModel,
        // TokenForwarder
        ) {

        var pageLoading = true;


        //
        // FUNCTIONS
        //

        function isNumeric(n) {
          return !isNaN(parseFloat(n)) && isFinite(n) && n > 0;
        }

        //
        // TOKENS
        //

        // Create token namespaces
        var urlTokenModel = new UrlTokenModel();
        mvc.Components.registerInstance('url', urlTokenModel);
        var defaultTokenModel = mvc.Components.getInstance('default', {create: true});
        var submittedTokenModel = mvc.Components.getInstance('submitted', {create: true});

        urlTokenModel.on('url:navigate', function() {
            defaultTokenModel.set(urlTokenModel.toJSON());
            if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
                submitTokens();
            } else {
                submittedTokenModel.clear();
            }
        });

        // Initialize tokens
        defaultTokenModel.set(urlTokenModel.toJSON());

        function submitTokens() {
            // Copy the contents of the defaultTokenModel to the submittedTokenModel and urlTokenModel
            FormUtils.submitForm({ replaceState: pageLoading });
        }

        function setToken(name, value) {
            defaultTokenModel.set(name, value);
            submittedTokenModel.set(name, value);
        }

        function unsetToken(name) {
            defaultTokenModel.unset(name);
            submittedTokenModel.unset(name);
        }



        //
        // SEARCH MANAGERS
        //

        //
        // ALERT SUMMARY
        //

var search_kafka_alerts_main_table = new SearchManager({
            "id": "search_kafka_alerts_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| rest splunk_server=local /servicesNS/-/telegraf-kafka/saved/searches | search eai:acl.app=\"telegraf-kafka\" alert.track=1 | fields title, cron_schedule, schedule_window, alert.suppress.fields, alert.suppress.period, disabled, next_scheduled_time, id | rex field=id \"saved/searches/(?<id>.*)\" | sort limit=0 title | rangemap field=disabled low=0-0 severe=1-1",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // MAINTENANCE MODE
        //

var search_maintenance_state = new SearchManager({
            "id": "search_maintenance_state",
            "sample_ratio": 1,
            "search": "| savedsearch \"Verify Kafka alerting maintenance status\" | fields maintenance_mode | eval maintenance=if(match(maintenance_mode, \"enabled\"), 1, 0), maintenance_mode=upper(maintenance_mode) | rangemap field=maintenance low=0-0 severe=1-1 default=severe",
            "status_buckets": 0,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "latest_time": "now",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_maintenance_state_reactivation = new SearchManager({
            "id": "search_maintenance_state_reactivation",
            "sample_ratio": 1,
            "search": "| inputlookup kafka_alerting_maintenance | eval maintenance_mode_end=strftime(maintenance_mode_end, \"%d %b %H:%M\") | fields maintenance_mode_end",
            "status_buckets": 0,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "latest_time": "now",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
                "depends": "$maintenance_enabled$",
                "rejects": ""
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_maintenance_mode_state = new SearchManager({
            "id": "search_maintenance_mode_state",
            "earliest_time": "$earliest$",
            "sample_ratio": null,
            "cancelOnUnload": true,
            "latest_time": "$latest$",
            "search": "| inputlookup kafka_alerting_maintenance | fields maintenance_mode",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        new SearchEventHandler({
            managerid: "search_maintenance_mode_state",
            event: "progress",
            conditions: [
                {
                    attr: "match",
                    value: "'result.maintenance_mode'==\"enabled\"",
                    actions: [
                        {"type": "set", "token": "maintenance_enabled", "value": "true"}
                    ]
                },
                {
                    attr: "match",
                    value: "'result.maintenance_mode'==\"disabled\"",
                    actions: [
                        {"type": "unset", "token": "maintenance_enabled"}
                    ]
                }
            ]
        });

        //
        // end time maintenance mode
        //

        var inputEndMaintenanceTime = new DropdownInput({
            "id": "inputEndMaintenanceTime",
            "choices": [
                {"value": "00:00", "label": "12:00am"},
                {"value": "00:30", "label": "12:30am"},
                {"value": "01:00", "label": "01:00am"},
                {"value": "01:30", "label": "01:30am"},
                {"value": "02:00", "label": "02:00am"},
                {"value": "02:30", "label": "02:30am"},
                {"value": "03:00", "label": "03:00am"},
                {"value": "03:30", "label": "03:30am"},
                {"value": "04:00", "label": "04:00am"},
                {"value": "04:30", "label": "04:30am"},
                {"value": "05:00", "label": "05:00am"},
                {"value": "05:30", "label": "05:30am"},
                {"value": "06:00", "label": "06:00am"},
                {"value": "06:30", "label": "06:30am"},
                {"value": "07:00", "label": "07:00am"},
                {"value": "07:30", "label": "07:30am"},
                {"value": "08:00", "label": "08:00am"},
                {"value": "08:30", "label": "08:30am"},
                {"value": "09:00", "label": "09:00am"},
                {"value": "09:30", "label": "09:30am"},
                {"value": "10:00", "label": "10:00am"},
                {"value": "10:30", "label": "10:30am"},
                {"value": "11:00", "label": "11:00am"},
                {"value": "11:30", "label": "11:30am"},
                {"value": "12:00", "label": "12:00pm"},
                {"value": "12:30", "label": "12:30pm"},
                {"value": "13:00", "label": "01:00pm"},
                {"value": "13:30", "label": "01:30pm"},
                {"value": "14:00", "label": "02:00pm"},
                {"value": "14:30", "label": "02:30pm"},
                {"value": "15:00", "label": "03:00pm"},
                {"value": "15:30", "label": "03:30pm"},
                {"value": "16:00", "label": "04:00pm"},
                {"value": "16:30", "label": "04:30pm"},
                {"value": "17:00", "label": "05:00pm"},
                {"value": "17:30", "label": "05:30pm"},
                {"value": "18:00", "label": "06:00pm"},
                {"value": "18:30", "label": "06:30pm"},
                {"value": "19:00", "label": "07:00pm"},
                {"value": "19:30", "label": "07:30pm"},
                {"value": "20:00", "label": "08:00pm"},
                {"value": "20:30", "label": "08:30pm"},
                {"value": "21:00", "label": "09:00pm"},
                {"value": "21:30", "label": "09:30pm"},
                {"value": "22:00", "label": "10:00pm"},
                {"value": "22:30", "label": "10:30pm"},
                {"value": "23:00", "label": "11:00pm"},
                {"value": "23:30", "label": "11:30pm"}
            ],
            "searchWhenChanged": true,
            "selectFirstChoice": false,
            "initialValue": "00:00",
            "showClearButton": true,
            "value": "$form.time_end_maintenance$",
            "el": $('#inputEndMaintenanceTime')
        }, {tokens: true}).render();

        inputEndMaintenanceTime.on("change", function(newValue) {
            FormUtils.handleValueChange(inputEndMaintenanceTime);
        });

        //
        // KAFKA INFRASTRUCTURE
        //

var search_kafka_infra_search_env = new SearchManager({
            "id": "search_kafka_infra_search_env",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | fillnull value=\"unknown\" env | stats count by env | fields env | dedup env | sort 0 env",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_infra_search_label = new SearchManager({
            "id": "search_kafka_infra_search_label",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | fillnull value=\"unknown\" label | stats count by label | fields label | dedup label | sort 0 label",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_infra_main_table = new SearchManager({
            "id": "search_kafka_infra_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | eval keyid = _key | fillnull value=\"unknown\" env, label | search $search_tk_kafka_infra_name$ $search_tk_kafka_infra_env$ $search_tk_kafka_infra_label$ $search_tk_kafka_infra_role$ $search_tk_kafka_infra_monitoring_state$ | fields keyid, env, label, name, role, monitoring_state, grace_period, lasttime | eval lasttime_epoch=lasttime, lasttime=strftime(lasttime_epoch, \"%d/%m/%Y %H:%M:%S\") | sort 0 role, env, label, name | eval range=if(monitoring_state=\"enabled\", \"low\", \"severe\")",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_no_components = new SearchManager({
            "id": "search_kafka_infra_no_components",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_no_components_enabled = new SearchManager({
            "id": "search_kafka_infra_no_components_enabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | where monitoring_state=\"enabled\" | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_no_components_disabled = new SearchManager({
            "id": "search_kafka_infra_no_components_disabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_inventory | where monitoring_state!=\"enabled\" | stats count | rangemap field=maintenance low=0-0 high=1-1000 default=severe",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // KAFKA INFRASTRUCTURE NODES
        //

var search_kafka_infra_nodes_search_env = new SearchManager({
            "id": "search_kafka_infra_nodes_search_env",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | fillnull value=\"unknown\" env | stats count by env | fields env | dedup env | sort 0 env",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_infra_nodes_search_label = new SearchManager({
            "id": "search_kafka_infra_nodes_search_label",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | fillnull value=\"unknown\" label | stats count by label | fields label | dedup label | sort 0 label",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_infra_nodes_main_table = new SearchManager({
            "id": "search_kafka_infra_nodes_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | eval keyid = _key | fillnull value=\"unknown\" env, label | search $search_tk_kafka_infra_nodes_env$ $search_tk_kafka_infra_nodes_label$ $search_tk_kafka_infra_nodes_role$ $search_tk_kafka_infra_nodes_monitoring_state$ | fields keyid, env, label, role, current_nodes_number, minimal_nodes_number, monitoring_state | sort 0 role, env, label, role | eval range=if(monitoring_state=\"enabled\", \"low\", \"severe\")",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_nodes_no_components = new SearchManager({
            "id": "search_kafka_infra_nodes_no_components",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_nodes_no_components_enabled = new SearchManager({
            "id": "search_kafka_infra_nodes_no_components_enabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | where monitoring_state=\"enabled\" | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_infra_nodes_no_components_disabled = new SearchManager({
            "id": "search_kafka_infra_nodes_no_components_disabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_infra_nodes_inventory | where monitoring_state!=\"enabled\" | stats count | rangemap field=maintenance low=0-0 high=1-1000 default=severe",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // KAFKA TOPICS
        //

var search_kafka_topics_search_env = new SearchManager({
            "id": "search_kafka_topics_search_env",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | fillnull value=\"unknown\" env | stats count by env | fields env | dedup env | sort 0 env",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_topics_search_label = new SearchManager({
            "id": "search_kafka_topics_search_label",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | fillnull value=\"unknown\" label | stats count by label | fields label | dedup label | sort 0 label",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_kafka_topics_main_table = new SearchManager({
            "id": "search_kafka_topics_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | eval keyid = _key | fillnull value=\"unknown\" env, label | search $search_tk_kafka_topics_env$ $search_tk_kafka_topics_label$ $search_tk_kafka_topics_name$ $search_tk_kafka_topics_monitoring_state$ | fields keyid, env, label, topic, monitoring_state | sort 0 env, label, name | eval range=if(monitoring_state=\"enabled\", \"low\", \"severe\")",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_topics_no_components = new SearchManager({
            "id": "search_kafka_topics_no_components",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_topics_no_components_enabled = new SearchManager({
            "id": "search_kafka_topics_no_components_enabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | where monitoring_state=\"enabled\" | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_kafka_topics_no_components_disabled = new SearchManager({
            "id": "search_kafka_topics_no_components_disabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_topics_monitoring | where monitoring_state!=\"enabled\" | stats count | rangemap field=maintenance low=0-0 high=1-1000 default=severe",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // KAFKA CONNECT
        //

var search_connect_no_connectors = new SearchManager({
            "id": "search_connect_no_connectors",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | stats dc(connector) as count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_connect_no_connectors_enabled = new SearchManager({
            "id": "search_connect_no_connectors_enabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | where monitoring_state=\"enabled\" | stats dc(connector) as count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_connect_no_connectors_disabled = new SearchManager({
            "id": "search_connect_no_connectors_disabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | where monitoring_state!=\"enabled\" | stats dc(connector) as count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_connect_search_env = new SearchManager({
            "id": "search_connect_search_env",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | fillnull value=\"unknown\" env | stats count by env | fields env | dedup env | sort 0 env",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_connect_search_label = new SearchManager({
            "id": "search_connect_search_label",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | fillnull value=\"unknown\" label | stats count by label | fields label | dedup label | sort 0 label",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_connect_main_table = new SearchManager({
            "id": "search_connect_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_connect_tasks_monitoring | eval keyid = _key | fillnull value=\"unknown\" env, label | append [ | mstats latest(_value) as task_state_id where `telegraf_kafka_index` metric_name=\"kafka_connect.connector-task.status\" connector=* by connector, env, label, jolokia_agent_url, task span=1s | stats min(task_state_id) as task_state_id by env, label, connector | eval task_state=case(task_state_id=0, \"paused\", task_state_id=1, \"running\", task_state_id=2, \"unassigned\", task_state_id=3, \"failed\", task_state_id=4, \"destroyed\") ] | stats values(*) as \"*\" by env, label, connector  | search $search_tk_connect_env$ $search_tk_connect_label$ $search_tk_connect_connector$ $search_tk_connect_role$ $search_tk_connect_monitoring_state$ | fields keyid, env, label, connector, role, grace_period, task_state, monitoring_state | sort 0 env, label, connector | eval range=if(monitoring_state=\"enabled\", \"low\", \"severe\")",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // KAFKA BURROW
        //

var search_burrow_no_consumers = new SearchManager({
            "id": "search_burrow_no_consumers",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_burrow_no_consumers_enabled = new SearchManager({
            "id": "search_burrow_no_consumers_enabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | where monitoring_state=\"enabled\" | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_burrow_no_consumers_disabled = new SearchManager({
            "id": "search_burrow_no_consumers_disabled",
            "sample_ratio": null,
            "earliest_time": "-24h@h",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | where monitoring_state!=\"enabled\" | stats count",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

var search_burrow_search_env = new SearchManager({
            "id": "search_burrow_search_env",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | fillnull value=\"unknown\" env | stats count by env | fields env | dedup env | sort 0 env",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_burrow_search_label = new SearchManager({
            "id": "search_burrow_search_label",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | fillnull value=\"unknown\" label | stats count by label | fields label | dedup label | sort 0 label",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_burrow_search_cluster = new SearchManager({
            "id": "search_burrow_search_cluster",
            "earliest_time": "-24h@h",
            "status_buckets": 0,
            "sample_ratio": null,
            "latest_time": "now",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | stats count by cluster | fields cluster | dedup cluster | sort 0 cluster",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

var search_burrow_main_table = new SearchManager({
            "id": "search_burrow_main_table",
            "sample_ratio": 1,
            "earliest_time": "-15m",
            "cancelOnUnload": true,
            "search": "| inputlookup kafka_burrow_consumers_monitoring | eval keyid = _key | fillnull value=\"unknown\" env, label | search $search_tk_burrow_env$ $search_tk_burrow_label$ $search_tk_burrow_cluster$ $search_tk_burrow_monitoring_state$ $search_tk_burrow_name$ | fields keyid, env, label, cluster, group, monitoring_state | sort 0 env, label, cluster, group | eval range=if(monitoring_state=\"enabled\", \"low\", \"severe\")",
            "latest_time": "now",
            "status_buckets": 0,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        //
        // SPLUNK LAYOUT
        //

        $('header').remove();
        new LayoutView({"hideAppBar": false, "hideChrome": false, "hideSplunkBar": false})
            .render()
            .getContainerElement()
            .appendChild($('.dashboard-body')[0]);

        //
        // DASHBOARD EDITOR
        //

        new Dashboard({
            id: 'dashboard',
            el: $('.dashboard-body'),
            showTitle: true,
            editable: false
        }, {tokens: true}).render();


        //
        // VIEWS: VISUALIZATION ELEMENTS
        //

        //
        // ALERT SUMMARY
        //

        var element_kafka_alerts_main_table = new TableElement({
            "id": "element_kafka_alerts_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "fields": "title, cron_schedule, schedule_window, alert.suppress.fields, alert.suppress.period, disabled, next_scheduled_time,range",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_kafka_alerts_main_table",
            "el": $('#element_kafka_alerts_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_kafka_alerts_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/telegraf-kafka/alert?s=%2FservicesNS%2Fnobody%2Ftelegraf-kafka%2Fsaved%2Fsearches%2F$row.id$", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
                utils.redirect(url, false, "_blank");
            }
        });

        //
        // MAINTENANCE MODE
        //

        var element_maintenance_state = new SingleElement({
            "id": "element_maintenance_state",
            "drilldown": "none",
            "colorMode": "block",
            "link.visible": "false",
            "numberPrecision": "0",
            "useColors": "0",
            "underLabel": "MAINTENANCE MODE STATUS",
            "colorBy": "value",
            "height": "60",
            "managerid": "search_maintenance_state",
            "el": $('#element_maintenance_state')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_maintenance_state_reactivation = new SingleElement({
            "id": "element_maintenance_state_reactivation",
            "drilldown": "none",
            "colorMode": "block",
            "link.visible": "false",
            "numberPrecision": "0",
            "useColors": "0",
            "underLabel": "ESTIMATED DATE FOR AUTO-DEACTIVATION OF THE MAINTENANCE MODE",
            "colorBy": "value",
            "height": "60",
            "managerid": "search_maintenance_state_reactivation",
            "el": $('#element_maintenance_state_reactivation')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        //
        // KAFKA INFRA
        //

        var element_kafka_infra_single1 = new SingleElement({
            "id": "element_kafka_infra_single1",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL COMPONENTS DISCOVERED",
            "drilldown": "none",
            "managerid": "search_kafka_infra_no_components",
            "el": $('#element_kafka_infra_single1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_single2 = new SingleElement({
            "id": "element_kafka_infra_single2",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL COMPONENTS MONITORED",
            "drilldown": "none",
            "managerid": "search_kafka_infra_no_components_enabled",
            "el": $('#element_kafka_infra_single2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_single3 = new SingleElement({
            "id": "element_kafka_infra_single3",
            "underLabel": "UN-MONITORED COMPONENTS",
            "showSparkline": "1",
            "trellis.enabled": "0",
            "rangeValues": "[0]",
            "rangeColors": "[\"0x53a051\",\"0xf1813f\"]",
            "colorMode": "none",
            "trellis.scales.shared": "1",
            "useThousandSeparators": "1",
            "showTrendIndicator": "1",
            "trendDisplayMode": "absolute",
            "trellis.size": "medium",
            "drilldown": "none",
            "numberPrecision": "0",
            "trendColorInterpretation": "standard",
            "useColors": "1",
            "colorBy": "value",
            "unitPosition": "after",
            "managerid": "search_kafka_infra_no_components_disabled",
            "el": $('#element_kafka_infra_single3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_main_table = new TableElement({
            "id": "element_kafka_infra_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "fields": "keyid, env, label, name, role, monitoring_state, range, grace_period, lasttime",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_kafka_infra_main_table",
            "el": $('#element_kafka_infra_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_kafka_infra_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                setToken("form.tk_kafka_infra_keyid", TokenUtils.replaceTokenNames("$row.keyid$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_name", TokenUtils.replaceTokenNames("$row.name$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_role", TokenUtils.replaceTokenNames("$row.role$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_env", TokenUtils.replaceTokenNames("$row.env$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_label", TokenUtils.replaceTokenNames("$row.label$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_kafka_infra_grace_period", TokenUtils.replaceTokenNames("$row.grace_period$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_kafka_infra_monitoring_state", TokenUtils.replaceTokenNames("$row.monitoring_state$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_lasttime", TokenUtils.replaceTokenNames("$row.lasttime_epoch$", _.extend(submittedTokenModel.toJSON(), e.data)));
            }
        });

        //
        // KAFKA INFRA NODES
        //

        var element_kafka_infra_nodes_single1 = new SingleElement({
            "id": "element_kafka_infra_nodes_single1",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL COMPONENT ROLES DISCOVERED",
            "drilldown": "none",
            "managerid": "search_kafka_infra_nodes_no_components",
            "el": $('#element_kafka_infra_nodes_single1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_nodes_single2 = new SingleElement({
            "id": "element_kafka_infra_nodes_single2",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL COMPONENT ROLES MONITORED",
            "drilldown": "none",
            "managerid": "search_kafka_infra_nodes_no_components_enabled",
            "el": $('#element_kafka_infra_nodes_single2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_nodes_single3 = new SingleElement({
            "id": "element_kafka_infra_nodes_single3",
            "underLabel": "UN-MONITORED COMPONENT ROLES",
            "showSparkline": "1",
            "trellis.enabled": "0",
            "rangeValues": "[0]",
            "rangeColors": "[\"0x53a051\",\"0xf1813f\"]",
            "colorMode": "none",
            "trellis.scales.shared": "1",
            "useThousandSeparators": "1",
            "showTrendIndicator": "1",
            "trendDisplayMode": "absolute",
            "trellis.size": "medium",
            "drilldown": "none",
            "numberPrecision": "0",
            "trendColorInterpretation": "standard",
            "useColors": "1",
            "colorBy": "value",
            "unitPosition": "after",
            "managerid": "search_kafka_infra_nodes_no_components_disabled",
            "el": $('#element_kafka_infra_nodes_single3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_infra_nodes_main_table = new TableElement({
            "id": "element_kafka_infra_nodes_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_kafka_infra_nodes_main_table",
            "el": $('#element_kafka_infra_nodes_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_kafka_infra_nodes_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                setToken("form.tk_kafka_infra_nodes_keyid", TokenUtils.replaceTokenNames("$row.keyid$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_nodes_role", TokenUtils.replaceTokenNames("$row.role$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_nodes_env", TokenUtils.replaceTokenNames("$row.env$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_nodes_label", TokenUtils.replaceTokenNames("$row.label$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_infra_nodes_current_nodes_number", TokenUtils.replaceTokenNames("$row.current_nodes_number$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_kafka_infra_nodes_minimal_nodes_number", TokenUtils.replaceTokenNames("$row.minimal_nodes_number$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_kafka_infra_nodes_monitoring_state", TokenUtils.replaceTokenNames("$row.monitoring_state$", _.extend(submittedTokenModel.toJSON(), e.data)));
            }
        });

        //
        // KAFKA TOPICS
        //

        var element_kafka_topics_single1 = new SingleElement({
            "id": "element_kafka_topics_single1",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL TOPICS DISCOVERED",
            "drilldown": "none",
            "managerid": "search_kafka_topics_no_components",
            "el": $('#element_kafka_topics_single1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_topics_single2 = new SingleElement({
            "id": "element_kafka_topics_single2",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL TOPICS MONITORED",
            "drilldown": "none",
            "managerid": "search_kafka_topics_no_components_enabled",
            "el": $('#element_kafka_topics_single2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_topics_single3 = new SingleElement({
            "id": "element_kafka_topics_single3",
            "underLabel": "UN-MONITORED TOPICS",
            "showSparkline": "1",
            "trellis.enabled": "0",
            "rangeValues": "[0]",
            "rangeColors": "[\"0x53a051\",\"0xf1813f\"]",
            "colorMode": "none",
            "trellis.scales.shared": "1",
            "useThousandSeparators": "1",
            "showTrendIndicator": "1",
            "trendDisplayMode": "absolute",
            "trellis.size": "medium",
            "drilldown": "none",
            "numberPrecision": "0",
            "trendColorInterpretation": "standard",
            "useColors": "1",
            "colorBy": "value",
            "unitPosition": "after",
            "managerid": "search_kafka_topics_no_components_disabled",
            "el": $('#element_kafka_topics_single3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_kafka_topics_main_table = new TableElement({
            "id": "element_kafka_topics_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_kafka_topics_main_table",
            "el": $('#element_kafka_topics_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_kafka_topics_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                setToken("form.tk_kafka_topics_keyid", TokenUtils.replaceTokenNames("$row.keyid$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_topics_name", TokenUtils.replaceTokenNames("$row.topic$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_topics_env", TokenUtils.replaceTokenNames("$row.env$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_kafka_topics_label", TokenUtils.replaceTokenNames("$row.label$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_kafka_topics_monitoring_state", TokenUtils.replaceTokenNames("$row.monitoring_state$", _.extend(submittedTokenModel.toJSON(), e.data)));
            }
        });

        //
        // KAFKA CONNECT
        //

        var element_connect_single1 = new SingleElement({
            "id": "element_connect_single1",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL CONNECTORS DISCOVERED",
            "drilldown": "none",
            "managerid": "search_connect_no_connectors",
            "el": $('#element_connect_single1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_connect_single2 = new SingleElement({
            "id": "element_connect_single2",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL CONNECTORS MONITORED",
            "drilldown": "none",
            "managerid": "search_connect_no_connectors_enabled",
            "el": $('#element_connect_single2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_connect_single3 = new SingleElement({
            "id": "element_connect_single3",
            "underLabel": "UN-MONITORED CONNECTORS",
            "showSparkline": "1",
            "trellis.enabled": "0",
            "rangeValues": "[0]",
            "rangeColors": "[\"0x53a051\",\"0xf1813f\"]",
            "colorMode": "none",
            "trellis.scales.shared": "1",
            "useThousandSeparators": "1",
            "showTrendIndicator": "1",
            "trendDisplayMode": "absolute",
            "trellis.size": "medium",
            "drilldown": "none",
            "numberPrecision": "0",
            "trendColorInterpretation": "standard",
            "useColors": "1",
            "colorBy": "value",
            "unitPosition": "after",
            "managerid": "search_connect_no_connectors_disabled",
            "el": $('#element_connect_single3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_connect_main_table = new TableElement({
            "id": "element_connect_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_connect_main_table",
            "el": $('#element_connect_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_connect_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                setToken("form.tk_connect_keyid", TokenUtils.replaceTokenNames("$row.keyid$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_connector", TokenUtils.replaceTokenNames("$row.connector$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_role", TokenUtils.replaceTokenNames("$row.role$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_connect_env", TokenUtils.replaceTokenNames("$row.env$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_connect_label", TokenUtils.replaceTokenNames("$row.label$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_connect_grace_period", TokenUtils.replaceTokenNames("$row.grace_period$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_connect_monitoring_state", TokenUtils.replaceTokenNames("$row.monitoring_state$", _.extend(submittedTokenModel.toJSON(), e.data)));
            }
        });

        //
        // KAFKA BURROW
        //

        var element_burrow_single1 = new SingleElement({
            "id": "element_burrow_single1",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL CONSUMERS DISCOVERED",
            "drilldown": "none",
            "managerid": "search_burrow_no_consumers",
            "el": $('#element_burrow_single1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_burrow_single2 = new SingleElement({
            "id": "element_burrow_single2",
            "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
            "underLabel": "TOTAL CONSUMERS MONITORED",
            "drilldown": "none",
            "managerid": "search_burrow_no_consumers_enabled",
            "el": $('#element_burrow_single2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_burrow_single3 = new SingleElement({
            "id": "element_burrow_single3",
            "underLabel": "UN-MONITORED CONSUMERS",
            "showSparkline": "1",
            "trellis.enabled": "0",
            "rangeValues": "[0]",
            "rangeColors": "[\"0x53a051\",\"0xf1813f\"]",
            "colorMode": "none",
            "trellis.scales.shared": "1",
            "useThousandSeparators": "1",
            "showTrendIndicator": "1",
            "trendDisplayMode": "absolute",
            "trellis.size": "medium",
            "drilldown": "none",
            "numberPrecision": "0",
            "trendColorInterpretation": "standard",
            "useColors": "1",
            "colorBy": "value",
            "unitPosition": "after",
            "managerid": "search_burrow_no_consumers_disabled",
            "el": $('#element_burrow_single3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        var element_burrow_main_table = new TableElement({
            "id": "element_burrow_main_table",
            "count": 100,
            "dataOverlayMode": "none",
            "drilldown": "row",
            "percentagesRow": "false",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search_burrow_main_table",
            "el": $('#element_burrow_main_table')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        element_burrow_main_table.on("click", function(e) {
            if (e.field !== undefined) {
                e.preventDefault();
                setToken("form.tk_burrow_keyid", TokenUtils.replaceTokenNames("$row.keyid$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_burrow_env", TokenUtils.replaceTokenNames("$row.env$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_burrow_label", TokenUtils.replaceTokenNames("$row.label$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_burrow_cluster", TokenUtils.replaceTokenNames("$row.cluster$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("tk_burrow_group", TokenUtils.replaceTokenNames("$row.group$", _.extend(submittedTokenModel.toJSON(), e.data)));
                setToken("form.modify_tk_burrow_monitoring_state", TokenUtils.replaceTokenNames("$row.monitoring_state$", _.extend(submittedTokenModel.toJSON(), e.data)));
            }
        });

        //
        //
        //

        // Initialize time tokens to default
        if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
            defaultTokenModel.set({ earliest: '0', latest: '' });
        }

        submitTokens();

        //
        // VIEWS: FORM INPUTS
        //

        //
        // link-input
        //

        var inputlink1 = new LinkListInput({
            "id": "inputlink1",
            "choices": [
                {"value": "selection1", "label": "ALERT CONFIGURATION SUMMARY"},
                {"value": "selection2", "label": "STALE METRICS MONITORING PER COMPONENT"},
                {"value": "selection3", "label": "STALE METRICS MONITORING PER NUMBER OF NODES"},
                {"value": "selection4", "label": "KAFKA TOPICS MONITORING"},
                {"value": "selection5", "label": "KAFKA CONNECT TASKS MONITORING"},
                {"value": "selection6", "label": "KAFKA CONSUMER GROUP MONITORING"}
            ],
            "default": "selection1",
            "searchWhenChanged": true,
            "selectFirstChoice": false,
            "value": "$form.tabs_linkinput$",
            "el": $('#inputlink1')
        }, {tokens: true}).render();

        inputlink1.on("change", function(newValue) {
            FormUtils.handleValueChange(inputlink1);
        });

        inputlink1.on("valueChange", function(e) {
            if (e.value === "selection1") {
                EventHandler.setToken("selection1", "true", {}, e.data);
                EventHandler.unsetToken("selection2");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection5");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection2") {
                EventHandler.setToken("selection2", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection5");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection2") {
                EventHandler.setToken("selection2", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection5");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection3") {
                EventHandler.setToken("selection3", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection2");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection5");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection4") {
                EventHandler.setToken("selection4", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection2");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection5");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection5") {
                EventHandler.setToken("selection5", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection2");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection6");
            } else if (e.value === "selection6") {
                EventHandler.setToken("selection6", "true", {}, e.data);
                EventHandler.unsetToken("selection1");
                EventHandler.unsetToken("selection2");
                EventHandler.unsetToken("selection3");
                EventHandler.unsetToken("selection4");
                EventHandler.unsetToken("selection5");
            }
        });

        //
        // KAFKA INFRA
        //

        var input_kafka_infra_search_name = new TextInput({
            "id": "input_kafka_infra_search_name",
            "searchWhenChanged": true,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "name=\"",
            "value": "$form.search_tk_kafka_infra_name$",
            "el": $('#input_kafka_infra_search_name')
        }, {tokens: true}).render();

        input_kafka_infra_search_name.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_search_name);
        });

        var input_kafka_infra_search_env = new DropdownInput({
            "id": "input_kafka_infra_search_env",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "env",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "env=\"",
            "valueField": "env",
            "value": "$form.search_tk_kafka_infra_env$",
            "managerid": "search_kafka_infra_search_env",
            "el": $('#input_kafka_infra_search_env')
        }, {tokens: true}).render();

        input_kafka_infra_search_env.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_search_env);
        });

        var input_kafka_infra_search_label = new DropdownInput({
            "id": "input_kafka_infra_search_label",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "label",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "label=\"",
            "valueField": "label",
            "value": "$form.search_tk_kafka_infra_label$",
            "managerid": "search_kafka_infra_search_label",
            "el": $('#input_kafka_infra_search_label')
        }, {tokens: true}).render();

        input_kafka_infra_search_label.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_search_label);
        });

        var input_kafka_infra_search_role = new DropdownInput({
            "id": "input_kafka_infra_search_role",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "zookeeper", "value": "zookeeper"},
                {"label": "kafka_broker", "value": "kafka_broker"},
                {"label": "kafka_connect", "value": "kafka_connect"},
                {"label": "schema-registry", "value": "schema-registry"},
                {"label": "ksql-server", "value": "ksql-server"},
                {"label": "kafka_rest", "value": "kafka_rest"},
                {"label": "kafka_linkedin_monitor", "value": "kafka_linkedin_monitor"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "role=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_kafka_infra_role$",
            "el": $('#input_kafka_infra_search_role')
        }, {tokens: true}).render();

        input_kafka_infra_search_role.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_search_role);
        });

        var input_kafka_infra_search_monitoring_state = new DropdownInput({
            "id": "input_kafka_infra_search_monitoring_state",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "monitoring_state=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_kafka_infra_monitoring_state$",
            "el": $('#input_kafka_infra_search_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_infra_search_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_search_monitoring_state);
        });

        var input_kafka_infra_modify_grace_period = new TextInput({
            "id": "input_kafka_infra_modify_grace_period",
            "searchWhenChanged": true,
            "value": "$form.modify_tk_kafka_infra_grace_period$",
            "el": $('#input_kafka_infra_modify_grace_period')
        }, {tokens: true}).render();

        input_kafka_infra_modify_grace_period.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_modify_grace_period);
        });

        var input_kafka_infra_modify_monitoring_state = new DropdownInput({
            "id": "input_kafka_infra_modify_monitoring_state",
            "choices": [
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "enabled",
            "initialValue": "enabled",
            "selectFirstChoice": false,
            "showClearButton": false,
            "value": "$form.modify_tk_kafka_infra_monitoring_state$",
            "el": $('#input_kafka_infra_modify_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_infra_modify_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_modify_monitoring_state);
        });

        var input_kafka_infra_delete = new TextInput({
            "id": "input_kafka_infra_delete",
            "searchWhenChanged": true,
            "value": "$form.tk_kafka_infra_keyid$",
            "el": $('#input_kafka_infra_delete')
        }, {tokens: true}).render();

        input_kafka_infra_delete.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_delete);
        });

        //
        // KAFKA INFRA NODES
        //

        var input_kafka_infra_nodes_search_env = new DropdownInput({
            "id": "input_kafka_infra_nodes_search_env",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "env",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "env=\"",
            "valueField": "env",
            "value": "$form.search_tk_kafka_infra_nodes_env$",
            "managerid": "search_kafka_infra_nodes_search_env",
            "el": $('#input_kafka_infra_nodes_search_env')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_search_env.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_search_env);
        });

        var input_kafka_infra_nodes_search_label = new DropdownInput({
            "id": "input_kafka_infra_nodes_search_label",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "label",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "label=\"",
            "valueField": "label",
            "value": "$form.search_tk_kafka_infra_nodes_label$",
            "managerid": "search_kafka_infra_nodes_search_label",
            "el": $('#input_kafka_infra_nodes_search_label')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_search_label.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_search_label);
        });

        var input_kafka_infra_nodes_search_role = new DropdownInput({
            "id": "input_kafka_infra_nodes_search_role",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "zookeeper", "value": "zookeeper"},
                {"label": "kafka_broker", "value": "kafka_broker"},
                {"label": "kafka_connect", "value": "kafka_connect"},
                {"label": "schema-registry", "value": "schema-registry"},
                {"label": "ksql-server", "value": "ksql-server"},
                {"label": "kafka_rest", "value": "kafka_rest"},
                {"label": "kafka_linkedin_monitor", "value": "kafka_linkedin_monitor"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "role=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_kafka_infra_nodes_role$",
            "el": $('#input_kafka_infra_nodes_search_role')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_search_role.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_search_role);
        });

        var input_kafka_infra_nodes_search_monitoring_state = new DropdownInput({
            "id": "input_kafka_infra_nodes_search_monitoring_state",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "monitoring_state=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_kafka_infra_nodes_monitoring_state$",
            "el": $('#input_kafka_infra_nodes_search_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_search_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_search_monitoring_state);
        });

        var input_kafka_infra_nodes_modify_minimal_nodes_number = new TextInput({
            "id": "input_kafka_infra_nodes_modify_minimal_nodes_number",
            "searchWhenChanged": true,
            "value": "$form.modify_tk_kafka_infra_nodes_minimal_nodes_number$",
            "el": $('#input_kafka_infra_nodes_modify_minimal_nodes_number')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_modify_minimal_nodes_number.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_modify_minimal_nodes_number);
        });

        var input_kafka_infra_nodes_modify_monitoring_state = new DropdownInput({
            "id": "input_kafka_infra_nodes_modify_monitoring_state",
            "choices": [
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "enabled",
            "initialValue": "enabled",
            "selectFirstChoice": true,
            "showClearButton": false,
            "value": "$form.modify_tk_kafka_infra_nodes_monitoring_state$",
            "el": $('#input_kafka_infra_nodes_modify_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_modify_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_modify_monitoring_state);
        });

        var input_kafka_infra_nodes_delete = new TextInput({
            "id": "input_kafka_infra_nodes_delete",
            "searchWhenChanged": true,
            "value": "$form.tk_kafka_infra_nodes_keyid$",
            "el": $('#input_kafka_infra_nodes_delete')
        }, {tokens: true}).render();

        input_kafka_infra_nodes_delete.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_infra_nodes_delete);
        });

        //
        // KAFKA TOPICS
        //

        var input_kafka_topics_search_name = new TextInput({
            "id": "input_kafka_topics_search_name",
            "searchWhenChanged": true,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "topic=\"",
            "value": "$form.search_tk_kafka_topics_name$",
            "el": $('#input_kafka_topics_search_name')
        }, {tokens: true}).render();

        input_kafka_topics_search_name.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_search_name);
        });

        var input_kafka_topics_search_env = new DropdownInput({
            "id": "input_kafka_topics_search_env",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "env",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "env=\"",
            "valueField": "env",
            "value": "$form.search_tk_kafka_topics_env$",
            "managerid": "search_kafka_topics_search_env",
            "el": $('#input_kafka_topics_search_env')
        }, {tokens: true}).render();

        input_kafka_topics_search_env.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_search_env);
        });

        var input_kafka_topics_search_label = new DropdownInput({
            "id": "input_kafka_topics_search_label",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "label",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "label=\"",
            "valueField": "label",
            "value": "$form.search_tk_kafka_topics_label$",
            "managerid": "search_kafka_topics_search_label",
            "el": $('#input_kafka_topics_search_label')
        }, {tokens: true}).render();

        input_kafka_topics_search_label.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_search_label);
        });

        var input_kafka_topics_search_monitoring_state = new DropdownInput({
            "id": "input_kafka_topics_search_monitoring_state",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "monitoring_state=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_kafka_topics_monitoring_state$",
            "el": $('#input_kafka_topics_search_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_topics_search_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_search_monitoring_state);
        });

        var input_kafka_topics_modify_monitoring_state = new DropdownInput({
            "id": "input_kafka_topics_modify_monitoring_state",
            "choices": [
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "enabled",
            "initialValue": "enabled",
            "selectFirstChoice": false,
            "showClearButton": false,
            "value": "$form.modify_tk_kafka_topics_monitoring_state$",
            "el": $('#input_kafka_topics_modify_monitoring_state')
        }, {tokens: true}).render();

        input_kafka_topics_modify_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_modify_monitoring_state);
        });

        var input_kafka_topics_delete = new TextInput({
            "id": "input_kafka_topics_delete",
            "searchWhenChanged": true,
            "value": "$form.tk_kafka_topics_keyid$",
            "el": $('#input_kafka_topics_delete')
        }, {tokens: true}).render();

        input_kafka_topics_delete.on("change", function(newValue) {
            FormUtils.handleValueChange(input_kafka_topics_delete);
        });

        //
        // KAFKA CONNECT
        //

        var input_connect_search_connector = new TextInput({
            "id": "input_connect_search_connector",
            "searchWhenChanged": true,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "connector=\"",
            "value": "$form.search_tk_connect_connector$",
            "el": $('#input_connect_search_connector')
        }, {tokens: true}).render();

        input_connect_search_connector.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_search_connector);
        });

        var input_connect_search_env = new DropdownInput({
            "id": "input_connect_search_env",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "env",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "env=\"",
            "valueField": "env",
            "value": "$form.search_tk_connect_env$",
            "managerid": "search_connect_search_env",
            "el": $('#input_connect_search_env')
        }, {tokens: true}).render();

        input_connect_search_env.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_search_env);
        });

        var input_connect_search_label = new DropdownInput({
            "id": "input_connect_search_label",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "label",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "label=\"",
            "valueField": "label",
            "value": "$form.search_tk_connect_label$",
            "managerid": "search_connect_search_label",
            "el": $('#input_connect_search_label')
        }, {tokens: true}).render();

        input_connect_search_label.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_search_label);
        });

        var input_connect_search_task = new DropdownInput({
            "id": "input_connect_search_task",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "kafka_source_task", "value": "kafka_source_task"},
                {"label": "kafka_sink_task", "value": "kafka_sink_task"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "role=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_connect_role$",
            "el": $('#input_connect_search_task')
        }, {tokens: true}).render();

        input_connect_search_task.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_search_task);
        });

        var input_connect_search_monitoring_state = new DropdownInput({
            "id": "input_connect_search_monitoring_state",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "monitoring_state=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_connect_monitoring_state$",
            "el": $('#input_connect_search_monitoring_state')
        }, {tokens: true}).render();

        input_connect_search_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_search_monitoring_state);
        });

        var input_connect_modify_grace_period = new TextInput({
            "id": "input_connect_modify_grace_period",
            "searchWhenChanged": true,
            "value": "$form.modify_tk_connect_grace_period$",
            "el": $('#input_connect_modify_grace_period')
        }, {tokens: true}).render();

        input_connect_modify_grace_period.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_modify_grace_period);
        });

        var input_connect_modify_monitoring_state = new DropdownInput({
            "id": "input_connect_modify_monitoring_state",
            "choices": [
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "enabled",
            "initialValue": "enabled",
            "selectFirstChoice": false,
            "showClearButton": false,
            "value": "$form.modify_tk_connect_monitoring_state$",
            "el": $('#input_connect_modify_monitoring_state')
        }, {tokens: true}).render();

        input_connect_modify_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_modify_monitoring_state);
        });

        var input_connect_delete = new TextInput({
            "id": "input_connect_delete",
            "searchWhenChanged": true,
            "value": "$form.tk_connect_keyid$",
            "el": $('#input_connect_delete')
        }, {tokens: true}).render();

        input_connect_delete.on("change", function(newValue) {
            FormUtils.handleValueChange(input_connect_delete);
        });

        //
        // BURROW
        //

        var input_burrow_search_env = new DropdownInput({
            "id": "input_burrow_search_env",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "env",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "env=\"",
            "valueField": "env",
            "value": "$form.search_tk_burrow_env$",
            "managerid": "search_burrow_search_env",
            "el": $('#input_burrow_search_env')
        }, {tokens: true}).render();

        input_burrow_search_env.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_search_env);
        });

        var input_burrow_search_label = new DropdownInput({
            "id": "input_burrow_search_label",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "label",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "label=\"",
            "valueField": "label",
            "value": "$form.search_tk_burrow_label$",
            "managerid": "search_burrow_search_label",
            "el": $('#input_burrow_search_label')
        }, {tokens: true}).render();

        input_burrow_search_label.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_search_label);
        });

        var input_burrow_search_cluster = new DropdownInput({
            "id": "input_burrow_search_cluster",
            "choices": [
                {"value": "*", "label": "ANY"}
            ],
            "default": "*",
            "searchWhenChanged": true,
            "labelField": "cluster",
            "showClearButton": true,
            "selectFirstChoice": false,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "cluster=\"",
            "valueField": "cluster",
            "value": "$form.search_tk_burrow_cluster$",
            "managerid": "search_burrow_search_cluster",
            "el": $('#input_burrow_search_cluster')
        }, {tokens: true}).render();

        input_burrow_search_cluster.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_search_cluster);
        });

        var input_burrow_search_monitoring_state = new DropdownInput({
            "id": "input_burrow_search_monitoring_state",
            "choices": [
                {"label": "ANY", "value": "*"},
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "*",
            "prefix": "monitoring_state=\"",
            "initialValue": "*",
            "selectFirstChoice": false,
            "suffix": "\"",
            "showClearButton": true,
            "value": "$form.search_tk_burrow_monitoring_state$",
            "el": $('#input_burrow_search_monitoring_state')
        }, {tokens: true}).render();

        input_burrow_search_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_search_monitoring_state);
        });

        var input_burrow_modify_monitoring_state = new DropdownInput({
            "id": "input_burrow_modify_monitoring_state",
            "choices": [
                {"label": "enabled", "value": "enabled"},
                {"label": "disabled", "value": "disabled"}
            ],
            "searchWhenChanged": true,
            "default": "enabled",
            "initialValue": "enabled",
            "selectFirstChoice": false,
            "showClearButton": false,
            "value": "$form.modify_tk_burrow_monitoring_state$",
            "el": $('#input_burrow_modify_monitoring_state')
        }, {tokens: true}).render();

        input_burrow_modify_monitoring_state.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_modify_monitoring_state);
        });

        var input_burrow_delete = new TextInput({
            "id": "input_burrow_delete",
            "searchWhenChanged": true,
            "value": "$form.tk_burrow_keyid$",
            "el": $('#input_burrow_delete')
        }, {tokens: true}).render();

        input_burrow_delete.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_delete);
        });

        var input_burrow_search_name = new TextInput({
            "id": "input_burrow_search_name",
            "searchWhenChanged": true,
            "initialValue": "*",
            "suffix": "\"",
            "prefix": "group=\"",
            "value": "$form.search_tk_burrow_name$",
            "el": $('#input_burrow_search_name')
        }, {tokens: true}).render();

        input_burrow_search_name.on("change", function(newValue) {
            FormUtils.handleValueChange(input_burrow_search_name);
        });

        //
        // others
        //

        DashboardController.onReady(function() {
            if (!submittedTokenModel.has('earliest') && !submittedTokenModel.has('latest')) {
                submittedTokenModel.set({ earliest: '0', latest: '' });
            }
        });

        // Initialize time tokens to default
        if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
            defaultTokenModel.set({ earliest: '0', latest: '' });
        }

        if (!_.isEmpty(urlTokenModel.toJSON())){
            submitTokens();
        }

        //
        // DASHBOARD READY
        //

        DashboardController.ready();
        pageLoading = false;

        //
        // SERVICE OBJECT
        //

        // Create a service object using the Splunk SDK for JavaScript
        // to send REST requests
        var service = mvc.createService({ owner: "nobody" });

        //
        // ALERT SUMMARY
        //

        $("#btn_refresh_kafka_alerts").click(function() {
            submitTokens();
            search_kafka_alerts_main_table.startSearch();
        });

        //
        // MAINTENANCE MODE
        //

        //
        // ENABLE MAINTENANCE MODE BUTTON
        //

        $("#btn_enable_maintenance").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            //
            // Verify the current status
            //

            // Define the query
            var searchQuery = "| inputlookup kafka_alerting_maintenance";

            // Set the search parameters--specify a time range
            var searchParams = {
              earliest_time: "-60m",
              latest_time: "now"
            };

            // Run a oneshot search that returns the job's results

            service.oneshotSearch(
              searchQuery,
              searchParams,
              function(err, results) {
                // Display the results
                var fields = results.fields;
                var rows = results.rows;
                var current_maintenance_mode;
                var current_time_updated;

                for(var i = 0; i < rows.length; i++) {
                  var values = rows[i];
                  // console.log("Row " + i + ": ");

                  for(var j = 0; j < values.length; j++) {
                    var field = fields[j];

                    if (fields[j]=="maintenance_mode") {
                      current_maintenance_mode = values[j];
                    }
                    if (fields[j]=="time_updated") {
                      current_time_updated = values[j];
                    }

                    // console.log("current_maintenance_mode: " + current_maintenance_mode + " ,current_time_updated: " + current_time_updated);
                  }
                }

                if (!current_maintenance_mode) {
                    return;
                }

                if (current_maintenance_mode=="enabled") {
                    // Show an error message
                    $("#maintenance_mode_already_enabled").modal()
                    return;
                }

                else

                {

                    $("#enable_maintenance_endtime").modal()

                    // Disabled past selection
                    $(function(){
                        var dtToday = new Date();

                        var month = dtToday.getMonth() + 1;
                        var day = dtToday.getDate();
                        var year = dtToday.getFullYear();
                        if(month < 10)
                            month = '0' + month.toString();
                        if(day < 10)
                            day = '0' + day.toString();

                        var maxDate = year + '-' + month + '-' + day;
                        $('#inputEndMaintenance').attr('min', maxDate);
                    });

                    $("#btn_enable_maintenance_endtime").click(function() {

                        // Retrieve end date
                        var inputEndMaintenance = document.getElementById("inputEndMaintenance").value;

                        // Retrieve end time
                        var inputEndMaintenanceTime = tokens.get("time_end_maintenance");

                        // console.log("inputEndMaintenance is " + inputEndMaintenance + " at: " + inputEndMaintenanceTime);

                        // Validation submitted with no date entry
                        if (!inputEndMaintenance || inputEndMaintenance == "YYYY-MM-DD" || !inputEndMaintenanceTime) {
                            $("#maintenance_mode_data_is_invalid").modal()
                            return;
                        }

                        // console.log("inputEndMaintenance is: " + inputEndMaintenance);

                        if (inputEndMaintenance) {

                            //
                            // Verify that the selection is not in the past time
                            //

                            // Define the query
                            var searchQuery = "| makeresults | eval end_date=\"" + inputEndMaintenance + "\", end_time=\"" + inputEndMaintenanceTime + "\" | eval maintenance_mode_end=end_date . \" \" . end_time | eval maintenance_mode_end=round(strptime(maintenance_mode_end, \"%Y-%m-%d %H:%M\"), 0), now=now() | eval is_in_the_past=if(now>=maintenance_mode_end, \"true\", \"false\") | fields - _time | fields is_in_the_past";

                            // Set the search parameters--specify a time range
                            var searchParams = {
                              earliest_time: "-60m",
                              latest_time: "now"
                            };

                            // Run a oneshot search that returns the job's results

                            service.oneshotSearch(
                              searchQuery,
                              searchParams,
                              function(err, results) {
                                // Display the results
                                var fields = results.fields;
                                var rows = results.rows;
                                var is_in_the_past;

                                for(var i = 0; i < rows.length; i++) {
                                  var values = rows[i];
                                  // console.log("Row " + i + ": ");

                                  for(var j = 0; j < values.length; j++) {
                                    var field = fields[j];

                                    if (fields[j]=="is_in_the_past") {
                                      is_in_the_past = values[j];
                                    }

                                    // console.log("is_in_the_past is: " + is_in_the_past);
                                  }
                                }

                                if (is_in_the_past === "true") {
                                    $("#maintenance_mode_data_is_past").modal()
                                    return;
                                }

                                else {

                                    //console.log("date is not in the past, enable now.");

                                    // console.log("Enable maintenance mode now");
                                    var searchQuery = "| makeresults | eval maintenance_mode=\"enabled\", time_updated=now(), end_date=\"" + inputEndMaintenance + "\", end_time=\"" + inputEndMaintenanceTime + "\" | eval maintenance_mode_end=end_date . \" \" . end_time | eval maintenance_mode_end=round(strptime(maintenance_mode_end, \"%Y-%m-%d %H:%M\"), 0) | fields - _time | fields maintenance_mode, time_updated, maintenance_mode_end | outputlookup kafka_alerting_maintenance";

                                    // console.log("searchQuery is " + searchQuery);

                                    // Set the search parameters--specify a time range
                                    var searchParams = {
                                      earliest_time: "-60m",
                                      latest_time: "now"
                                    };

                                    // Run a oneshot search that returns the job's results
                                    service.oneshotSearch(
                                      searchQuery,
                                      searchParams,
                                      function(err, results) {
                                        // Update single
                                        search_maintenance_state.startSearch();
                                        search_maintenance_mode_state.startSearch();
                                      }
                                    );

                                    // Clear date inputs
                                    $("input[type=date]").val("");

                                }

                            });

                         }

                    // end modal calendar selection
                    });

                }

              }
            );

        });

        //
        // DISABLE MAINTENANCE MODE BUTTON
        //

        $("#btn_disable_maintenance").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            //
            // Verify the current status
            //

            // Define the query
            var searchQuery = "| inputlookup kafka_alerting_maintenance";

            // Set the search parameters--specify a time range
            var searchParams = {
              earliest_time: "-60m",
              latest_time: "now"
            };

            // Run a oneshot search that returns the job's results

            service.oneshotSearch(
              searchQuery,
              searchParams,
              function(err, results) {
                // Display the results
                var fields = results.fields;
                var rows = results.rows;

                for(var i = 0; i < rows.length; i++) {
                  var values = rows[i];
                  // console.log("Row " + i + ": ");

                  for(var j = 0; j < values.length; j++) {
                    var field = fields[j];

                    if (fields[j]=="maintenance_mode") {
                      current_maintenance_mode = values[j];
                    }

                    // console.log("  " + field + ": " + current_maintenance_mode);
                  }
                }

                if (current_maintenance_mode=="disabled") {
                    // Show an error message
                    $("#maintenance_mode_already_disabled").modal()
                    return;
                }

                else
                {

                $("#disabled_maintenance_confirmation").modal()

                    $("#btn_disable_maintenance_confirmation").click(function() {

                            // console.log("Disable maintenance mode now");
                            var searchQuery = "| makeresults | eval maintenance_mode=\"disabled\", time_updated=now(), maintenance_mode_end=\"\" | fields - _time | outputlookup kafka_alerting_maintenance";

                            // Set the search parameters--specify a time range
                            var searchParams = {
                              earliest_time: "-60m",
                              latest_time: "now"
                            };

                            // Run a oneshot search that returns the job's results
                            service.oneshotSearch(
                              searchQuery,
                              searchParams,
                              function(err, results) {
                                // Update single
                                search_maintenance_state.startSearch();
                                search_maintenance_mode_state.startSearch();
                              }
                            );
                    });

                }

              }
            );

        });

        //
        // KAFKA TOPICS
        //

        //
        // UPDATE COLLECTION
        //

        // Call this function when the Update collection button is clicked

        $("#btn_manage_content_kafka_topics1").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_update_collection").modal()

                $("#btn_modal_update_collection").click(function() {

                    console.log("Start collection update" );

                    // Define the query
                    var searchQuery = "| savedsearch \"Update Kafka topics inventory\"";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a normal search that immediately returns the job's SID
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {

                        // Display the job's search ID
                        console.log("Job SID: ", job.sid);

                        // Poll the status of the search job
                        job.track({period: 200}, {
                          done: function(job) {
                            // console.log("Done!");

                            // Once the job is done, update all searches
                            search_kafka_topics_no_components.startSearch();
                            search_kafka_topics_no_components_enabled.startSearch();
                            search_kafka_topics_no_components_disabled.startSearch();
                            search_kafka_topics_main_table.startSearch();
                            search_kafka_topics_search_env.startSearch();
                            search_kafka_topics_search_label.startSearch();

                            $("#modal_update_collection_done").modal()

                            // Print out the statics
                            console.log("Job statistics:");
                            console.log("  Event count:  " + job.properties().eventCount);
                            console.log("  Result count: " + job.properties().resultCount);
                            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                            console.log("  Priority:     " + job.properties().priority);

                          },
                          failed: function(job) {
                            console.log("Job failed")
                          },
                          error: function(err) {
                            done(err);
                          }
                        });

                      }
                    );
            });
        });


        //
        // RESET COLLECTION
        //

        // Call this function when the erase collection button is clicked

        $("#btn_manage_content_kafka_topics2").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_rebuild_collection").modal()

                $("#btn_modal_rebuild_collection").click(function() {

                    console.log("Flushing KVstore collection" );

                    // Define the query
                    var searchQuery = "| outputlookup kafka_topics_monitoring";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a blocking search and get back a job
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {
                        console.log("...done!\n");

                        // Get the job from the server to display more info
                        job.fetch(function(err){
                          // Display properties of the job
                          console.log("Search job properties\n---------------------");
                          console.log("Search job ID:         " + job.sid);
                          console.log("The number of events:  " + job.properties().eventCount);
                          console.log("The number of results: " + job.properties().resultCount);
                          console.log("Search duration:       " + job.properties().runDuration + " seconds");
                          console.log("This job expires in:   " + job.properties().ttl + " seconds");

                        });

                        console.log("Start collection update" );

                        // Define the query
                        var searchQuery = "| savedsearch \"Update Kafka topics inventory\"";

                        // Set the search parameters--specify a time range
                        var searchParams = {
                          earliest_time: "-60m",
                          latest_time: "now"
                        };

                        // Run a normal search that immediately returns the job's SID
                        service.search(
                          searchQuery,
                          searchParams,
                          function(err, job) {

                            // Display the job's search ID
                            console.log("Job SID: ", job.sid);

                            // Poll the status of the search job
                            job.track({period: 200}, {
                              done: function(job) {
                                // console.log("Done!");

                                // Once the job is done, update all searches
                                search_kafka_topics_no_components.startSearch();
                                search_kafka_topics_no_components_enabled.startSearch();
                                search_kafka_topics_no_components_disabled.startSearch();
                                search_kafka_topics_main_table.startSearch();
                                search_kafka_topics_search_env.startSearch();
                                search_kafka_topics_search_label.startSearch();

                                // Print out the statics
                                console.log("Job statistics:");
                                console.log("  Event count:  " + job.properties().eventCount);
                                console.log("  Result count: " + job.properties().resultCount);
                                console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                                console.log("  Priority:     " + job.properties().priority);

                                $("#modal_update_collection_done").modal()

                              },
                              failed: function(job) {
                                console.log("Job failed")
                              },
                              error: function(err) {
                                done(err);
                              }
                            });

                          }
                        );

                      }
                    );

                });

        });

        //
        // DELETE BUTTON
        //

        // Call this function when the Delete Record button is clicked
        $("#btn_remove_content_kafka_topics").click(function() {
            var tokens = mvc.Components.get("default");
            var form_keyid = tokens.get("tk_kafka_topics_keyid");

            if (!form_keyid || !form_keyid.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }
            else
            {

                $("#modal_entry_deletion").modal()

                    $("#btn_modal_entry_deletion").click(function() {

                    // Delete the record that corresponds to the key ID using
                    // the del method to send a DELETE request
                    // to the storage/collections/data/{collection}/ endpoint
                    service.del("storage/collections/data/kv_telegraf_kafka_topics_monitoring/" + encodeURIComponent(form_keyid))
                        .done(function() {
                            // Run the search again to update the table
                            search_kafka_topics_no_components.startSearch();
                            search_kafka_topics_no_components_enabled.startSearch();
                            search_kafka_topics_no_components_disabled.startSearch();
                            search_kafka_topics_main_table.startSearch();
                            search_kafka_topics_search_env.startSearch();
                            search_kafka_topics_search_label.startSearch();

                            // clear the forms

                            // keyID
                            $("#input_kafka_topics_delete input[type=text]").val("");

                            // modifications

                        });

                });

            }

        });

        //
        // MODIFY BUTTON
        //

        $("#btn_modify_content_kafka_topics").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var modify_key = tokens.get("tk_kafka_topics_keyid");
            var tk_name = tokens.get("tk_kafka_topics_name");
            var tk_kafka_topics_env = tokens.get("tk_kafka_topics_env");
            var tk_kafka_topics_label = tokens.get("tk_kafka_topics_label");
            var modify_tk_kafka_topics_monitoring_state = tokens.get("modify_tk_kafka_topics_monitoring_state");

            // Create the endpoint URL
            var myendpoint_URl = "storage/collections/data/kv_telegraf_kafka_topics_monitoring/" + modify_key;

            // Create a dictionary to store the field names and values
            var record = {
                "topic": tk_name,
                "env": tk_kafka_topics_env,
                "label": tk_kafka_topics_label,
                "monitoring_state": modify_tk_kafka_topics_monitoring_state
            };

            if (!modify_key || !modify_key.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_kafka_topics_monitoring_state || !modify_tk_kafka_topics_monitoring_state.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else
            {

                $("#modal_entry_modification").modal()

                    $("#btn_modal_entry_modification").click(function() {

                        // Get the value of the key ID field

                    // Use the request method to send a REST POST request
                    // to the storage/collections/data/{collection}/entry_key endpoint
                    service.request(
                        myendpoint_URl,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null)
                            .done(function() {
                                 // Run the search again to update the table
                                search_kafka_topics_no_components.startSearch();
                                search_kafka_topics_no_components_enabled.startSearch();
                                search_kafka_topics_no_components_disabled.startSearch();
                                search_kafka_topics_main_table.startSearch();
                                search_kafka_topics_search_env.startSearch();
                                search_kafka_topics_search_label.startSearch();

                                // clear the forms
                                // $("#input_selected_key input[type=text]").val("");

                                // modifications

                            });

                });

            }

        });

        //
        // KAFKA INFRA
        //

        //
        // UPDATE COLLECTION
        //

        // Call this function when the Update collection button is clicked

        $("#btn_manage_content_kafka_infra1").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_update_collection").modal()

                $("#btn_modal_update_collection").click(function() {

                    console.log("Start collection update" );

                    // Define the query
                    var searchQuery = "| savedsearch \"Update Kafka Infrastructure components inventory\"";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a normal search that immediately returns the job's SID
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {

                        // Display the job's search ID
                        console.log("Job SID: ", job.sid);

                        // Poll the status of the search job
                        job.track({period: 200}, {
                          done: function(job) {
                            // console.log("Done!");

                            // Once the job is done, update all searches
                            search_kafka_infra_no_components.startSearch();
                            search_kafka_infra_no_components_enabled.startSearch();
                            search_kafka_infra_no_components_disabled.startSearch();
                            search_kafka_infra_main_table.startSearch();
                            search_kafka_infra_search_env.startSearch();
                            search_kafka_infra_search_label.startSearch();

                            // this shares the same KVstore collection maintenance object
                            search_kafka_infra_nodes_no_components.startSearch();
                            search_kafka_infra_nodes_no_components_enabled.startSearch();
                            search_kafka_infra_nodes_no_components_disabled.startSearch();
                            search_kafka_infra_nodes_main_table.startSearch();
                            search_kafka_infra_nodes_search_env.startSearch();
                            search_kafka_infra_nodes_search_label.startSearch();

                            $("#modal_update_collection_done").modal()

                            // Print out the statics
                            console.log("Job statistics:");
                            console.log("  Event count:  " + job.properties().eventCount);
                            console.log("  Result count: " + job.properties().resultCount);
                            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                            console.log("  Priority:     " + job.properties().priority);

                          },
                          failed: function(job) {
                            console.log("Job failed")
                          },
                          error: function(err) {
                            done(err);
                          }
                        });

                      }
                    );

                });

        });


        //
        // RESET COLLECTION
        //

        // Call this function when the erase collection button is clicked

        $("#btn_manage_content_kafka_infra2").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_rebuild_collection").modal()

                $("#btn_modal_rebuild_collection").click(function() {

                    console.log("Flushing KVstore collection" );

                    // Define the query
                    var searchQuery = "| outputlookup kafka_infra_inventory";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a blocking search and get back a job
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {
                        console.log("...done!\n");

                        // Get the job from the server to display more info
                        job.fetch(function(err){
                          // Display properties of the job
                          console.log("Search job properties\n---------------------");
                          console.log("Search job ID:         " + job.sid);
                          console.log("The number of events:  " + job.properties().eventCount);
                          console.log("The number of results: " + job.properties().resultCount);
                          console.log("Search duration:       " + job.properties().runDuration + " seconds");
                          console.log("This job expires in:   " + job.properties().ttl + " seconds");

                        });

                        console.log("Start collection update" );

                        // Define the query
                        var searchQuery = "| savedsearch \"Update Kafka Infrastructure components inventory\"";

                        // Set the search parameters--specify a time range
                        var searchParams = {
                          earliest_time: "-60m",
                          latest_time: "now"
                        };

                        // Run a normal search that immediately returns the job's SID
                        service.search(
                          searchQuery,
                          searchParams,
                          function(err, job) {

                            // Display the job's search ID
                            console.log("Job SID: ", job.sid);

                            // Poll the status of the search job
                            job.track({period: 200}, {
                              done: function(job) {
                                // console.log("Done!");

                                // Once the job is done, update all searches
                                search_kafka_infra_no_components.startSearch();
                                search_kafka_infra_no_components_enabled.startSearch();
                                search_kafka_infra_no_components_disabled.startSearch();
                                search_kafka_infra_main_table.startSearch();
                                search_kafka_infra_search_env.startSearch();
                                search_kafka_infra_search_label.startSearch();

                                // this shares the same KVstore collection maintenance object
                                search_kafka_infra_nodes_no_components.startSearch();
                                search_kafka_infra_nodes_no_components_enabled.startSearch();
                                search_kafka_infra_nodes_no_components_disabled.startSearch();
                                search_kafka_infra_nodes_main_table.startSearch();
                                search_kafka_infra_nodes_search_env.startSearch();
                                search_kafka_infra_nodes_search_label.startSearch();

                                // Print out the statics
                                console.log("Job statistics:");
                                console.log("  Event count:  " + job.properties().eventCount);
                                console.log("  Result count: " + job.properties().resultCount);
                                console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                                console.log("  Priority:     " + job.properties().priority);

                                $("#modal_update_collection_done").modal()

                              },
                              failed: function(job) {
                                console.log("Job failed")
                              },
                              error: function(err) {
                                done(err);
                              }
                            });

                          }
                        );

                      }
                    );

                });

        });

        //
        // DELETE BUTTON
        //

        // Call this function when the Delete Record button is clicked
        $("#btn_remove_content_kafka_infra").click(function() {
            var tokens = mvc.Components.get("default");
            var form_keyid = tokens.get("tk_kafka_infra_keyid");

            if (!form_keyid || !form_keyid.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }
            else
            {

                $("#modal_entry_deletion").modal()

                    $("#btn_modal_entry_deletion").click(function() {

                    // Delete the record that corresponds to the key ID using
                    // the del method to send a DELETE request
                    // to the storage/collections/data/{collection}/ endpoint
                    service.del("storage/collections/data/kv_telegraf_kafka_inventory/" + encodeURIComponent(form_keyid))
                        .done(function() {
                            // Run the search again to update the table
                            search_kafka_infra_no_components.startSearch();
                            search_kafka_infra_no_components_enabled.startSearch();
                            search_kafka_infra_no_components_disabled.startSearch();
                            search_kafka_infra_main_table.startSearch();
                            search_kafka_infra_search_env.startSearch();
                            search_kafka_infra_search_label.startSearch();

                            // clear the forms

                            // keyID
                            $("#input_kafka_infra_delete input[type=text]").val("");

                            // modifications

                        });

                });

            }

        });

        //
        // MODIFY BUTTON
        //

        $("#btn_modify_content_kafka_infra").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var modify_key = tokens.get("tk_kafka_infra_keyid");
            var tk_name = tokens.get("tk_kafka_infra_name");
            var tk_role = tokens.get("tk_kafka_infra_role");
            var tk_kafka_infra_env = tokens.get("tk_kafka_infra_env");
            var tk_kafka_infra_label = tokens.get("tk_kafka_infra_label");
            var tk_lasttime = tokens.get("tk_kafka_infra_lasttime");
            var modify_tk_kafka_infra_grace_period = tokens.get("modify_tk_kafka_infra_grace_period");
            var modify_tk_kafka_infra_monitoring_state = tokens.get("modify_tk_kafka_infra_monitoring_state");

            // Create the endpoint URL
            var myendpoint_URl = "storage/collections/data/kv_telegraf_kafka_inventory/" + modify_key;

            // Create a dictionary to store the field names and values
            var record = {
                "name": tk_name,
                "role": tk_role,
                "env": tk_kafka_infra_env,
                "label": tk_kafka_infra_label,
                "grace_period": modify_tk_kafka_infra_grace_period,
                "monitoring_state": modify_tk_kafka_infra_monitoring_state,
                "lasttime": tk_lasttime
            };

            if (!modify_key || !modify_key.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_kafka_infra_grace_period || !modify_tk_kafka_infra_grace_period.length || !isNumeric(modify_tk_kafka_infra_grace_period)) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_kafka_infra_monitoring_state || !modify_tk_kafka_infra_monitoring_state.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else
            {

                $("#modal_entry_modification").modal()

                    $("#btn_modal_entry_modification").click(function() {

                        // Get the value of the key ID field

                    // Use the request method to send a REST POST request
                    // to the storage/collections/data/{collection}/entry_key endpoint
                    service.request(
                        myendpoint_URl,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null)
                            .done(function() {
                                 // Run the search again to update the table
                                search_kafka_infra_no_components.startSearch();
                                search_kafka_infra_no_components_enabled.startSearch();
                                search_kafka_infra_no_components_disabled.startSearch();
                                search_kafka_infra_main_table.startSearch();
                                search_kafka_infra_search_env.startSearch();
                                search_kafka_infra_search_label.startSearch();

                                // clear the forms
                                // $("#input_selected_key input[type=text]").val("");

                                // modifications

                            });

                });

            }

        });

        //
        // KAFKA INFRA NODES
        //

        //
        // UPDATE COLLECTION
        //

        // Call this function when the Update collection button is clicked

        $("#btn_manage_content_kafka_infra_nodenumber1").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_update_collection").modal()

                $("#btn_modal_update_collection").click(function() {

                    console.log("Start collection update" );

                    // Define the query
                    var searchQuery = "| savedsearch \"Update Kafka Infrastructure components inventory\"";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a normal search that immediately returns the job's SID
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {

                        // Display the job's search ID
                        console.log("Job SID: ", job.sid);

                        // Poll the status of the search job
                        job.track({period: 200}, {
                          done: function(job) {
                            // console.log("Done!");

                            // Once the job is done, update all searches
                            search_kafka_infra_nodes_no_components.startSearch();
                            search_kafka_infra_nodes_no_components_enabled.startSearch();
                            search_kafka_infra_nodes_no_components_disabled.startSearch();
                            search_kafka_infra_nodes_main_table.startSearch();
                            search_kafka_infra_nodes_search_env.startSearch();
                            search_kafka_infra_nodes_search_label.startSearch();

                            // This shares the same KVstore collection maintenance object
                            search_kafka_infra_no_components.startSearch();
                            search_kafka_infra_no_components_enabled.startSearch();
                            search_kafka_infra_no_components_disabled.startSearch();
                            search_kafka_infra_main_table.startSearch();
                            search_kafka_infra_search_env.startSearch();
                            search_kafka_infra_search_label.startSearch();

                            $("#modal_update_collection_done").modal()

                            // Print out the statics
                            console.log("Job statistics:");
                            console.log("  Event count:  " + job.properties().eventCount);
                            console.log("  Result count: " + job.properties().resultCount);
                            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                            console.log("  Priority:     " + job.properties().priority);

                          },
                          failed: function(job) {
                            console.log("Job failed")
                          },
                          error: function(err) {
                            done(err);
                          }
                        });

                      }
                    );

                });

        });


        //
        // RESET COLLECTION
        //

        // Call this function when the erase collection button is clicked

        $("#btn_manage_content_kafka_infra_nodenumber2").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_rebuild_collection").modal()

                $("#btn_modal_rebuild_collection").click(function() {

                    console.log("Flushing KVstore collection" );

                    // Define the query
                    var searchQuery = "| outputlookup kafka_infra_nodes_inventory";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a blocking search and get back a job
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {
                        console.log("...done!\n");

                        // Get the job from the server to display more info
                        job.fetch(function(err){
                          // Display properties of the job
                          console.log("Search job properties\n---------------------");
                          console.log("Search job ID:         " + job.sid);
                          console.log("The number of events:  " + job.properties().eventCount);
                          console.log("The number of results: " + job.properties().resultCount);
                          console.log("Search duration:       " + job.properties().runDuration + " seconds");
                          console.log("This job expires in:   " + job.properties().ttl + " seconds");

                        });

                        console.log("Start collection update" );

                        // Define the query
                        var searchQuery = "| savedsearch \"Update Kafka Infrastructure components inventory\"";

                        // Set the search parameters--specify a time range
                        var searchParams = {
                          earliest_time: "-60m",
                          latest_time: "now"
                        };

                        // Run a normal search that immediately returns the job's SID
                        service.search(
                          searchQuery,
                          searchParams,
                          function(err, job) {

                            // Display the job's search ID
                            console.log("Job SID: ", job.sid);

                            // Poll the status of the search job
                            job.track({period: 200}, {
                              done: function(job) {
                                // console.log("Done!");

                                // Once the job is done, update all searches
                                search_kafka_infra_nodes_no_components.startSearch();
                                search_kafka_infra_nodes_no_components_enabled.startSearch();
                                search_kafka_infra_nodes_no_components_disabled.startSearch();
                                search_kafka_infra_nodes_main_table.startSearch();
                                search_kafka_infra_nodes_search_env.startSearch();
                                search_kafka_infra_nodes_search_label.startSearch();

                                // This shares the same KVstore collection maintenance object
                                search_kafka_infra_no_components.startSearch();
                                search_kafka_infra_no_components_enabled.startSearch();
                                search_kafka_infra_no_components_disabled.startSearch();
                                search_kafka_infra_main_table.startSearch();
                                search_kafka_infra_search_env.startSearch();
                                search_kafka_infra_search_label.startSearch();

                                // Print out the statics
                                console.log("Job statistics:");
                                console.log("  Event count:  " + job.properties().eventCount);
                                console.log("  Result count: " + job.properties().resultCount);
                                console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                                console.log("  Priority:     " + job.properties().priority);

                                $("#modal_update_collection_done").modal()

                              },
                              failed: function(job) {
                                console.log("Job failed")
                              },
                              error: function(err) {
                                done(err);
                              }
                            });

                          }
                        );

                      }
                    );

                });

        });

        //
        // DELETE BUTTON
        //

        // Call this function when the Delete Record button is clicked
        $("#btn_remove_content_kafka_infra_nodes").click(function() {
            var tokens = mvc.Components.get("default");
            var form_keyid = tokens.get("tk_kafka_infra_nodes_keyid");

            if (!form_keyid || !form_keyid.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }
            else
            {

                $("#modal_entry_deletion").modal()

                    $("#btn_modal_entry_deletion").click(function() {

                    // Delete the record that corresponds to the key ID using
                    // the del method to send a DELETE request
                    // to the storage/collections/data/{collection}/ endpoint
                    service.del("storage/collections/data/kv_kafka_infra_nodes_inventory/" + encodeURIComponent(form_keyid))
                        .done(function() {
                            // Run the search again to update the table
                            search_kafka_infra_nodes_no_components.startSearch();
                            search_kafka_infra_nodes_no_components_enabled.startSearch();
                            search_kafka_infra_nodes_no_components_disabled.startSearch();
                            search_kafka_infra_nodes_main_table.startSearch();
                            search_kafka_infra_nodes_search_env.startSearch();
                            search_kafka_infra_nodes_search_label.startSearch();

                            // clear the forms

                            // keyID
                            $("#input_kafka_infra_nodes_delete input[type=text]").val("");

                            // modifications

                        });

                });

            }

        });

        //
        // MODIFY BUTTON
        //

        $("#btn_modify_content_kafka_infra_nodes").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var modify_key = tokens.get("tk_kafka_infra_nodes_keyid");
            var tk_role = tokens.get("tk_kafka_infra_nodes_role");
            var tk_kafka_infra_nodes_env = tokens.get("tk_kafka_infra_nodes_env");
            var tk_kafka_infra_nodes_label = tokens.get("tk_kafka_infra_nodes_label");
            var tk_kafka_infra_nodes_current_nodes_number = tokens.get("tk_kafka_infra_nodes_current_nodes_number");
            var modify_tk_kafka_infra_nodes_minimal_nodes_number = tokens.get("modify_tk_kafka_infra_nodes_minimal_nodes_number");
            var modify_tk_kafka_infra_nodes_monitoring_state = tokens.get("modify_tk_kafka_infra_nodes_monitoring_state");

            // Create the endpoint URL
            var myendpoint_URl = "storage/collections/data/kv_kafka_infra_nodes_inventory/" + modify_key;

            // Create a dictionary to store the field names and values
            var record = {
                "role": tk_role,
                "env": tk_kafka_infra_nodes_env,
                "label": tk_kafka_infra_nodes_label,
                "current_nodes_number": tk_kafka_infra_nodes_current_nodes_number,
                "minimal_nodes_number": modify_tk_kafka_infra_nodes_minimal_nodes_number,
                "monitoring_state": modify_tk_kafka_infra_nodes_monitoring_state
            };

            if (!modify_key || !modify_key.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_kafka_infra_nodes_minimal_nodes_number || !modify_tk_kafka_infra_nodes_minimal_nodes_number.length || !isNumeric(modify_tk_kafka_infra_nodes_minimal_nodes_number)) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_kafka_infra_nodes_monitoring_state || !modify_tk_kafka_infra_nodes_monitoring_state.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else
            {

                $("#modal_entry_modification").modal()

                    $("#btn_modal_entry_modification").click(function() {

                        // Get the value of the key ID field

                    // Use the request method to send a REST POST request
                    // to the storage/collections/data/{collection}/entry_key endpoint
                    service.request(
                        myendpoint_URl,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null)
                            .done(function() {
                                 // Run the search again to update the table
                                search_kafka_infra_nodes_no_components.startSearch();
                                search_kafka_infra_nodes_no_components_enabled.startSearch();
                                search_kafka_infra_nodes_no_components_disabled.startSearch();
                                search_kafka_infra_nodes_main_table.startSearch();
                                search_kafka_infra_nodes_search_env.startSearch();
                                search_kafka_infra_nodes_search_label.startSearch();

                                // clear the forms
                                // $("#input_selected_key input[type=text]").val("");

                                // modifications

                            });

                });

            }

        });

        //
        // BURROW
        //

        //
        // UPDATE COLLECTION
        //

        // Call this function when the Update collection button is clicked

        $("#btn_manage_content_kafka_consumers1").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_update_collection").modal()

                $("#btn_modal_update_collection").click(function() {

                    console.log("Start collection update" );

                    // Define the query
                    var searchQuery = "| savedsearch \"Update Kafka Burrow group consumers inventory\"";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a normal search that immediately returns the job's SID
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {

                        // Display the job's search ID
                        console.log("Job SID: ", job.sid);

                        // Poll the status of the search job
                        job.track({period: 200}, {
                          done: function(job) {
                            // console.log("Done!");

                            // Once the job is done, update all searches
                            search_burrow_no_consumers.startSearch();
                            search_burrow_no_consumers_enabled.startSearch();
                            search_burrow_no_consumers_disabled.startSearch();
                            search_burrow_main_table.startSearch();
                            search_burrow_search_env.startSearch();
                            search_burrow_search_label.startSearch();
                            search_burrow_search_cluster.startSearch();

                            $("#modal_update_collection_done").modal()

                            // Print out the statics
                            console.log("Job statistics:");
                            console.log("  Event count:  " + job.properties().eventCount);
                            console.log("  Result count: " + job.properties().resultCount);
                            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                            console.log("  Priority:     " + job.properties().priority);

                          },
                          failed: function(job) {
                            console.log("Job failed")
                          },
                          error: function(err) {
                            done(err);
                          }
                        });

                      }
                    );

                });

        });


        //
        // RESET COLLECTION
        //

        // Call this function when the erase collection button is clicked

        $("#btn_manage_content_kafka_consumers2").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_rebuild_collection").modal()

                $("#btn_modal_rebuild_collection").click(function() {

                    console.log("Flushing KVstore collection" );

                    // Define the query
                    var searchQuery = "| outputlookup kafka_burrow_consumers_monitoring";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a blocking search and get back a job
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {
                        console.log("...done!\n");

                        // Get the job from the server to display more info
                        job.fetch(function(err){
                          // Display properties of the job
                          console.log("Search job properties\n---------------------");
                          console.log("Search job ID:         " + job.sid);
                          console.log("The number of events:  " + job.properties().eventCount);
                          console.log("The number of results: " + job.properties().resultCount);
                          console.log("Search duration:       " + job.properties().runDuration + " seconds");
                          console.log("This job expires in:   " + job.properties().ttl + " seconds");

                        });

                        console.log("Start collection update" );

                        // Define the query
                        var searchQuery = "| savedsearch \"Update Kafka Burrow group consumers inventory\"";

                        // Set the search parameters--specify a time range
                        var searchParams = {
                          earliest_time: "-60m",
                          latest_time: "now"
                        };

                        // Run a normal search that immediately returns the job's SID
                        service.search(
                          searchQuery,
                          searchParams,
                          function(err, job) {

                            // Display the job's search ID
                            console.log("Job SID: ", job.sid);

                            // Poll the status of the search job
                            job.track({period: 200}, {
                              done: function(job) {
                                // console.log("Done!");

                                // Once the job is done, update all searches
                                search_burrow_no_consumers.startSearch();
                                search_burrow_no_consumers_enabled.startSearch();
                                search_burrow_no_consumers_disabled.startSearch();
                                search_burrow_main_table.startSearch();
                                search_burrow_search_env.startSearch();
                                search_burrow_search_label.startSearch();
                                search_burrow_search_cluster.startSearch();

                                // Print out the statics
                                console.log("Job statistics:");
                                console.log("  Event count:  " + job.properties().eventCount);
                                console.log("  Result count: " + job.properties().resultCount);
                                console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                                console.log("  Priority:     " + job.properties().priority);

                                $("#modal_update_collection_done").modal()

                              },
                              failed: function(job) {
                                console.log("Job failed")
                              },
                              error: function(err) {
                                done(err);
                              }
                            });

                          }
                        );

                      }
                    );

                });

        });

        //
        // DELETE BUTTON
        //

        // Call this function when the Delete Record button is clicked
        $("#btn_remove_content_burrow").click(function() {
            var tokens = mvc.Components.get("default");
            var form_keyid = tokens.get("tk_burrow_keyid");

            if (!form_keyid || !form_keyid.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }
            else
            {

                $("#modal_entry_deletion").modal()

                    $("#btn_modal_entry_deletion").click(function() {

                    // Delete the record that corresponds to the key ID using
                    // the del method to send a DELETE request
                    // to the storage/collections/data/{collection}/ endpoint
                    service.del("storage/collections/data/kv_kafka_burrow_consumers_monitoring/" + encodeURIComponent(form_keyid))
                        .done(function() {
                            // Run the search again to update the table
                            search_burrow_no_consumers.startSearch();
                            search_burrow_no_consumers_enabled.startSearch();
                            search_burrow_no_consumers_disabled.startSearch();
                            search_burrow_main_table.startSearch();
                            search_burrow_search_env.startSearch();
                            search_burrow_search_label.startSearch();
                            search_burrow_search_cluster.startSearch();

                            // clear the forms

                            // keyID
                            $("#input_burrow_delete input[type=text]").val("");

                            // modifications

                        });

                });

            }

        });

        //
        // MODIFY BUTTON
        //

        $("#btn_modify_content_burrow").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var modify_key = tokens.get("tk_burrow_keyid");
            var tk_burrow_env = tokens.get("tk_burrow_env");
            var tk_burrow_label = tokens.get("tk_burrow_label");
            var tk_burrow_cluster = tokens.get("tk_burrow_cluster");
            var tk_burrow_group = tokens.get("tk_burrow_group");
            var modify_tk_burrow_monitoring_state = tokens.get("modify_tk_burrow_monitoring_state");

            // Create the endpoint URL
            var myendpoint_URl = "storage/collections/data/kv_kafka_burrow_consumers_monitoring/" + modify_key;

            // Create a dictionary to store the field names and values
            var record = {
                "env": tk_burrow_env,
                "label": tk_burrow_label,
                "cluster": tk_burrow_cluster,
                "group": tk_burrow_group,
                "monitoring_state": modify_tk_burrow_monitoring_state
            };

            if (!modify_key || !modify_key.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_burrow_monitoring_state || !modify_tk_burrow_monitoring_state.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else
            {

                $("#modal_entry_modification").modal()

                    $("#btn_modal_entry_modification").click(function() {

                        // Get the value of the key ID field

                    // Use the request method to send a REST POST request
                    // to the storage/collections/data/{collection}/entry_key endpoint
                    service.request(
                        myendpoint_URl,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null)
                            .done(function() {
                                 // Run the search again to update the table
                                search_burrow_no_consumers.startSearch();
                                search_burrow_no_consumers_enabled.startSearch();
                                search_burrow_no_consumers_disabled.startSearch();
                                search_burrow_main_table.startSearch();
                                search_burrow_search_env.startSearch();
                                search_burrow_search_label.startSearch();
                                search_burrow_search_cluster.startSearch();

                                // clear the forms
                                // $("#input_selected_key input[type=text]").val("");

                                // modifications

                            });

                });

            }

        });

        //
        // KAFKA CONNECT
        //

        //
        // UPDATE COLLECTION
        //

        // Call this function when the Update collection button is clicked

        $("#btn_manage_content_kafka_connect1").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_update_collection").modal()

                $("#btn_modal_update_collection").click(function() {

                    console.log("Start collection update" );

                    // Define the query
                    var searchQuery = "| savedsearch \"Update Kafka Connect tasks inventory\"";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a normal search that immediately returns the job's SID
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {

                        // Display the job's search ID
                        console.log("Job SID: ", job.sid);

                        // Poll the status of the search job
                        job.track({period: 200}, {
                          done: function(job) {
                            // console.log("Done!");

                            // Once the job is done, update all searches
                            search_connect_no_connectors.startSearch();
                            search_connect_no_connectors_enabled.startSearch();
                            search_connect_no_connectors_disabled.startSearch();
                            search_connect_main_table.startSearch();
                            search_connect_search_env.startSearch();
                            search_connect_search_label.startSearch();

                            $("#modal_update_collection_done").modal()

                            // Print out the statics
                            console.log("Job statistics:");
                            console.log("  Event count:  " + job.properties().eventCount);
                            console.log("  Result count: " + job.properties().resultCount);
                            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                            console.log("  Priority:     " + job.properties().priority);

                          },
                          failed: function(job) {
                            console.log("Job failed")
                          },
                          error: function(err) {
                            done(err);
                          }
                        });

                      }
                    );

                });

        });


        //
        // RESET COLLECTION
        //

        // Call this function when the erase collection button is clicked

        $("#btn_manage_content_kafka_connect2").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");

            $("#modal_rebuild_collection").modal()

                $("#btn_modal_rebuild_collection").click(function() {

                    console.log("Flushing KVstore collection" );

                    // Define the query
                    var searchQuery = "| outputlookup kafka_connect_tasks_monitoring";

                    // Set the search parameters--specify a time range
                    var searchParams = {
                      earliest_time: "-60m",
                      latest_time: "now"
                    };

                    // Run a blocking search and get back a job
                    service.search(
                      searchQuery,
                      searchParams,
                      function(err, job) {
                        console.log("...done!\n");

                        // Get the job from the server to display more info
                        job.fetch(function(err){
                          // Display properties of the job
                          console.log("Search job properties\n---------------------");
                          console.log("Search job ID:         " + job.sid);
                          console.log("The number of events:  " + job.properties().eventCount);
                          console.log("The number of results: " + job.properties().resultCount);
                          console.log("Search duration:       " + job.properties().runDuration + " seconds");
                          console.log("This job expires in:   " + job.properties().ttl + " seconds");

                        });

                        console.log("Start collection update" );

                        // Define the query
                        var searchQuery = "| savedsearch \"Update Kafka Connect tasks inventory\"";

                        // Set the search parameters--specify a time range
                        var searchParams = {
                          earliest_time: "-60m",
                          latest_time: "now"
                        };

                        // Run a normal search that immediately returns the job's SID
                        service.search(
                          searchQuery,
                          searchParams,
                          function(err, job) {

                            // Display the job's search ID
                            console.log("Job SID: ", job.sid);

                            // Poll the status of the search job
                            job.track({period: 200}, {
                              done: function(job) {
                                // console.log("Done!");

                                // Once the job is done, update all searches
                                search_connect_no_connectors.startSearch();
                                search_connect_no_connectors_enabled.startSearch();
                                search_connect_no_connectors_disabled.startSearch();
                                search_connect_main_table.startSearch();
                                search_connect_search_env.startSearch();
                                search_connect_search_label.startSearch();

                                // Print out the statics
                                console.log("Job statistics:");
                                console.log("  Event count:  " + job.properties().eventCount);
                                console.log("  Result count: " + job.properties().resultCount);
                                console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
                                console.log("  Priority:     " + job.properties().priority);

                                $("#modal_update_collection_done").modal()

                              },
                              failed: function(job) {
                                console.log("Job failed")
                              },
                              error: function(err) {
                                done(err);
                              }
                            });

                          }
                        );

                      }
                    );

                });

        });

        //
        // DELETE BUTTON
        //

        // Call this function when the Delete Record button is clicked
        $("#btn_remove_content_connect").click(function() {
            var tokens = mvc.Components.get("default");
            var form_keyid = tokens.get("tk_connect_keyid");

            if (!form_keyid || !form_keyid.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }
            else
            {

                $("#modal_entry_deletion").modal()

                    $("#btn_modal_entry_deletion").click(function() {

                    // Delete the record that corresponds to the key ID using
                    // the del method to send a DELETE request
                    // to the storage/collections/data/{collection}/ endpoint
                    service.del("storage/collections/data/kv_telegraf_kafka_connect_tasks_monitoring/" + encodeURIComponent(form_keyid))
                        .done(function() {
                            // Run the search again to update the table
                            search_connect_no_connectors.startSearch();
                            search_connect_no_connectors_enabled.startSearch();
                            search_connect_no_connectors_disabled.startSearch();
                            search_connect_main_table.startSearch();
                            search_connect_search_env.startSearch();
                            search_connect_search_label.startSearch();

                            // clear the forms

                            // keyID
                            $("#input_connect_delete input[type=text]").val("");

                            // modifications

                        });

                });

            }

        });

        //
        // MODIFY BUTTON
        //

        $("#btn_modify_content_connect").click(function() {
            submitTokens();

            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var modify_key = tokens.get("tk_connect_keyid");
            var tk_connector = tokens.get("tk_connector");
            var tk_role = tokens.get("tk_role");
            var tk_connect_env = tokens.get("tk_connect_env");
            var tk_connect_label = tokens.get("tk_connect_label");
            var modify_tk_connect_grace_period = tokens.get("modify_tk_connect_grace_period");
            var modify_tk_connect_monitoring_state = tokens.get("modify_tk_connect_monitoring_state");

            // Create the endpoint URL
            var myendpoint_URl = "storage/collections/data/kv_telegraf_kafka_connect_tasks_monitoring/" + modify_key;

            // Create a dictionary to store the field names and values
            var record = {
                "connector": tk_connector,
                "role": tk_role,
                "env": tk_connect_env,
                "label": tk_connect_label,
                "grace_period": modify_tk_connect_grace_period,
                "monitoring_state": modify_tk_connect_monitoring_state
            };

            if (!modify_key || !modify_key.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_connect_grace_period || !modify_tk_connect_grace_period.length || !isNumeric(modify_tk_connect_grace_period)) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else if (!modify_tk_connect_monitoring_state || !modify_tk_connect_monitoring_state.length) {
                // Show an error message
                $("#modal_entry_update_invalid").modal()
                return;
            }

            else
            {

                $("#modal_entry_modification").modal()

                    $("#btn_modal_entry_modification").click(function() {

                        // Get the value of the key ID field

                    // Use the request method to send a REST POST request
                    // to the storage/collections/data/{collection}/entry_key endpoint
                    service.request(
                        myendpoint_URl,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null)
                            .done(function() {
                                 // Run the search again to update the table
                                search_connect_no_connectors.startSearch();
                                search_connect_no_connectors_enabled.startSearch();
                                search_connect_no_connectors_disabled.startSearch();
                                search_connect_main_table.startSearch();
                                search_connect_search_env.startSearch();
                                search_connect_search_label.startSearch();

                                // clear the forms
                                // $("#input_selected_key input[type=text]").val("");

                                // modifications

                            });

                });

            }

        });

    }
);