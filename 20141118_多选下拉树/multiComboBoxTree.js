/**
 * @package
 * @author    MoYuQi(zhe.moyuqi[at]gmail.com)
 * @link    https://github.com/moyuqi
 * @version 0.1
 * @build    2014-11-18
 * @license     MIT License
 */
if ('function' !== typeof RegExp.escape) {
    RegExp.escape = function (s) {
        if ('string' !== typeof s) {
            return s
        }
        return s.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }
}

Ext.form.MultiComboBoxTree = Ext.extend(Ext.form.ComboBox, {
    isMulti: true,//是否多选
    checkField: 'checked',
    displayField: "TEXT",
    valueField: "VALUE",
    parentField: "PARENTID",
    dataRoot: "root",
    separator: ",",
    rootText: "主菜单",
    rootValue: -1,
    rootVisible: false,
    triggerAction: "all",
    //lazyInit      : false,
    /** @selectNodeModel
     * all : 所有结点都可选中
     * exceptRoot ： 除根结点，其它结点都可选
     * folder : 只有目录（非叶子和非根结点）可选
     * leaf ：只有叶子结点可选
     */
    selectNodeModel: 'all',
    mode: "local",
    editable: false,
    emptyText: '请选择...',
    callback: null,
    expandAllChildNodes: false,         //false展开以及节点，true展开所有节点
    /**
     * 初始化
     */
    constructor: function () {
        Ext.form.MultiComboBoxTree.superclass.constructor.apply(this, arguments);
        this.maxHeight = this.maxHeight || this.height;
        if (!this.store) {
            this.store = new Ext.data.JsonStore({
                autoLoad: true,
                url: this.url,
                root: this.dataRoot,
                fields: [
                    {name: this.displayField},
                    {name: this.valueField},
                    {name: this.parentField}
                ]
            });
        }
        this.store.on({
            scope: this,
            load: function (store) {
                this.getValue() && this.setValue(this.getValue());
                if (this.tree) {
                    this.loadData();
                }
            }
        })
    },
    /**
     *
     */
    initList: function () {
        if (!this.list) {
            var cls = 'x-combo-list';

            this.list = new Ext.Layer({
                parentEl: this.getListParent(),
                shadow: this.shadow,
                cls: [cls, this.listClass].join(' '),
                constrain: false
            });

            var lw = this.listWidth || Math.max(this.wrap.getWidth(), this.minListWidth);
            this.list.setSize(lw, 0);
            this.assetHeight = 0;
            if (this.syncFont !== false) {
                this.list.setStyle('font-size', this.el.getStyle('font-size'));
            }

            this.innerList = this.list.createChild({cls: cls + '-inner'});
            this.innerList.setWidth(lw - this.list.getFrameWidth('lr'));

            if (!this.tree) {
                this.tree = new Ext.tree.TreePanel({
                    root: new Ext.tree.TreeNode({
                        text: this.rootText,
                        id: this.rootValue,
                        expanded: true
                    }),
                    selectNodeModel: this.selectNodeModel,
                    border: false,
                    rootVisible: this.rootVisible,
                    autoHeight: true,
                    renderTo: this.innerList
                });

                this.tree.on({
                    scope: this,
                    click: this.onTextClick,
                    checkchange: this.onCheckChange,
                    expandnode: function (nodep) {
                        this.tree.suspendEvents();
                        var values = this.getCheckedValue().split(this.separator);
                        nodep.cascade(function (node) {
                            node.getUI().toggleCheck(false);
                            node.attributes.checked = false;
                            for (var i = 0; i < values.length; i++) {
                                if ("" + node.attributes[this.valueField] === values[i]) {
                                    node.getUI().toggleCheck(true);
                                    node.attributes.checked = true;
                                    break;
                                }
                            }
                        }, this);
                        this.tree.resumeEvents();
                        this.restrictHeight();
                    },
                    // 取消双击事件
                    beforedblclick: function () {
                        return false;
                    }
                });
                if (this.store.getCount() > 0) {
                    this.loadData();
                }
            }

            if (this.resizable) {
                this.resizer = new Ext.Resizable(this.list, {
                    pinned: true,
                    handles: 'se'
                });
                this.mon(this.resizer, 'resize', function (r, w, h) {
                    this.maxHeight = h - this.handleHeight - this.list.getFrameWidth('tb') - this.assetHeight;
                    this.listWidth = w;
                    this.innerList.setWidth(w - this.list.getFrameWidth('lr'));
                    this.restrictHeight();
                }, this);

                this[this.pageSize ? 'footer' : 'innerList'].setStyle('margin-bottom', this.handleHeight + 'px');
            }
        }
    },
    /**
     * 选中事件
     * @param node
     * @param checked
     * @param selectForm
     */
    onSelectChange: function (node, checked, selectForm) {
        var isRoot = (node == this.tree.getRootNode());
        var selModel = this.selectNodeModel;
        var isLeaf = node.isLeaf();
        if (isRoot && selModel != 'all') {
            return;
        } else if (selModel == 'folder' && isLeaf) {
            return;
        } else if (selModel == 'leaf' && !isLeaf) {
            return;
        }

        if (this.isMulti) {
            var r = this.findRecord(this.valueField, node.attributes[this.valueField]);
            if (r) {
                if (checked == null || typeof(checked) == 'object') {
                    checked = r["data"][this.checkField] ? !r["data"][this.checkField] : true;
                }
                r["data"][this.checkField] = checked;
            }
            this.setValue(this.getCheckedValue());
            if (selectForm.toLowerCase() == "click") {
                node.getUI().toggleCheck(checked);
            }
        } else {
            this.setValue(node.attributes[this.valueField]);// 设置option值
            this.collapse();// 隐藏option列表
        }

        if (this.callback) {
            this.callback.call(this, node);
        }
    },
    /**
     * text单击事件
     * @param node
     * @param checked
     */
    onTextClick: function (node, e) {
        this.onSelectChange(node, null, "click");
    },
    /**
     * checkbox单击事件
     * @param node
     * @param checked
     */
    onCheckChange: function (node, checked) {
        this.onSelectChange(node, checked, "checkChange");
    },

    expand: function () {
        if (this.isExpanded() || !this.hasFocus) {
            return;
        }
        this.assetHeight = 0;
        if (this.bufferSize) {
            this.doResize(this.bufferSize);
            delete this.bufferSize;
        }
        this.restrictHeight();
        this.list.alignTo.apply(this.list, [this.el].concat(this.listAlign));
        this.list.setZIndex(this.getZIndex());
        this.list.show();
        if (Ext.isGecko2) {
            this.innerList.setOverflow('auto');
        }
        this.mon(Ext.getDoc(), {
            scope: this,
            mousewheel: this.collapseIf,
            mousedown: this.collapseIf
        });
        this.fireEvent('expand', this);
    },

    loadData: function () {
        var data = [];
        this.store.each(function (item, index) {
            /**此处进行数据复制*/
            data.push(Ext.apply({}, item.data));
        }, this);
        var treedata = this.formatData(data);
        this.tree.getRootNode().appendChild(treedata);
        this.tree.getRootNode().expandChildNodes(this.expandAllChildNodes);
    },

    formatData: function (data) {
        var len = data.length;
        var r = [], b = {},
            p = this.parentField,
            v = this.valueField,
            d = this.displayField,
            s = this.rootValue;
        for (var i = 0; i < len; i++) {
            var item = data[i];
            item["text"] = item[d];
            item["id"] = item[v];
            item.leaf = true;
            this.formatDataChecked(item, false);//item.checked = false;
            if (item[p] == s) {
                r.push(item);
                continue;
            }
            if (!b["_" + item[p]]) {
                for (var a = 0; a < len; a++) {
                    var t = data[a];
                    if (item[p] == t[v]) {
                        if (t[p] == s && !b["_" + t[v]]) {
                            b["_" + t[v]] = t;
                            b["_" + t[v]].leaf = false;
                        }
                        if (!t["children"])t["children"] = [];
                        t.leaf = false;
                        t["children"].push(item);
                        item.leaf = true;
                        this.formatDataChecked(item, false);//item.checked = false;
                        break;
                    }
                }
                continue;
            }
            if (!b["_" + item[p]]["children"]) {
                b["_" + item[p]]["children"] = [];
                b["_" + item[p]].leaf = false;
            }
            item.leaf = true;
            this.formatDataChecked(item, false);//item.checked = false;
            b["_" + item[p]]["children"].push(item);
            continue;
        }
        return r;
    },

    formatDataChecked: function (item, checked) {
        if (this.isMulti) {
            item.checked = checked || false;
        }
    },

    clearValue: function () {
        this.value = '';
        this.setRawValue(this.value);
        var root = this.tree.getRootNode();
        root.cascade(function (node) {
            if (node.attributes.checked) {
                node.getUI().toggleCheck(false);
                node.attributes.checked = false;
            }
        }, this)
        if (this.hiddenField) {
            this.hiddenField.value = ''
        }
        this.applyEmptyText()
    },

    getCheckedDisplay: function () {
        var re = new RegExp(this.separator, "g");
        return this.getCheckedValue(this.displayField).replace(re, this.separator + ' ')
    },
    getCheckedValue: function (field) {
        field = field || this.valueField;
        var c = [];
        var snapshot = this.store.snapshot || this.store.data;
        snapshot.each(function (r) {
            if (r.get(this.checkField)) {
                c.push(r.get(field))
            }
        }, this);
        return c.join(this.separator)
    },

    setValue: function (v) {
        if (typeof v != 'undefined') {
            v = '' + v;
            this.value = v;
            this.store.clearFilter();
            this.store.each(function (r) {
                var checked = !(!v.match('(^|' + this.separator + ')' + RegExp.escape(r.get(this.valueField)) + '(' + this.separator + '|$)'));
                r.set(this.checkField, checked);
                //if(checked)console.log(r);
            }, this);
            this.setRawValue(this.store.getCount() > 0 ? this.getCheckedDisplay() : this.value);
            if (this.hiddenField) {
                this.hiddenField.value = this.value
            }
            if (this.el) {
                this.el.removeClass(this.emptyClass)
            }
        } else {
            this.clearValue()
        }
    },

    getValue: function () {
        return typeof this.value != 'undefined' ? this.value : '';
    },

    onSelect: Ext.emptyFn,
    select: Ext.emptyFn,
    onViewOver: Ext.emptyFn,
    onViewClick: Ext.emptyFn,
    assertValue: Ext.emptyFn,
    beforeBlur: Ext.emptyFn
});
