import React, {useState, useEffect, useRef} from "react";
import {Input, Select} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {SwapRightOutlined} from "@ant-design/icons";
import {NumberParam, StringParam, useQueryParams, withDefault} from "use-query-params";

const { Option } = Select;
const { Group } = Input;

type QuickRangeKey =
    | "15m"
    | "1h"
    | "4h"
    | "1d"
    | "2d"
    | "3d"
    | "1w"
    | "15d"
    | "custom";

const QUICK_RANGES: { label: string; value: QuickRangeKey; milliseconds?: number }[] = [
    { label: "15m", value: "15m", milliseconds: 15 * 60 * 1000 },
    { label: "1h", value: "1h", milliseconds: 60 * 60 * 1000 },
    { label: "4h", value: "4h", milliseconds: 4 * 60 * 60 * 1000 },
    { label: "1d", value: "1d", milliseconds: 24 * 60 * 60 * 1000 },
    { label: "2d", value: "2d", milliseconds: 2 * 24 * 60 * 60 * 1000 },
    { label: "3d", value: "3d", milliseconds: 3 * 24 * 60 * 60 * 1000 },
    { label: "1w", value: "1w", milliseconds: 7 * 24 * 60 * 60 * 1000 },
    { label: "15d", value: "15d", milliseconds: 15 * 24 * 60 * 60 * 1000 },
    { label: "Custom", value: "custom" },
];

interface TasksFilterContextData {
    onTimeFilterChange(filter: {});
}

const TaskTimeFilter: React.FC<TasksFilterContextData> = (props: TasksFilterContextData) => {
    const [quickRange, setQuickRange] = useState<QuickRangeKey>("15m");
    const [timestampType, setTimestampType] = useState<string>("timestamp");

    // URL schema
    const [query, setQuery] = useQueryParams({
        timestamp_type: withDefault(StringParam, "timestamp"),
        interval_type: withDefault(StringParam, "past"),
        offset: withDefault(NumberParam, 15 * 60 * 1000),
        from: NumberParam,
        to: NumberParam,
    });

    // Canonical range state (Always valid as Dayjs)
    const [range, setRange] = useState<[Dayjs, Dayjs]>(() => {
        const now = dayjs();
        const def = QUICK_RANGES.find((r) => r.value === "15m");
        if (def?.milliseconds) {
            return [now.subtract(def.milliseconds, "milliseconds"), now];
        }
        return [now.subtract(60, "minute"), now];
    });

    // Last valid range (for revert)
    const [lastValidRange, setLastValidRange] = useState<[Dayjs, Dayjs]>(range);

    const format = "YYYY-MM-DD HH:mm:ss";

    // Text inputs for manual editing
    const [fromText, setFromText] = useState<string>(() =>
        range[0].format(format)
    );
    const [toText, setToText] = useState<string>(() =>
        range[1].format(format)
    );

    // Track if we're updating text because of a quick range (vs user typing)
    const isProgrammaticUpdate = useRef(false);

    // 🚩 NEW: track when we've finished hydrating from the URL
    const [hasHydratedFromUrl, setHasHydratedFromUrl] = useState(false);

    const parseText = (value: string): Dayjs | null => {
        const d = dayjs(value, format, true); // strict parsing
        return d.isValid() ? d : null;
    };

    // When quick range changes (except custom), compute a new range and update text
    useEffect(() => {
        if (quickRange === "custom") {
            // do not override user manual values
            return;
        }

        const now = dayjs();
        const selected = QUICK_RANGES.find((r) => r.value === quickRange);

        if (selected?.milliseconds) {
            const newFrom = now.subtract(selected.milliseconds, "milliseconds");
            const newTo = now;

            isProgrammaticUpdate.current = true;
            setRange([newFrom, newTo]);
            setLastValidRange([newFrom, newTo]);
            setFromText(newFrom.format(format));
            setToText(newTo.format(format));
        }
    }, [quickRange, format]);

    // URL → FORM on mount
    useEffect(() => {
        // timestamp_type
        setTimestampType(query.timestamp_type);

        if (query.interval_type === "between" && query.from && query.to) {
            const from = dayjs(query.from);
            const to = dayjs(query.to);

            // make sure we don't overwrite with "15m"
            setQuickRange("custom");

            setRange([from, to]);
            setLastValidRange([from, to]);
            setFromText(from.format(format));
            setToText(to.format(format));
        } else {
            // default: interval_type = "past"
            const offset = query.offset ?? 15 * 60 * 1000;

            const selected =
                QUICK_RANGES.find((r) => r.milliseconds === offset) ??
                QUICK_RANGES.find((r) => r.value === "15m")!;

            // let the quick-range effect handle range/text
            setQuickRange(selected.value);
        }

        setHasHydratedFromUrl(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run only once on mount

    // Notify parent whenever canonical range or type changes
    useEffect(() => {
        // ❌ Don't sync back to URL until we've read it once
        if (!hasHydratedFromUrl) return;
        if (!props.onTimeFilterChange) return;

        const [from, to] = range;
        const the_change: any = {
            timestamp_type: timestampType,
        };

        if (quickRange === "custom") {
            the_change["interval_type"] = "between";
            if (from && to) {
                the_change["from"] = from.unix() * 1000;
                the_change["to"] = to.unix() * 1000;
            }
        } else {
            the_change["interval_type"] = "past";
            const selected = QUICK_RANGES.find((r) => r.value === quickRange);
            the_change["offset"] = selected?.milliseconds;
            the_change["from"] = undefined;
            the_change["to"] = undefined;
        }

        setQuery(the_change, "replaceIn");
        props.onTimeFilterChange(the_change);
    }, [range, quickRange, timestampType, hasHydratedFromUrl, setQuery, props.onTimeFilterChange]);

    const handleQuickChange = (value: QuickRangeKey) => {
        setQuickRange(value);
    };

    function handleTimestampTypeChange(value: string) {
        setTimestampType(value);
    }

    // 🧠 Central logic: validate / revert / accept manual text
    const applyManualTextRange = () => {
        const from = parseText(fromText);
        const to = parseText(toText);

        // If invalid input, revert back to last valid range
        if (!from || !to || from.isAfter(to)) {
            const [validFrom, validTo] = lastValidRange;
            isProgrammaticUpdate.current = true; // avoid flipping quickRange
            setFromText(validFrom.format(format));
            setToText(validTo.format(format));
            setRange([validFrom, validTo]);
            return;
        }

        // If change came from quick range programmatic write, just sync range + lastValid
        if (isProgrammaticUpdate.current) {
            isProgrammaticUpdate.current = false;
            setRange([from, to]);
            setLastValidRange([from, to]);
            return;
        }

        // Manual valid edit → accept + store + flip to custom
        setRange([from, to]);
        setLastValidRange([from, to]);
        setQuickRange("custom");
    };

    const onFromBlur = () => {
        applyManualTextRange();
    };

    const onToBlur = () => {
        applyManualTextRange();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            applyManualTextRange();
        }
    };

    return (
        <Group compact>
            <Select
                defaultValue="timestamp"
                dropdownMatchSelectWidth
                style={{ width: 90 }}
                size="small"
                onChange={handleTimestampTypeChange as any}
            >
                <Option value="timestamp">Seen</Option>
                <Option value="sent_at">Queued</Option>
                <Option value="received_at">Received</Option>
                <Option value="started_at">Started</Option>
                <Option value="succeeded_at">Succeeded</Option>
                <Option value="failed_at">Failed</Option>
                <Option value="retried_at">Retried</Option>
                <Option value="rejected_at">Rejected</Option>
                <Option value="revoked_at">Revoked</Option>
                <Option value="eta">ETA</Option>
                <Option value="expires">Expires</Option>
            </Select>
            <Select
                options={QUICK_RANGES.map((r) => ({
                    label: r.label,
                    value: r.value,
                }))}
                dropdownMatchSelectWidth
                size="small"
                value={quickRange}
                onChange={handleQuickChange as any}
            />
            <Input
                size="small"
                style={{ maxWidth: 150 }}
                placeholder={format}
                value={fromText}
                onChange={(e) => {
                    isProgrammaticUpdate.current = false;
                    setFromText(e.target.value);
                }}
                onBlur={onFromBlur}
                onKeyDown={onKeyDown}
            />
            <Input
                size="small"
                style={{ maxWidth: 170 }}
                placeholder={format}
                value={toText}
                onChange={(e) => {
                    isProgrammaticUpdate.current = false;
                    setToText(e.target.value);
                }}
                onBlur={onToBlur}
                onKeyDown={onKeyDown}
                addonBefore={<SwapRightOutlined />}
            />
        </Group>
    );
};

export default TaskTimeFilter;