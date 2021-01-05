import React from "react";
import {Input, Select, DatePicker,} from "antd";

import moment from "moment";

const {Option} = Select;
const {Group} = Input;
const {RangePicker} = DatePicker;

interface TasksFilterContextData {
    timeFilter: {
        timestamp_type: string,
        interval_type: string,
        offset: string,
        after_time: number | undefined,
        before_time: number | undefined,
    }

    onTimeFilterChange(filter: {});
}

const TaskTimeFilter: React.FC<TasksFilterContextData> = (props: TasksFilterContextData) => {

    function handleTimeRangeChange(dates, dateStrings) {
        // The dates are converted to UTC unix timestamps because dates are indexed as such
        let filters = {...props.timeFilter};
        if (dateStrings[0])
            filters.after_time = moment(dateStrings[0]).valueOf();
        else
            filters.after_time = 0;

        if (dateStrings[1])
            filters.before_time = moment(dateStrings[1]).valueOf();
        else
            filters.before_time = 0;

        props.onTimeFilterChange(filters);
    }

    return (
        <Group compact>
            <Select defaultValue="timestamp"
                    dropdownMatchSelectWidth
                    style={{width: 115}}
                    size="small"
                    onChange={type => props.onTimeFilterChange({
                        ...props.timeFilter,
                        timestamp_type: type
                    })}
            >
                {props.timeFilter.interval_type !== "next" &&
                    <>
                        <Option value="timestamp">Seen</Option>
                        <Option value="sent_at">Queued</Option>
                        <Option value="received_at">Received</Option>
                        <Option value="started_at">Started</Option>
                        <Option value="succeeded_at">Succeeded</Option>
                        <Option value="failed_at">Failed</Option>
                        <Option value="retried_at">Retried</Option>
                        <Option value="rejected_at">Rejected</Option>
                        <Option value="revoked_at">Revoked</Option>
                    </>
                }
                {["next", "at"].includes(props.timeFilter.interval_type) &&
                <>
                    <Option value="eta">ETA</Option>
                    <Option value="expires">Expires</Option>
                </>
                }
            </Select>
            <Select defaultValue="at"
                    dropdownMatchSelectWidth
                    style={{width: 70}}
                    size="small"
                    onChange={type => props.onTimeFilterChange({
                        ...props.timeFilter,
                        interval_type: type
                    })}
            >
                <Option value="at">at</Option>
                <Option value="past">past</Option>
                <Option value="next">next</Option>
            </Select>
            {
                props.timeFilter.interval_type == "at" &&
                <RangePicker
                    showTime
                    allowEmpty={[true, true]}
                    onChange={handleTimeRangeChange}
                    size="small"/>
            }
            {
                ["past", "next"].includes(props.timeFilter.interval_type) &&
                <Select defaultValue="900000"
                        dropdownMatchSelectWidth
                        style={{width: 120}}
                        size="small"
                        onChange={past => props.onTimeFilterChange({
                            ...props.timeFilter,
                            offset: parseInt(past)
                        })}
                >
                    <Option value="900000">15 minutes</Option>
                    <Option value="1800000">30 minutes</Option>
                    <Option value="3600000">1 Hour</Option>
                    <Option value="14400000">4 Hours</Option>
                    <Option value="86400000">1 day</Option>
                    <Option value="172800000">2 days</Option>
                </Select>
            }
        </Group>
    );
};

export default TaskTimeFilter