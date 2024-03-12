import React from "react"
import "./CircularProgressIndicator.css";

// Based on: https://blog.logrocket.com/build-svg-circular-progress-component-react-hooks/

export function CircularSuccessIndicator(props: {
    size?: number | undefined;
    progress?: number | undefined;
    trackWidth?: number | undefined;
    trackColor?: string | undefined;
    indicatorWidth?: number | undefined;
    indicatorColor?: string | undefined;
    indicatorCap?: "round" | "inherit" | "butt" | "square" | undefined;
    showLabel?: boolean | undefined;
    label?: string | undefined;
    labelColor?: string | undefined;
    spinnerMode?: boolean | undefined;
    spinnerSpeed?: number | undefined
}) {
    let {
        size = 150,
        progress = 0,
        trackWidth = 10,
        trackColor = `#ddd`,
        indicatorWidth = 10,
        indicatorColor = `#07c`,
        indicatorCap = `round`,
        showLabel = true,
        label = `Loading...`,
        labelColor = `#333`,
        spinnerMode = false,
        spinnerSpeed = 1
    } = props

    let hideLabel = (size < 100 || !showLabel || spinnerMode)

    const center = size / 2,
        radius = center - (trackWidth > indicatorWidth ? trackWidth : indicatorWidth),
        dashArray = 2 * Math.PI * radius,
        dashOffset = dashArray * ((100 - progress) / 100)

    return (
        <>
            <div
                className="svg-pi-wrapper"
                style={{width: size, height: size}}
            >
                <svg
                    className="svg-pi"
                    style={{width: size, height: size}}
                >
                    <circle
                        className="svg-pi-track"
                        cx={center}
                        cy={center}
                        fill="transparent"
                        r={radius}
                        stroke={trackColor}
                        strokeWidth={trackWidth}
                    />
                    <circle
                        className={`svg-pi-indicator ${
                            spinnerMode ? "svg-pi-indicator--spinner" : ""
                        }`}
                        style={{animationDuration: (spinnerSpeed * 1000).toString()}}
                        cx={center}
                        cy={center}
                        fill="transparent"
                        r={radius}
                        stroke={indicatorColor}
                        strokeWidth={indicatorWidth}
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap={indicatorCap}
                    />
                </svg>

                {!hideLabel && (
                    <div
                        className="svg-pi-label"
                        style={{color: labelColor}}
                    >
                        {label.length == 0 && (
                            <span className="svg-pi-label__loading">
                                {label}
                            </span>)}

                        {!spinnerMode && (
                            <span className="svg-pi-label__progress">
                            {`${
                                progress > 100 ? 100 : progress
                            }%`}
                          </span>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}