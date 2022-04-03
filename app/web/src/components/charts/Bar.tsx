import React from "react";
import { ResponsiveBar } from "@nivo/bar";
import { getColors, themes } from "./Themes";

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
      // Dimensions
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.8}
      layout="horizontal"
      valueScale={{ type: "linear" }}
      borderRadius={5}
      // Colors
      theme={themes[props.theme]}
      colors={props.color ? { scheme: props.color } : getColors}
      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      // Axis
      axisRight={null}
      axisLeft={null}
      axisTop={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "",
        legendOffset: 36,
      }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Executions - States",
        legendPosition: "middle",
        legendOffset: 32,
      }}
      // Labels
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor="black"
      // Legends
      legends={[
        {
          dataFrom: "keys",
          anchor: "top-right",
          direction: "column",
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          itemDirection: "left-to-right",
          itemOpacity: 0.85,
          symbolSize: 20,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      // Grid
      enableGridX={true}
      enableGridY={false}
      // Animation
      animate={false}
      motionStiffness={90}
      motionDamping={15}
    />
  );
};
