import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
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
    schemaActions: Array<any> = [{ type: "create", tableName: "table", columns: new LocalDataSource([{ id: "Id", type: "string" }]) }];
    dataActions: Array<any> = [];
    selectedType: TransactionType = "schema";

    codeMode = false;
    code: string;
    codeObject: any;

    baseActionDef = {
        filter: { inputClass: "hidden" },
        attr: { class: "table table-bordered table-reset" },
    };


    insertDataActionDef;
    modifyDataActionDef;
    deleteDataActionDef = Object.assign({
        columns: {
            pkval: {
                title: 'PK Value'
            },
        },
    }, this.baseActionDef);
    updateDropSchemaActionDef = Object.assign({
        columns: {
            id: {
                title: 'ID'
            },
        },
    }, this.baseActionDef);
    updateModifySchemaActionDef = Object.assign({
        columns: {
            id: {
                title: 'ID'
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
            id: {
                title: 'ID'
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

        //console.info(this.tables);
        this.insertDataActionDef =
            this.tables
                .map(_ =>
                    Object.assign({
                        name: _.Name,
                        columns: _.Headers.map(c => ({ title: c }))
                            .reduce((obj, cur) => { obj[cur.title] = cur; return obj; }, {}),
                    }, this.baseActionDef))
                .reduce((obj, cur) => { obj[cur.name] = cur; return obj; }, {})
            ;

        //console.info(this.insertDataActionDef);
        this.modifyDataActionDef = Object.assign({}, this.insertDataActionDef);
    }

    appendAction() {
        //console.info(this.schemaActions, this.dataActions, this.selectedType);
        if (this.selectedType == "data") {
            if (this.dataActions.length >= 10)
                this.alertService.showMessage("最多10个动作");
            else
                this.dataActions.push({
                    insertColumns: new LocalDataSource(),
                    modifyColumns: new LocalDataSource(),
                    deleteColumns: new LocalDataSource(),
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

    getRequestObject(type: TransactionType) {
        if (type == "schema") {
            var sa = this.schemaActions
                .map(_ => ({
                    type: _.type,
                    tableName: _.tableName,
                    columns: _.columns.data,
                }));

            return sa;
        } else {
            var da = this.dataActions
                .map(_ => ({
                    type: _.type,
                    tableName: _.tableName,
                    columns: _.columns.data,
                }));

            return da;
        }

    }

    removeAction(actions: Array<any>, idx) {
        actions.splice(idx, 1);
    }

    gotoCode() {
        //this.alertService.showDialog("转到代码模式后无法将代码模式的编辑内容转回普通编辑模式，确定？", DialogType.confirm, _ => {
            this.code = JSON.stringify(this.getRequestObject(this.selectedType));
            this.codeObject = this.getRequestObject(this.selectedType);
            this.codeMode = true;
        //});
    }

    gotoGui() {
        //this.alertService.showDialog("代码模式的编辑内容无法转回普通编辑模式，确定？", DialogType.confirm, _ => {
            this.code = JSON.stringify(this.getRequestObject(this.selectedType));
            this.codeObject = this.getRequestObject(this.selectedType);
            this.codeMode = false;
        //});
    }
}
