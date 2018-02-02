﻿import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block, SchemaAction, DataAction, SchemaColumnDefinition, SchemaActionEnum, DataActionEnum, ColumnData } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity, DialogType } from '../../services/alert.service';
import { AlertConfiguration } from '../../models/alert.model';
import { NotificationService } from '../../services/notification.service';
import { DataSource } from 'ng2-smart-table/lib/data-source/data-source';
import { LocalDataSource } from 'ng2-smart-table';

export type TransactionType = "schema" | "data";

@Component({
    selector: 'database-create',
    templateUrl: './create.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseCreatePage implements OnInit {
    db: ChainDb;

    tables: Array<any>;
    schemaActions: Array<any> = [];
    dataActions: Array<any> = [];
    //schemaActions: Array<any> = [{ type: "create", tableName: "table", columns: new LocalDataSource([{ name: "Id", type: "string" }]) }];
    //dataActions: Array<any> = [{ type: "insert", tableName: "Donation", columns: { Id: "hello" }, }];
    selectedType: TransactionType = "schema";

    codeMode = false;
    code: string;

    baseActionDef = {
        filter: { inputClass: "hidden" },
        attr: { class: "table table-bordered table-reset" },
    };


    dataActionColumns = {};
    updateDropSchemaActionDef = Object.assign({
        columns: {
            name: {
                title: 'Name'
            },
        },
    }, this.baseActionDef);
    updateModifySchemaActionDef = Object.assign({
        columns: {
            name: {
                title: 'Name'
            },
            type: {
                title: 'Type',
                editor: { type: 'list', config: { list: [{ value: "string", title: "string" }, { value: "number", title: "number" }] } }
            },
            ispk: {
                title: 'IsPK',
                editor: { type: 'checkbox' }
            },
        },
    }, this.baseActionDef);
    createSchemaActionDef = Object.assign({
        columns: {
            name: {
                title: 'Name'
            },
            type: {
                title: 'Type',
                editor: { type: 'list', config: { list: [{ value: "string", title: "string" }, { value: "number", title: "number" }] } }
            },
            ispk: {
                title: 'IsPK',
                editor: { type: 'checkbox' }
            },
        },
    }, this.baseActionDef);

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
    ) { }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let dbid = params.get('dbid');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getChainDbTableNames(this.db)
                            .subscribe(_ => {
                                this.tables = _.Tables;
                                this.prepareData();
                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

    prepareData() {
        this.dataActionColumns =
            this.tables
                .reduce((obj, cur) => { obj[cur.Name] = cur.Headers; return obj; }, {})
            ;
    }

    appendAction() {
        if (this.selectedType == "data") {
            if (this.dataActions.length >= 10)
                this.alertService.showMessage("最多10个动作");
            else
                this.dataActions.push({
                    columns: {},
                });
        }
        else {
            if (this.schemaActions.length >= 10)
                this.alertService.showMessage("最多10个动作");
            else
                this.schemaActions.push({
                    columns: new LocalDataSource(),
                    modifyColumns: new LocalDataSource(),
                    dropColumns: new LocalDataSource()
                });
        }
    }

    submit() {
        var sa = this.getRequestObject("schema");
        var da = this.getRequestObject("data");
        console.info("schema", sa, this.schemaActions);
        console.info("data", da, this.dataActions);
    }


    getRequestObject(type: TransactionType): Array<SchemaAction> | Array<DataAction> {
        if (type == "schema") {
            let getSchemaType = (type: string): SchemaActionEnum =>
                type == "create" ? "CreateSchemaAction"
                    : type == "modify" ? "ModifySchemaAction"
                        : "DropSchemaAction";

            let mapSchemaColumnDefinition = (arr): Array<SchemaColumnDefinition> => {
                if (!arr) return null;
                let ret = arr.map(c => (<SchemaColumnDefinition>{ Type: c.type, Name: c.name, PrimaryKey: c.ispk }));
                if (ret.length == 0) return null;
                return ret;
            };

            let mapStringArray = (arr): Array<string> => {
                if (!arr) return null;
                let ret = arr.map(c => c.name);
                if (ret.length == 0) return null;
                return ret;
            };
            var sa = this.schemaActions
                .map<SchemaAction>(_ => ({
                    Type: getSchemaType(_.type),
                    Data: {
                        Name: _.tableName,
                        Columns: mapSchemaColumnDefinition(_.columns && _.columns.data),
                        AddOrModifyColumns: mapSchemaColumnDefinition(_.modifyColumns && _.modifyColumns.data),
                        DropColumns: mapStringArray(_.dropColumns && _.dropColumns.data),
                    }
                }));

            return sa;
        } else {
            let getDataType = (type: string): DataActionEnum =>
                type == "insert" ? "InsertDataAction"
                    : type == "update" ? "UpdateDataAction"
                        : "DeleteDataAction";

            let mapColumnData = (obj): Array<ColumnData> => {
                if (!obj) return null;
                let ret = Object.keys(obj).map(_ => (<ColumnData>{ Name: _, Data: obj[_] }));
                if (ret.length == 0) return null;
                return ret;
            };

            var da = this.dataActions
                .map<DataAction>(_ => ({
                    Type: getDataType(_.type),
                    Data: {
                        SchemaName: _.tableName,
                        Columns: mapColumnData(_.columns),
                        PrimaryKeyValue: _.pkval,
                    }
                }));

            return da;
        }

    }

    removeAction(actions: Array<any>, idx) {
        actions.splice(idx, 1);
    }

    duplicateAction(actions: Array<any>, idx) {
        console.log(actions, actions.slice(idx, idx + 1)[0]);
        let action = Object.assign({}, actions.slice(idx, idx + 1)[0]);
        actions.splice(actions.length, 0, action);
        console.log(actions);
    }


    gotoCode() {
        this.alertService.showDialog("转到代码模式后无法将代码模式的编辑内容转回普通编辑模式，确定？", DialogType.confirm, _ => {
            this.generateCode();
            this.codeMode = true;
        });
    }

    gotoGui() {
        this.alertService.showDialog("代码模式的编辑内容无法转回普通编辑模式，确定？", DialogType.confirm, _ => {
            this.codeMode = false;
        });
    }

    generateCode() {
        let replacer = (key, value) => {
            if (value === null) return undefined;
            if (value == "") return undefined;
            return value;
        }
        this.code = JSON.stringify(this.getRequestObject(this.selectedType), replacer, 2);
    }
}
