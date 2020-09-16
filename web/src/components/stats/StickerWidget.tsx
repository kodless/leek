import React from 'react';
import {Tooltip} from 'antd';
import {InfoCircleOutlined} from '@ant-design/icons';

import {StickerWidgetWrapper} from './StickerWidget.style';

export default function ({bgColor, icon, number, text, tooltip}) {
    return (
        <StickerWidgetWrapper className="leekStickerWidget">
            <div className="leekIconWrapper" style={{backgroundColor: bgColor}}>
                {icon}
            </div>

            <div className="leekContentWrapper">
                <h3 className="leekStatNumber">
                    {number}
                </h3>
                <span className="leekLabel">
                    {text}
                </span>
            </div>
            <div style={{color: "#333", fontSize: "18px", padding: "7px"}}>
                <Tooltip title={tooltip}>
                    <InfoCircleOutlined/>
                </Tooltip>
            </div>
        </StickerWidgetWrapper>
    );
}
