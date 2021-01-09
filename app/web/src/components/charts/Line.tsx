import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import theme from "./Themes";

export const LeekLine: React.FC<any> = (props) => {
    return (
        <ResponsiveLine
            data={props.data}
            // Key/Value Formats
            xFormat="time:%Y-%m-%d %H:%M:%S"
            yFormat=" >-.2f"
            // Key/Value Scales
            xScale={{
                type: "time",
                format: "%Y-%m-%d %H:%M:%S",
                useUTC: false,
            }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
            // Axis
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={{
                orient: 'left',
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'count',
                legendOffset: -40,
                legendPosition: 'middle'
            }}
            // Colors
            theme={theme}
            colors={{ scheme: 'set3' }}
            // Points
            pointColor={{ theme: 'background' }}
            pointSize={10}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            // Line
            lineWidth={4}
            useMesh={true}
            curve="monotoneX"
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            // Legend
            legends={[
                {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemBackground: 'rgba(0, 0, 0, .03)',
                                itemOpacity: 1
                            }
                        }
                    ]
                }
            ]}
        />
    );
};
