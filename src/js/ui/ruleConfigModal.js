// 规则配置弹窗组件
/**
 * RuleConfigModal - 规则配置弹窗组件
 * @author AI
 */
class RuleConfigModal {
  constructor(columnMapper) {
    this.currentRule = null;
    this.columnMapper = columnMapper;
  }

  /**
   * 设置配置回调
   * @param {function} cb
   */
  setOnConfig(cb) {
    this.onConfig = cb;
  }

  // 显示筛选数据配置（内嵌模块重构）
  showFilterConfig(columns = ['A', 'B', 'C'], hasPrevious = false) {
    const panel = document.getElementById('ruleConfigPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="rule-config-panel">
        <h3>筛选数据配置</h3>
        <form class="rule-config-form">
          <div class="form-control mb-2">
            <label>数据来源</label>
            <div class="flex gap-4 mt-1">
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="original" checked class="radio radio-primary" />
                <span class="label-text ml-2">原始数据</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="previous" class="radio radio-primary" ${hasPrevious ? '' : 'disabled'} />
                <span class="label-text ml-2">上一步结果${hasPrevious ? '' : '<span style=\'color:#bbb;font-size:12px;margin-left:4px\' title=\'当前无上一步结果可用\'>(不可用)</span>'}</span>
              </label>
            </div>
          </div>
          <div class="form-control">
            <label for="filter-col">选择列</label>
            <select id="filter-col" class="select select-bordered">
              ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
          </div>
          <div class="form-control">
            <label for="filter-op">筛选条件</label>
            <select id="filter-op" class="select select-bordered">
              <option value="eq">等于</option>
              <option value="neq">不等于</option>
              <option value="gt">大于</option>
              <option value="lt">小于</option>
              <option value="contains">包含</option>
              <option value="notcontains">不包含</option>
              <option value="empty">为空</option>
              <option value="notempty">不为空</option>
            </select>
          </div>
          <div class="form-control">
            <label for="filter-value">筛选值</label>
            <input id="filter-value" type="text" class="input input-bordered" placeholder="请输入筛选值" />
            <div class="input-hint">如果条件为"为空"或"不为空"，此值可以留空</div>
          </div>
          <div class="btn-group">
            <button type="button" id="filter-apply" class="btn btn-primary">立即应用</button>
            <button type="button" id="filter-cancel" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    `;
    panel.querySelector('form').onsubmit = e => e.preventDefault();
    panel.querySelector('#filter-apply').onclick = () => {
      const col = panel.querySelector('#filter-col').value;
      const op = panel.querySelector('#filter-op').value;
      const value = panel.querySelector('#filter-value').value;
      const dataSource = panel.querySelector('input[name="data-source"]:checked').value;
      this.collectConfigData({type: 'filter', col, op, value, dataSource});
      panel.innerHTML = '';
    };
    panel.querySelector('#filter-cancel').onclick = () => {
      panel.innerHTML = '';
    };
  }

  // 显示排序数据配置（内嵌模块重构）
  showSortConfig(columns = ['A', 'B', 'C'], hasPrevious = false) {
    const panel = document.getElementById('ruleConfigPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="rule-config-panel">
        <h3>排序数据配置</h3>
        <form class="rule-config-form">
          <div class="form-control mb-2">
            <label>数据来源</label>
            <div class="flex gap-4 mt-1">
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="original" checked class="radio radio-primary" />
                <span class="label-text ml-2">原始数据</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="previous" class="radio radio-primary" ${hasPrevious ? '' : 'disabled'} />
                <span class="label-text ml-2">上一步结果${hasPrevious ? '' : '<span style=\'color:#bbb;font-size:12px;margin-left:4px\' title=\'当前无上一步结果可用\'>(不可用)</span>'}</span>
              </label>
            </div>
          </div>
          <div class="form-control">
            <label for="sort-col">选择列</label>
            <select id="sort-col" class="select select-bordered">
              ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
          </div>
          <div class="form-control">
            <label>排序方式</label>
            <div class="flex gap-4 mt-2">
              <label class="cursor-pointer label">
                <input type="radio" name="sort-order" value="asc" checked class="radio radio-primary" />
                <span class="label-text ml-2">升序</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="sort-order" value="desc" class="radio radio-primary" />
                <span class="label-text ml-2">降序</span>
              </label>
            </div>
            <div class="input-hint">升序：从小到大排列；降序：从大到小排列</div>
          </div>
          <div class="btn-group">
            <button type="button" id="sort-apply" class="btn btn-primary">立即应用</button>
            <button type="button" id="sort-cancel" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    `;
    panel.querySelector('form').onsubmit = e => e.preventDefault();
    panel.querySelector('#sort-apply').onclick = () => {
      const col = panel.querySelector('#sort-col').value;
      const order = panel.querySelector('input[name="sort-order"]:checked').value;
      const dataSource = panel.querySelector('input[name="data-source"]:checked').value;
      this.collectConfigData({type: 'sort', col, order, dataSource});
      panel.innerHTML = '';
    };
    panel.querySelector('#sort-cancel').onclick = () => {
      panel.innerHTML = '';
    };
  }

  // 显示处理列配置（重构：加法/比对）
  showProcessConfig(columns = ['A', 'B', 'C'], hasPrevious = false) {
    const panel = document.getElementById('ruleConfigPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="rule-config-panel">
        <h3>处理列配置</h3>
        <form class="rule-config-form">
          <div class="form-control mb-2">
            <label>数据来源</label>
            <div class="flex gap-4 mt-1">
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="original" checked class="radio radio-primary" />
                <span class="label-text ml-2">原始数据</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="previous" class="radio radio-primary" ${hasPrevious ? '' : 'disabled'} />
                <span class="label-text ml-2">上一步结果${hasPrevious ? '' : '<span style=\'color:#bbb;font-size:12px;margin-left:4px\' title=\'当前无上一步结果可用\'>(不可用)</span>'}</span>
              </label>
            </div>
          </div>
          <div class="form-control">
            <label>处理操作</label>
            <div class="flex gap-4 mt-2">
              <label class="cursor-pointer label">
                <input type="radio" name="process-op" value="add" checked class="radio radio-primary" />
                <span class="label-text ml-2">加法</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="process-op" value="cmp" class="radio radio-primary" />
                <span class="label-text ml-2">比对</span>
              </label>
            </div>
            <div class="input-hint">加法：对单列加数；比对：两列逐行比较</div>
          </div>
          <div class="form-control" id="process-col-area">
            <!-- 动态插入列选择和参数输入 -->
          </div>
          <div class="btn-group">
            <button type="button" id="process-apply" class="btn btn-primary">立即应用</button>
            <button type="button" id="process-cancel" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    `;
    // 列选择区渲染函数
    function renderColArea(op) {
      const area = panel.querySelector('#process-col-area');
      if (op === 'add') {
        area.innerHTML = `
          <label for="process-col">选择列</label>
          <select id="process-col" class="select select-bordered">
            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
          </select>
          <div class="input-hint" style="margin-top:8px;">将自动计算所选列所有数据之和，并显示在最后一行</div>
        `;
      } else {
        area.innerHTML = `
          <label for="process-col1">比对列1</label>
          <select id="process-col1" class="select select-bordered">
            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
          </select>
          <label for="process-col2" style="margin-top:8px;">比对列2</label>
          <select id="process-col2" class="select select-bordered">
            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
          </select>
          <label for="cmp-type" style="margin-top:8px;">比对方式</label>
          <select id="cmp-type" class="select select-bordered">
            <option value="gt">大于</option>
            <option value="eq">等于</option>
            <option value="lt">小于</option>
          </select>
          <div class="input-hint">比对方式：列1 与 列2 逐行比较</div>
        `;
      }
    }
    // 初始渲染
    renderColArea('add');
    // 监听操作类型切换
    panel.querySelectorAll('input[name="process-op"]').forEach(radio => {
      radio.onchange = e => {
        renderColArea(e.target.value);
      };
    });
    panel.querySelector('form').onsubmit = e => e.preventDefault();
    panel.querySelector('#process-apply').onclick = () => {
      const op = panel.querySelector('input[name="process-op"]:checked').value;
      const dataSource = panel.querySelector('input[name="data-source"]:checked').value;
      if (op === 'add') {
        const col = panel.querySelector('#process-col').value;
        this.collectConfigData({type: 'process', op: 'add', col, dataSource});
      } else {
        const col1 = panel.querySelector('#process-col1').value;
        const col2 = panel.querySelector('#process-col2').value;
        const cmpType = panel.querySelector('#cmp-type').value;
        if (col1 === col2) {
          alert('比对列1和比对列2不能相同！');
          return;
        }
        this.collectConfigData({type: 'process', op: 'cmp', col1, col2, cmpType, dataSource});
      }
      panel.innerHTML = '';
    };
    panel.querySelector('#process-cancel').onclick = () => {
      panel.innerHTML = '';
    };
  }

  /**
   * 显示合并表格配置（内嵌模块重构）
   */
  showMergeConfig(uploadedFiles = [], hasPrevious = false) {
    const panel = document.getElementById('ruleConfigPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="rule-config-panel">
        <h3>合并表格配置</h3>
        <form class="rule-config-form">
          <div class="form-control mb-2">
            <label>数据来源</label>
            <div class="flex gap-4 mt-1">
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="original" checked class="radio radio-primary" />
                <span class="label-text ml-2">原始数据</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="data-source" value="previous" class="radio radio-primary" ${hasPrevious ? '' : 'disabled'} />
                <span class="label-text ml-2">上一步结果${hasPrevious ? '' : '<span style=\'color:#bbb;font-size:12px;margin-left:4px\' title=\'当前无上一步结果可用\'>(不可用)</span>'}</span>
              </label>
            </div>
          </div>
          <div class="form-control">
            <label>合并类型</label>
            <div class="flex gap-4 mt-2">
              <label class="cursor-pointer label">
                <input type="radio" name="merge-type" value="files" checked class="radio radio-primary" />
                <span class="label-text ml-2">多文件合并</span>
              </label>
              <label class="cursor-pointer label">
                <input type="radio" name="merge-type" value="sheets" class="radio radio-primary" />
                <span class="label-text ml-2">多Sheet合并</span>
              </label>
            </div>
            <div class="input-hint">多文件合并：合并多个Excel/CSV文件；多Sheet合并：合并同一文件的多个工作表</div>
          </div>
          <div class="form-control mt-4">
            <label>当前已上传文件</label>
            <ul class="uploaded-file-list">
              ${uploadedFiles.length === 0 ? '<li class="text-gray-400">暂无已上传文件</li>' : uploadedFiles.map(f => `<li>${f.fileName || f.name}</li>`).join('')}
            </ul>
            <div class="input-hint text-xs text-gray-500 mt-1">如需更换文件，请到主上传区操作</div>
          </div>
          <div class="btn-group mt-6">
            <button type="button" id="merge-apply" class="btn btn-primary">立即应用</button>
            <button type="button" id="merge-cancel" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    `;
    panel.querySelector('form').onsubmit = e => e.preventDefault();
    panel.querySelector('#merge-apply').onclick = () => {
      const type = panel.querySelector('input[name="merge-type"]:checked').value;
      const dataSource = panel.querySelector('input[name="data-source"]:checked').value;
      // 只收集合并类型参数
      this.collectConfigData({ type: 'merge', mergeType: type, dataSource });
      panel.innerHTML = '';
    };
    panel.querySelector('#merge-cancel').onclick = () => {
      panel.innerHTML = '';
    };
  }

  // 收集配置数据
  collectConfigData(config) {
    if (typeof this.onConfig === 'function') {
      this.onConfig(config);
    }
  }
}

export default RuleConfigModal; 