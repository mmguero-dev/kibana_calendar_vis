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

import _ from 'lodash';
import { BaseConfig } from './base_config';
import { AXIS_SCALE_TYPE } from '../components/chart/axis/axis_scale';

export const VIS_CHART_TYPE = {
  HEATMAP_YEAR: 'heatmap_year',
  HEATMAP_MONTH: 'heatmap_month'
};

const DEFAULT_VIS_CONFIG = {
  type: VIS_CHART_TYPE.HEATMAP_YEAR,
  style: {
    margin: { top: 10, right: 3, bottom: 5, left: 3 }
  },
  alerts: [],
  categoryAxes: [],
  valueAxes: [],
  grid: {}
};

export class CalendarVisConfig extends BaseConfig {
  constructor(vis, visConfigArgs) {
    super(visConfigArgs);
    this.vis = vis;
    this.chartType = null;
    this._values = _.defaultsDeep({}, this._values, DEFAULT_VIS_CONFIG);
  }

  _updateTime() {
    /*
      * Justification for setting params changes:
      * they should be managed outside of visualization and visualization should only handle rendering
      */
    const { timeFilter } = this.vis.API;
    const {
      min: from,
      max: to
    } = timeFilter.getBounds();
    const diff = to.diff(from, 'days');
    if (diff <= 1) {
      // render a day view
    } else if (diff > 1 && diff < 32 && new Date(from).getMonth() === new Date(to).getMonth()) {
      // render a month view
      this.chartType = VIS_CHART_TYPE.HEATMAP_MONTH;
      this.set('type', this.chartType);
      this.set('categoryAxes', [{
        id: 'CategoryAxis-1',
        type: 'category',
        position: 'top',
        scale: {
          type: AXIS_SCALE_TYPE.WEEKS
        },
      }]);
    } else if (diff > 31) {
      // render a year view
      this.chartType = VIS_CHART_TYPE.HEATMAP_YEAR;
      this.set('type', this.chartType);
      this.set('categoryAxes', [{
        id: 'CategoryAxis-1',
        type: 'category',
        position: 'top',
        scale: {
          type: AXIS_SCALE_TYPE.MONTHS
        },
      }, {
        id: 'CategoryAxis-2',
        type: 'category',
        position: 'left',
        scale: {
          type: AXIS_SCALE_TYPE.WEEKS
        },
      }]);
    }
  }

  _updateGrid(extraOpts) {
    const { containerWidth } = extraOpts;
    let cellSize;
    switch (this.chartType) {
      case VIS_CHART_TYPE.HEATMAP_YEAR:
        cellSize = containerWidth * 1.5 / 100;
        if (cellSize < 15) {
          this.set('grid.cellSize', 15);
        } else if (cellSize > 20) {
          this.set('grid.cellSize', 20);
        } else {
          this.set('grid.cellSize', cellSize);
        }
        break;
      case VIS_CHART_TYPE.HEATMAP_MONTH:
        cellSize = containerWidth * 4 / 100;
        if (cellSize < 35) {
          this.set('grid.cellSize', 35);
        } else if (cellSize > 50) {
          this.set('grid.cellSize', 50);
        } else {
          this.set('grid.cellSize', cellSize);
        }
        break;
    }
  }

  update(updateStatus, extraOpts) {
    const { data, resize, time, params } = updateStatus;

    if (params) { //params updates are always executed first
      this._values = _.cloneDeep(this.vis.params);
    }

    if (data) {
      this._updateTime();
      this._updateGrid(extraOpts);
    }

    if (time) {
      this._updateTime();
    }

    if (resize) {
      this._updateGrid(extraOpts);
    }
  }
}
