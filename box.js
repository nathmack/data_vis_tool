function renderTable(data, nodeId, columns = 1) {
  const table = d3.select(`#${nodeId}`).append('table')

  const rows = Math.ceil(data.length / columns)

  for (let i = 0; i < rows; i++) {
    const row = table.append('tr')

    for (let j = 0; j < columns; j++) {
      const index = (i * columns) + j
      if (!data[index]) return

      row.append('td')
        .html(data[index][0])
      row.append('td')
        .html(data[index][1])
    }
  }

  d3.select(`#${nodeId}`).append('hr')
}

// Box and whiskers chart, with line chart above
function renderBoxChart({ data, title, chartHeight = 320, chartWidth = 1300, boxHeight = 35, constrain = false, table = false, nodeId }) {
  const chartData = data.sort((a, b) => a - b)
  const margin = { top: 10, right: 10, bottom: 20, left: 40 }
  const height = chartHeight - margin.top - margin.bottom
  const width = chartWidth - margin.left - margin.right
  const boxBottom = height - 10
  const boxTop = height - (10 + boxHeight)

  d3.select(`#${nodeId}`)
    .append('h2')
      .html(title)

  const svg = d3.select(`#${nodeId}`)
    .append('svg')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
    .append('g')
      .attr('class', 'box-area')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

  let q1 = d3.quantile(chartData, 0.25)
  let q2 = d3.median(chartData)
  let q3 = d3.quantile(chartData, 0.75)
  let interquartileRange = q3 - q1
  let upperFence = q3 + (interquartileRange * 1.5)
  let lowerFence = q1 - (interquartileRange * 1.5) > d3.min(chartData) ? q3 - (interquartileRange * 1.5) : d3.min(chartData)

  let filteredData = chartData.filter(datum => datum > lowerFence && datum < upperFence)
  const plottedDataPoints = constrain ? filteredData : chartData

  if (constrain) {
    q1 = d3.quantile(filteredData, 0.25)
    q2 = d3.median(filteredData)
    q3 = d3.quantile(filteredData, 0.75)
    interquartileRange = q3 - q1
    upperFence = q3 + (interquartileRange * 1.5)
    lowerFence = q1 - (interquartileRange * 1.5) > d3.min(filteredData) ? q3 - (interquartileRange * 1.5) : d3.min(filteredData)
    filteredData = chartData.filter(datum => datum > lowerFence && datum < upperFence)
  }

  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)

  const x = d3.scaleLinear()
    .domain(d3.extent(plottedDataPoints))
    .range([0, width])

  const uniqueValues = new Set(plottedDataPoints).size
  const bins = uniqueValues < 20 ? uniqueValues : 20

  const histogram = d3.histogram()
    .domain([d3.min(plottedDataPoints), d3.max(plottedDataPoints) + 1])
    .thresholds(bins)
    (plottedDataPoints)

  const y = d3.scaleLinear()
    .domain([0, d3.max(histogram.map(d => d.length))])
    .range([height - (boxHeight + 20), 0])

  const histogramLine = d3
    .line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveBasis)

  svg
    .append('path')
      .attr('d', d =>
        histogramLine([
          { x: 0, y: y.range()[0] },
          ...histogram.map(d => ({ x: x(d.x0), y: y(d.length) })),
        ])
      )
      .attr('fill', 'none')
      .attr('stroke', '#3498db')
      .attr('stroke-width', 1)


  // data points
  svg
    .selectAll('circle')
    .data(plottedDataPoints)
    .enter()
    .append('circle')
      .attr('cx', d => x(d))
      .attr('cy', boxTop + (boxHeight / 2))
      .attr('r', 5)
      .attr('stroke', '#1abc9c')
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('opacity', 0.40)

  // box
  svg
    .append('path')
    .attr("d", line([
      { x: x(q1), y: boxTop },
      { x: x(q3), y: boxTop },
      { x: x(q3), y: boxBottom },
      { x: x(q1), y: boxBottom },
      { x: x(q1), y: boxTop },
    ]))
    .attr("stroke", "#8e44ad")
    .attr("stroke-width", 2)
    .attr("fill", "none")

  svg
    .append('path')
    .attr("d", line([{ x: x(q2), y: boxTop }, { x: x(q2), y: boxBottom }]))
    .attr("stroke", "#8e44ad")
    .attr("stroke-width", 2)
    .attr("fill", "none")


  // whiskers
  const whisker = d3.line()
    .x(d => x(d.x))
    .y(d => boxTop + (boxHeight / 2))

  svg
    .append('path')
    .attr("d", whisker([{ x: q1 }, { x: q1 < filteredData[0] ? q1 : filteredData[0] }]))
    .attr("stroke", "#8e44ad")
    .attr("stroke-width", 2)
    .attr("fill", "none")

  svg
    .append('path')
    .attr("d", whisker([{ x: q3 }, { x: filteredData.slice(-1) }]))
    .attr("stroke", "#8e44ad")
    .attr("stroke-width", 2)
    .attr("fill", "none")

  // fences
  svg
    .append('path')
    .attr("d", line([
      { x: x(upperFence) - 5, y: boxBottom - (boxHeight * 0.2) },
      { x: x(upperFence), y: boxBottom - (boxHeight * 0.2) },
      { x: x(upperFence), y: boxTop + (boxHeight * 0.2) },
      { x: x(upperFence) - 5, y: boxTop + (boxHeight * 0.2) },
    ]))
    .attr("stroke", "#8e44ad")
    .attr("stroke-width", 2)
    .attr("fill", "none")

  if (lowerFence < q1) {
    svg
      .append('path')
      .attr("d", line([
        { x: x(lowerFence) + 5, y: boxBottom - (boxHeight * 0.2) },
        { x: x(lowerFence), y: boxBottom - (boxHeight * 0.2) },
        { x: x(lowerFence), y: boxTop + (boxHeight * 0.2) },
        { x: x(lowerFence) + 5, y: boxTop + (boxHeight * 0.2) },
      ]))
      .attr("stroke", "#8e44ad")
      .attr("stroke-width", 2)
      .attr("fill", "none")
  }

  // Axis
  svg
    .append('g')
    .attr('class', 'axis-dark')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0, ${height})`)

  svg
    .append('g')
    .attr('class', 'axis-dark')
    .call(d3.axisLeft(y).ticks(5))

  // table
  if (table) {
    renderTable([
      ['lowerFence:', lowerFence],
      ['Q1:', q1],
      ['Median:', q2],
      ['Q3:', q3],
      ['Upper Fence:', upperFence],
    ], nodeId)
  }
}
