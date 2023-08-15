import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  type ChartData,
  type TooltipItem,
  ArcElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
type Props = {
  labels: string[];
  // datasetLabel: string;
  // datasetData: number[];
  // datasetLabel1: string;
  // datasetData1: number[];
  datasets: {
    label: string;
    data: number[];
    notFill?: boolean;
    borderColor?: string;
    bgTopGradientColor?: string;
    bgBottomGradientColor?: string;
    pointBorderColor?: string;
    pointBackgroundColor?: string;
    cubicInterpolationMode?: "monotone" | "default";
  }[];
  xTickCallback: (val: string | number) => string;
  tooltipLabelCallback: (tooltipItem: TooltipItem<"line">) => string;
  yTickCallback: (value: string | number) => string;
};
interface ChartContext {
  ctx: CanvasRenderingContext2D;
}
const LineChart = (props: Props) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
    ArcElement
  );
  const stepSizeArray = () => {
    const arr: number[] = [];
    props.datasets.forEach((ds) => {
      ds.data.forEach((d) => {
        arr.push(d);
      });
    });

    return arr;
  };

  const maxVal = Math.max(...stepSizeArray());

  const stepSize = Math.ceil(maxVal / 5);
  const data: ChartData<"line", number[], string> = {
    labels: props.labels,
    datasets: props.datasets.map((dataset) => {
      return {
        fill: !dataset.notFill,
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor ?? "#db2777",
        backgroundColor: ({ chart: { ctx } }: { chart: ChartContext }) => {
          const bg = ctx.createLinearGradient(0, 150, 0, 600);
          bg.addColorStop(
            0,
            dataset.bgTopGradientColor ?? "rgba(236, 72, 153,0.15)"
          );
          bg.addColorStop(
            0.18,
            dataset.bgBottomGradientColor ?? "rgba(236, 72, 153,0)"
          );
          bg.addColorStop(1, "transparent");

          return bg;
        },
        pointBorderColor: dataset.pointBorderColor ?? "#db2777",

        pointBackgroundColor: dataset.pointBackgroundColor ?? "#db2777",

        cubicInterpolationMode: dataset.cubicInterpolationMode ?? "monotone",
      };
    }),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 5,
        borderWidth: 2,
      },
    },
    scales: {
      y: {
        ticks: {
          stepSize,
          callback: props.yTickCallback,
        },
        beginAtZero: true,
        grace: 2,
      },
      x: {
        ticks: { callback: props.xTickCallback },
      },
      // x1: {
      //   ticks: {
      //     // For a category axis, the val is the index so the lookup via getLabelForValue is needed
      //     callback: (val: string | number) => {
      //       // Hide every 2nd tick label
      //       return lastWeekLearning
      //         ? lastWeekLearning[val as number]?.date?.toLocaleString("en-US", {
      //             day: "numeric",
      //             month: "short",
      //           })
      //         : "";
      //     },
      //   },
      // },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: props.tooltipLabelCallback,
        },
      },
      legend: {
        display: false,
      },
    },
  };
  return <Line data={data} options={options} />;
};

export default LineChart;
