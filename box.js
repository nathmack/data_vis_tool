// Box and whiskers chart, with line chart above
function renderBoxChart({ data, title, chartHeight = 320, chartWidth = 1300, boxHeight = 35, constrain = false, table = false, nodeId }) {
  const chartData = data.sort((a, b) => a - b)
  const margin = { top: 10, right: 10, bottom: 50, left: 30 }
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

  const q1 = d3.quantile(chartData, 0.25)
  const q2 = d3.median(chartData)
  const q3 = d3.quantile(chartData, 0.75)
  const interquartileRange = q3 - q1
  const upperFence = q3 + (interquartileRange * 1.5)
  const lowerFence = q1 - (interquartileRange * 1.5) > d3.min(chartData) ? q3 - (interquartileRange * 1.5) : d3.min(chartData)

  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)

  const filteredData = chartData.filter(datum => datum > lowerFence && datum < upperFence)
  const plottedDataPoints = constrain ? filteredData : chartData

  const x = d3.scaleLinear()
    .domain(d3.extent(plottedDataPoints))
    .range([0, width])

  const histogram = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(20))
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
          ...histogram.map(d => ({ x: x(d.x0 + (d.x1 - d.x0)), y: y(d.length) })),
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
    const table = d3.select(`#${nodeId}`)
      .append('table')

    const row1 = table.append('tr')
      row1.append('td')
        .html('Lower Fence:')
      row1.append('td')
        .html(lowerFence)

    const row2 = table.append('tr')
      row2.append('td')
        .html('Q1:')
      row2.append('td')
        .html(q1)

    const row3 = table.append('tr')
      row3.append('td')
        .html('Q2:')
      row3.append('td')
        .html(q2)

    const row4 = table.append('tr')
      row4.append('td')
        .html('Q3:')
      row4.append('td')
        .html(q3)

    const row5 = table.append('tr')
      row5.append('td')
        .html('Upper Fence:')
      row5.append('td')
        .html(upperFence)
  }
}
