<script>
  import { onDestroy, onMount, tick } from "svelte";
  import ApexCharts from "apexcharts";

  export let title = "";
  export let subtitle = "";
  export let type = "donut";
  export let series = [];
  export let labels = [];
  export let categories = [];
  export let height = 320;
  export let colors = ["#9d1d18", "#71110f", "#d9b6ae", "#111827", "#b45309"];

  let chart;
  let chartEl;

  $: options = buildOptions();
  $: if (chart) chart.updateOptions(options, true, true);

  onMount(async () => {
    await tick();
    chart = new ApexCharts(chartEl, options);
    chart.render();
  });

  onDestroy(() => {
    chart?.destroy();
  });

  function buildOptions() {
    const base = {
      chart: {
        type,
        height,
        toolbar: { show: false },
        fontFamily: "Roboto, Arial, sans-serif",
        foreColor: "#6b7280",
        animations: { enabled: true, speed: 450 }
      },
      colors,
      series,
      labels,
      dataLabels: { enabled: type === "donut" },
      legend: {
        position: "bottom",
        fontSize: "13px",
        markers: { radius: 8 }
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (value) => `$ ${Number(value || 0).toLocaleString("es-AR")}`
        }
      },
      stroke: { curve: "smooth", width: type === "donut" ? 0 : 3 },
      grid: {
        borderColor: "#ece7df",
        strokeDashArray: 4
      }
    };

    if (type === "donut") {
      return {
        ...base,
        plotOptions: {
          pie: {
            donut: {
              size: "72%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Total",
                  formatter: () => Number(series.reduce((sum, value) => sum + Number(value || 0), 0)).toLocaleString("es-AR")
                }
              }
            }
          }
        }
      };
    }

    return {
      ...base,
      xaxis: {
        categories,
        labels: {
          rotate: 0,
          trim: true
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (value) => `$ ${Number(value || 0).toLocaleString("es-AR")}`
        }
      },
      fill: type === "area"
        ? {
            type: "gradient",
            gradient: {
              shadeIntensity: 0.15,
              opacityFrom: 0.34,
              opacityTo: 0.02,
              stops: [0, 90, 100]
            }
          }
        : { opacity: 1 },
      plotOptions: type === "bar"
        ? {
            bar: {
              borderRadius: 7,
              columnWidth: "48%"
            }
          }
        : {}
    };
  }
</script>

<article class="chart-card modern-chart-card">
  <div class="chart-heading">
    <div>
      <h3>{title}</h3>
      {#if subtitle}<p>{subtitle}</p>{/if}
    </div>
  </div>
  <div bind:this={chartEl} class="apex-chart"></div>
</article>
