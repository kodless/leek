import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { getColors, themes } from "./Themes";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const LeekPie: React.FC<any> = (props) => {
  return (
    <ResponsivePie
      data={props.data}
      id="key"
      value="doc_count"
      // Dimensions
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      borderWidth={1}
      margin={{ top: 10, right: 10, bottom: 10, left: 120 }}
      enableRadialLabels={false}
      sliceLabelsSkipAngle={10}
      // Colors
      theme={themes[props.theme]}
      colors={getColors}
      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
      sliceLabelsTextColor="#333333"
      // Legends
      legends={[
        {
          anchor: "top-left",
          direction: "column",
          justify: false,
          translateX: -100,
          translateY: 0,
          itemWidth: 100,
          itemHeight: 20,
          itemsSpacing: 4,
          symbolSize: 16,
          itemDirection: "left-to-right",
          symbolShape: "circle",
        },
      ]}
    />
  );
};
