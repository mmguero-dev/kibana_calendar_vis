/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';
import { GridConfig } from './grid_config';
import { VIS_CHART_TYPE } from '../../../lib';
import { getMonthInterval, getTimeFormat } from '../../../utils';
import './chart_grid.less';

export class ChartGrid extends React.Component {
  constructor(props) {
    super(props);
    const { gridConfig } = this.props;
    this.gridConfig = new GridConfig(gridConfig);
    this.chartGrid = React.createRef();
  }

  componentDidMount() {
    this._render(this.props.vislibData);
  }

  render() {
    return (
      <svg id="all-days" ref={this.chartGrid} />
    );
  }

  async _render(vislibData) {

    const [cellSize, xOffset, yOffset] = this.gridConfig.get(['cellSize', 'xOffset', 'yOffset']);
    const { series } = vislibData;

    const wrapper = {
      year: moment(series[0].values[0].x).format('YYYY'),
      aggs: series[0].values,
      cellSize: cellSize,
      xOffset: xOffset,
      yOffset: yOffset
    };

    this._drawGrid(this.chartGrid.current, wrapper);
    this.props.renderComplete();
  }

  componentWillUnmount() {
    d3.select(this.chartGrid.current).remove();
    this.chartGrid = null;
  }

  _getMonthInterval(values) {
    const startDate = _.head(values).x;
    const endDate = _.last(values).x;
    return getMonthInterval(startDate, endDate);
  }

  _getMonth(values) {
    return new Date(_.head(values).x).getMonth();
  }

  _drawGrid(svg, { year, aggs, cellSize, xOffset, yOffset }) {
    const { type } = this.props;

    if(type === VIS_CHART_TYPE.HEATMAP_YEAR) {
      const [startMonth, endMonth] = this._getMonthInterval(aggs);
      const startFullDate = new Date(parseInt(year), startMonth - 1, 1);
      const endFullDate = new Date(parseInt(year), endMonth, 1);
      const startWeek = moment(startFullDate).week() % 52;

      d3.select(svg)
        .selectAll('.day')
        .data(d3.time.days(startFullDate, endFullDate))
        .enter().append('g').append('rect')
        .attr('id', (d) => {
          return 'day_' + moment(d).format(getTimeFormat());
        })
        .classed('day', true)
        .attr('data-month', (d) => `${moment(d).month() + 1}`)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', (d) => {
          return (moment(d).month() - startMonth + 1) * 1.5 * cellSize +
            xOffset * 2 + ((moment(d).week() - startWeek) % 52 * cellSize);
        })
        .attr('y', (d) => {
          return yOffset * 3 + (moment(d).weekday() * cellSize);
        })
        .attr('rx', cellSize * 1 / 10)
        .attr('ry', cellSize * 1 / 10);
    } else if (type === VIS_CHART_TYPE.HEATMAP_MONTH) {
      const month = this._getMonth(aggs);
      const startDate = new Date(parseInt(year), month, 1);
      const endDate = new Date(parseInt(year), month + 1, 1);

      d3.select(svg)
        .selectAll('.day')
        .data(d3.time.days(startDate, endDate))
        .enter().append('g').append('rect')
        .attr('id', (d) => {
          return 'day_' + moment(d).format(getTimeFormat());
        })
        .classed('day', true)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', (d) => {
          return xOffset * 2 + (moment(d).weekday() * cellSize);
        })
        .attr('y', (d) => {
          return yOffset * 3 + ((moment(d).week() - moment(startDate).week()) * cellSize);
        })
        .attr('rx', cellSize * 1 / 10)
        .attr('ry', cellSize * 1 / 10);
    }
  }

}
