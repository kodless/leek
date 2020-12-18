import React from 'react';
import {ResponsiveWaffle} from '@nivo/waffle';


// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const LeekWaffle: React.FC<any> = (props) => {
    return (
        props.total > 0 ? <ResponsiveWaffle
            data={props.data}
            total={props.total}
            rows={18}
            columns={18}
            margin={{top: 10, right: 10, bottom: 10, left: 120}}
            // @ts-ignore
            colors={{scheme: 'set3'}}
            borderColor={{from: 'color', modifiers: [['darker', 0.3]]}}
            animate={true}
            motionStiffness={90}
            motionDamping={11}
            legends={[
                {
                    anchor: 'top-left',
                    direction: 'column',
                    justify: false,
                    translateX: -100,
                    translateY: 0,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemsSpacing: 4,
                    symbolSize: 16,
                    itemDirection: 'left-to-right',
                    itemTextColor: '#777',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemTextColor: '#000',
                                itemBackground: '#f7fafb'
                            }
                        }
                    ]
                }
            ]}
        /> : <></>
    );
};
