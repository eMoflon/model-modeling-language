import React from "react"
import "./CircularCodiconIcon.css"

export function CircularCodiconIcon(props: {
    size: number,
    iconName: string,
    iconColor: string,
    backgroundColor: string
}) {
    let {
        size,
        iconName,
        iconColor,
        backgroundColor
    } = props

    const center = size / 2;
    const radius = center;
    const iconClass = `codicon codicon-${iconName}`;
    const iconSize = `${0.75 * size}px`;

    return (
        <>
            <div
                className="svg-circicon-wrapper"
                style={{width: size, height: size}}
            >
                <svg
                    className="svg-circicon"
                    style={{width: size, height: size}}
                >
                    <circle
                        cx={center}
                        cy={center}
                        fill={backgroundColor}
                        r={radius}
                    />
                </svg>

                <div className="svg-circicon-label">
                    <i className={iconClass} style={{color: iconColor, fontSize: iconSize}}></i>
                </div>
            </div>
        </>
    )
}