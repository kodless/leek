import React, {useEffect, useMemo, useState} from "react";
import {Divider, Row, Select, Space, Spin} from "antd";
import {badgedOption} from "../tags/BadgedOption";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";
import {useApplication} from "../../context/ApplicationProvider";
import {MetricsService} from "../../api/metrics";

// Simple debounce hook
function useDebouncedValue<T>(value: T, delay = 500): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

const loadingIndicator = (
    <Row justify="center" align="middle" style={{width: "100%"}}>
        <Spin size="small"/>
    </Row>
);

export const DropdownFilter: React.FC<{
    filter_key: string;
    placeholder: string;
    value?: string;
    filters?: any;
    onChange?: (value: string) => void;
}> = ({filter_key, placeholder, value, filters, onChange,}) => {
    const {currentEnv, currentApp} = useApplication();
    const metricsService = new MetricsService();

    const [searchText, setSearchText] = useState("");
    const [options, setOptions] = useState([]);
    const [otherOptionsCount, setOtherOptionsCount] = useState(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    const debouncedSearch = useDebouncedValue(searchText, 300);

    // Load options when search text changes (debounced)
    useEffect(() => {
        let cancelled = false;
        if (!dropdownOpen) return;

        const load = async () => {
            setLoading(true);
            try {
                console.log("Debounced: " + debouncedSearch)
                const result = await filterAggregation(debouncedSearch);
                if (!cancelled) {
                    setOptions(result.options);
                    setOtherOptionsCount(result.other_options_count)
                }
            } catch (e) {
                console.error("Failed to load aggregations", e);
                if (!cancelled) {
                    setOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [debouncedSearch, dropdownOpen]);

    async function filterAggregation(filter_value) {
        if (!currentApp) return {options: [], other_options_count: 0};
        return await metricsService
            .filterAggregation(currentApp, currentEnv, filters, filter_key, filter_value)
            .then(handleAPIResponse)
            .then((result: any) => {
                return {
                    options: result.aggregations[filter_key].buckets,
                    other_options_count: result.aggregations[filter_key].sum_other_doc_count
                }
            }, handleAPIError)
            .catch(handleAPIError);
    }

    async function fetchAggregations() {
        if (!currentApp) return {options: [], other_options_count: 0};
        const result = await filterAggregation(null);
        setOptions(result.options);
        setOtherOptionsCount(result.other_options_count)
    }

    const memoizedSelectOptions = useMemo(() => {
        // memoize this because it's common to have many different task names, which causes the dropdown to be very laggy.
        // This is a known problem in Ant Design
        return options.map((o, key) => badgedOption(o));
    }, [options]);

    return (
        <Select
            placeholder={placeholder}
            mode="multiple"
            filterOption={false} // IMPORTANT: filtering is done server-side via wildcard
            style={{width: "100%"}}
            allowClear
            showSearch
            // This controls what gets sent to the debounced search
            onSearch={(val) => setSearchText(val)}
            value={value}
            onChange={onChange}
            dropdownMatchSelectWidth={false}
            onDropdownVisibleChange={(open) => {
                setDropdownOpen(open);
                if (open) {
                    if (options.length === 0 && searchText === "")
                    return fetchAggregations() // Initial load when user opens (not on mount)
                }
                else {
                    // dropdown closed → forget search
                    setSearchText("");
                    // optional: also reset options to initial state
                    setOptions([]);
                }
            }}
            notFoundContent={loading ? loadingIndicator : null}
            dropdownRender={otherOptionsCount > 0 ? (menu) => (
                <>
                    {menu}
                    <Divider style={{margin: '8px 0'}}/>
                    <Space style={{padding: '0 8px 4px'}}>
                        <Text type="warning">+{otherOptionsCount} hidden, scope down with search!</Text>
                    </Space>
                </>
            ) : null}
        >
            {memoizedSelectOptions}
        </Select>
    );
};
