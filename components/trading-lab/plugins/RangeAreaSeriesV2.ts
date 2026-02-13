import {
    CustomSeriesPricePlotValues,
    ICustomSeriesPaneView,
    ICustomSeriesPaneRenderer,
    PaneRendererCustomData,
    Time,
    WhitespaceData,
} from 'lightweight-charts';

// Data structure
export type RangeAreaData = {
    time: Time;
    upper: number;
    lower: number;
    color: string;
} & WhitespaceData;

class RangeAreaPaneRenderer implements ICustomSeriesPaneRenderer {
    _data: PaneRendererCustomData<Time, RangeAreaData> | null = null;
    _options: any = null;

    draw(target: any, priceConverter: any, isHovered: boolean, hitTestData?: any): void {
        console.log('RangeAreaSeriesV2 draw target:', target);
        console.log('RangeAreaSeriesV2 target keys:', Object.keys(target || {}));

        let ctx = target as CanvasRenderingContext2D;
        // In LWC v5, target might be a BitmapCoordinatesRenderingScope object or CanvasRenderingTarget2D
        if (target.context) {
            ctx = target.context;
        } else if (target._context) {
            // Internal property access for LWC v5.1+
            ctx = target._context;
        }

        if (typeof ctx.save !== 'function') {
            console.error('ctx.save is not a function. ctx:', ctx);
            return;
        }

        ctx.save();
        ctx.beginPath();

        const data = this._data?.bars;
        // Defensive check for data availability
        if (!data || data.length === 0 || !this._data?.visibleRange) {
            ctx.restore();
            return;
        }

        // Draw polygons
        for (let i = 0; i < data.length; i++) {
            const bar = data[i];
            const original = bar.originalData as RangeAreaData;

            // Defensive check for current point
            if (!original || original.upper === undefined || original.lower === undefined || !original.color) continue;

            // Draw connection to next point if available
            if (i < data.length - 1) {
                const nextBar = data[i + 1];
                const nextOriginal = nextBar.originalData as RangeAreaData;

                // Defensive check for next point
                if (!nextOriginal || nextOriginal.upper === undefined || nextOriginal.lower === undefined) continue;

                // Coordinates
                const x1 = bar.x;
                const x2 = nextBar.x;

                // Price conversion
                const y1Upper = priceConverter(original.upper);
                const y1Lower = priceConverter(original.lower);
                const y2Upper = priceConverter(nextOriginal.upper);
                const y2Lower = priceConverter(nextOriginal.lower);

                // Render
                ctx.fillStyle = original.color;
                ctx.beginPath();
                ctx.moveTo(x1, y1Upper);
                ctx.lineTo(x2, y2Upper);
                ctx.lineTo(x2, y2Lower);
                ctx.lineTo(x1, y1Lower);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

export class RangeAreaSeries implements ICustomSeriesPaneView<Time, RangeAreaData, any> {
    _renderer: RangeAreaPaneRenderer;

    constructor() {
        this._renderer = new RangeAreaPaneRenderer();
    }

    priceValueBuilder(plotRow: any): CustomSeriesPricePlotValues {
        const data = plotRow.originalData;
        // Strict null checks
        if (!data || data.upper === undefined || data.lower === undefined) {
            return [NaN, NaN, NaN];
        }
        return [data.upper, data.lower, data.lower];
    }

    isWhitespace(data: any): data is WhitespaceData<Time> {
        // Return true if data is missing properties
        return !data || (data as Partial<RangeAreaData>).upper === undefined;
    }

    renderer(): ICustomSeriesPaneRenderer {
        return this._renderer;
    }

    update(
        data: PaneRendererCustomData<Time, RangeAreaData>,
        options: any
    ): void {
        this._renderer._data = data;
        this._renderer._options = options;
    }

    defaultOptions() {
        return {};
    }
}
