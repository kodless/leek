import React from 'react';
import { ResponsiveBar } from '@nivo/bar';


// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const LeekBar: React.FC<any> = (props) => {
    return (
        <ResponsiveBar
            data={props.data}
            keys={props.keys}
            indexBy="id"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.8}
            layout="horizontal"
            valueScale={{ type: 'linear' }}
            colors={{ scheme: props.color || 'blue_green' }}
            defs={[
                {
                    id: 'dots',
                    type: 'patternDots',
                    background: 'inherit',
                    color: '#38bcb2',
                    size: 4,
                    padding: 1,
                    stagger: true
                },
                {
                    id: 'lines',
                    type: 'patternLines',
                    background: 'inherit',
                    color: '#eed312',
                    rotation: -45,
                    lineWidth: 6,
                    spacing: 10
                }
            ]}
            fill={[
                {
                    match: {
                        id: 'SUCCEEDED'
                    },
                    id: 'dots'
                },
                {
                    match: {
                        id: 'FAILED'
                    },
                    id: 'lines'
                }
            ]}
            borderColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
            borderRadius={5}
            axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: '', legendOffset: 36 }}
            axisRight={null}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'count(states)',
                legendPosition: 'middle',
                legendOffset: 32
            }}
            axisLeft={null}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="black"
            legends={[
                {
                    dataFrom: 'keys',
                    anchor: 'top-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemOpacity: 1
                            }
                        }
                    ]
                }
            ]}
            enableGridX={true}
            enableGridY={false}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
        />
    );
};
