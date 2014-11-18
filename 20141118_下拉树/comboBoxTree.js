/**
 * @package
 * @author  MoYuQi(zhe.moyuqi[at]gmail.com)
 * @link    https://github.com/moyuqi
 * @version 1.0
 * @build   2014-11-18
 * @license MIT License
 */

/**
 * 下拉树ComboBoxTree
 *
 * @extend Ext.form.ComboBox
 * @xtype 'combotree'
 *
 */

Ext.form.ComboBoxTree = Ext.extend(Ext.form.ComboBox, {

    /**
     * 作为隐藏域的name属性
     */
    passName: 'id',

    /**
     * 是否允许非叶子结点的单击事件
     *
     * @default false
     */
    allowUnLeafClick: true,

    /**
     * 树显示的高度，默认为180
     */
    treeHeight: 180,

    store: new Ext.data.SimpleStore({
        fields: [],
        data: [
            []
        ]
    }),

    // Default
    editable: false, // 禁止手写及联想功能
    mode: 'local',
    triggerAction: 'all',
    // maxHeight : 500,

    selectedClass: '',
    onSelect: Ext.emptyFn,
    emptyText: '请选择...',

    /**
     * 清空值
     */
    clearValue: function () {
        if (this.passField) {
            this.passField.value = '';
        }

        this.setRawValue('');
    },

    /**
     * 设置传值
     *
     * @param passvalue
     */
    setPassValue: function (passvalue) {
        if (this.passField)
            this.passField.value = passvalue;
    },

    /**
     * 下拉树被点击事件添加一处理方法
     *
     * @param node
     */
    onTreeSelected: function (node) {

    },

    getValue: function () {
        return this.passField.value;
    },
    /**
     * 树的单击事件处理
     *
     * @param node,event
     */
    treeClk: function (node, e) {
        if (!node.isLeaf() && !this.allowUnLeafClick) {
            e.stopEvent();// 非叶子节点则不触发
            return;
        }

        this.isLeaf.value = node.isLeaf();

        this.setValue(node.text);// 设置option值
        this.collapse();// 隐藏option列表

        if (this.passField)
            this.passField.value = node.id;// 以树的节点ID传递

        // 选中树节点后的触发事件
        this.fireEvent('treeselected', node);

    },

    /**
     * 初始化 Init
     */
    initComponent: function () {
        Ext.form.ComboBoxTree.superclass.initComponent.call(this);
        this.tree.autoScroll = true;
        this.tree.height = this.treeHeight;
        this.tree.containerScroll = false;
        this.tplId = Ext.id();
        // overflow:auto"
        this.tpl = '<div id="' + this.tplId + '" style="height:' + this.treeHeight + 'px";overflow:hidden;"></div>';

        /**
         * 添加treeselected事件， 选中树节点会激发这个事 件， 参数为树的节点
         */
        this.addEvents('treeselected');
        // this.on('treeselected',this.onTreeSelected,this);
    },

    /**
     * 事件监听器 Listener
     */
    listeners: {
        'expand': {
            fn: function () {
                if (!this.tree.rendered && this.tplId) {

                    this.tree.render(this.tplId);

                }
                this.tree.show();
            },
            single: true
        },

        'render': {
            fn: function () {

                this.tree.on('click', this.treeClk, this);

                /**
                 * 创建隐藏输入域<input /> 并将其dom传给passField
                 */
                if (this.passName) {
                    this.passField = this.getEl().insertSibling({
                        tag: 'input',
                        type: 'hidden',
                        name: this.passName,
                        id: this.passName
                    }, 'before', true)
                }

                this.passField.value = this.passValue !== undefined ? this.passValue : (this.value !== undefined ? this.value : '');

                this.el.dom.removeAttribute('name');

                this.isLeaf = this.getEl().insertSibling({
                    tag: 'input',
                    type: 'hidden',
                    name: 'isleaf',
                    id: 'isleaf'
                }, 'before', true)

                // this.isLeaf.value = this.isleaf;
            }
        },
        'beforedestroy': {
            fn: function (cmp) {
                this.purgeListeners();
                this.tree.purgeListeners();
            }
        }
    }

});

/**
 * 将ComboBoxTree注册为Ext的组件,以便使用 Ext的延迟渲染机制，xtype:'combotree'
 */
Ext.reg('combotree', Ext.form.ComboBoxTree);

