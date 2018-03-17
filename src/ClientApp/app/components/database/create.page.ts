import { Component, OnInit, Input, isDevMode, ElementRef, ViewChild } from '@angular/core';
import { ChainDb, Block, SchemaAction, DataAction, SchemaColumnDefinition, SchemaActionEnum, DataActionEnum, ColumnData, LockTarget, LockTargetEnum, SchemaColumnType, LockPermissionEnum } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity, DialogType } from '../../services/alert.service';
import { AlertConfiguration } from '../../models/alert.model';
import { NotificationService } from '../../services/notification.service';
import { DataSource } from 'ng2-smart-table/lib/data-source/data-source';
import { LocalDataSource } from 'ng2-smart-table';
import { CryptographyService } from '../../services/cryptography.service';
import { PrivateKeyService } from '../../services/private-key.service';
import { AppTranslationService } from '../../services/app-translation.service';
import { DatabaseCreatePageFunction } from './create.page.function';
import { KeyConfiguration } from '../../models/cryptography.model';

export type TransactionType = "schema" | "data" | "lock";
export type SchemaActionCreationTypeEnum = "create" | "modify" | "drop";
export type SchemaActionCreationType = {
    type: SchemaActionCreationTypeEnum,
    tableName: string,
    pkval?: string
    columns?: LocalDataSource,
    modifyColumns?: LocalDataSource,
    dropColumns?: LocalDataSource,
};
export type DataActionCreationTypeEnum = "insert" | "update" | "delete";
export type DataActionColumnCreationType = { [Id: string]: string };
export type DataActionCreationType = {
    type: DataActionCreationTypeEnum,
    tableName: string,
    pkval?: string
    columns?: DataActionColumnCreationType,
};
export type LockTargetCreationTypeEnum = "none" | "database" | "schema" | "row" | "cell" | "column";
export type LockTargetCreationType = {
    type: LockTargetCreationTypeEnum,
    permissions: Array<LockPermissionEnum>,
    tableName: string,
    pkval?: string
    col?: string
};
export type PermissionCheckBoxType = {
    value: LockPermissionEnum,
    name: string,
    desc: string,
};

@Component({
    selector: 'database-create',
    templateUrl: './create.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseCreatePage implements OnInit {
    db: ChainDb;

    tables: Array<any>;
    loaded = false;
    enableCodeMode = true;
    schemaActions: Array<SchemaActionCreationType> = [];
    dataActions: Array<DataActionCreationType> = [];
    lockTargets: Array<LockTargetCreationType> = [];
    //schemaActions: Array<any> = [{ type: "create", tableName: "table", columns: new LocalDataSource([{ name: "Id", type: "string" }]) }];
    //dataActions: Array<any> = [{ type: "insert", tableName: "Donation", columns: { Id: "hello" }, }];
    selectedType: TransactionType = "schema";

    codeMode = false;
    code: string;
    highlightColumn: string;
    selectedPrivateKey = "import";
    inputPrivateKey: string;
    lockScripts: string;
    keyList: Array<KeyConfiguration>;
    permissionList: Array<PermissionCheckBoxType>;
    enableUnlockScripts = false;
    selectedUnlockKey: string;

    @ViewChild('lockScriptsTextBox') lockScriptsTextBox: ElementRef;

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

    translations: {
        dataActionExceedsMessage?: string,
        schemaActionExceedsMessage?: string,
        lockTargetExceedsMessage?: string,
        lackPrivateKeyTitle?: string,
        lackPrivateKeyContent?: string,
        successSendTitle?: string,
        successSendContent?: string,
        errorSendTitle?: string,
        errorSendContent?: string,
        unknownTransactionTypeTitle?: string,
        unknownTransactionTypeContent?: string,
        gotoCodeConfirmation?: string,
        gotoGuiConfirmation?: string,
        exampleOverwrittenConfirmation?: string,
        parseCodeExceptionMessage?: string,
        forbidSubmitInCodeModeMessage?: string,
    } = {};
    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
        private cryptoService: CryptographyService,
        private privateKeyService: PrivateKeyService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.dataActionExceedsMessage = gT("db.create.notification.DataActionExceedsMessage");
        this.translations.schemaActionExceedsMessage = gT("db.create.notification.SchemaActionExceedsMessage");
        this.translations.lockTargetExceedsMessage = gT("db.create.notification.LockTargetExceedsMessage");
        this.translations.lackPrivateKeyTitle = gT("db.create.notification.LackPrivateKeyTitle");
        this.translations.lackPrivateKeyContent = gT("db.create.notification.LackPrivateKeyContent");
        this.translations.successSendTitle = gT("db.create.notification.SuccessSendTitle");
        this.translations.successSendContent = gT("db.create.notification.SuccessSendContent");
        this.translations.errorSendTitle = gT("db.create.notification.ErrorSendTitle");
        this.translations.errorSendContent = gT("db.create.notification.ErrorSendContent");
        this.translations.unknownTransactionTypeTitle = gT("db.create.notification.UnknownTransactionTypeTitle");
        this.translations.unknownTransactionTypeContent = gT("db.create.notification.UnknownTransactionTypeContent");
        this.translations.gotoCodeConfirmation = gT("db.create.notification.GotoCodeConfirmation");
        this.translations.gotoGuiConfirmation = gT("db.create.notification.GotoGuiConfirmation");
        this.translations.exampleOverwrittenConfirmation = gT("db.create.notification.ExampleOverwrittenConfirmation");
        this.translations.parseCodeExceptionMessage = gT("db.create.notification.ParseCodeExceptionMessage");
        this.translations.forbidSubmitInCodeModeMessage = gT("db.create.notification.ForbidSubmitInCodeModeMessage");

        this.permissionList = [
            { value: "None", name: gT("db.create.lock.permission.None"), desc: gT("db.create.lock.permissionDesc.None") },
            { value: "ReadOnly", name: gT("db.create.lock.permission.ReadOnly"), desc: gT("db.create.lock.permissionDesc.ReadOnly") },
            { value: "Insert", name: gT("db.create.lock.permission.Insert"), desc: gT("db.create.lock.permissionDesc.Insert") },
            { value: "Update", name: gT("db.create.lock.permission.Update"), desc: gT("db.create.lock.permissionDesc.Update") },
            { value: "Delete", name: gT("db.create.lock.permission.Delete"), desc: gT("db.create.lock.permissionDesc.Delete") },
            { value: "AlterLock", name: gT("db.create.lock.permission.AlterLock"), desc: gT("db.create.lock.permissionDesc.AlterLock") },
            { value: "AlterSchema", name: gT("db.create.lock.permission.AlterSchema"), desc: gT("db.create.lock.permissionDesc.AlterSchema") },
        ];
    }

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
        this.route.queryParamMap
            .subscribe((params: ParamMap) => {
                let type = params.get('type') as TransactionType;// || this.selectedType;
                let action = params.get('action');
                let target = params.get('target');
                let name = params.get('name');
                let pkval = params.get('pkval');
                let col = params.get('col');
                this.highlightColumn = col;
                this.selectedType = type;
                this.appendAction({ type: type == "lock" ? target : action, tableName: name, pkval: pkval, col: col });
                if (type == "schema" && action == "modify" && col) {
                    this.schemaActions[0].dropColumns = new LocalDataSource([{ name: col }]);
                }
            });
        this.privateKeyService.getKeyList()
            .subscribe(_ => this.keyList = _);
    }

    prepareData() {
        this.dataActionColumns =
            this.tables
                .reduce((obj, cur) => { obj[cur.Name] = cur.Headers; return obj; }, {})
            ;
        this.loaded = true;
    }

    appendAction(defs) {
        if (this.selectedType == "data") {
            if (this.dataActions.length >= 10)
                this.alertService.showMessage(this.translations.dataActionExceedsMessage);
            else
                this.dataActions.push(Object.assign({
                    columns: {},
                }, defs || {}));
        }
        else if (this.selectedType == "schema") {
            if (this.schemaActions.length >= 10)
                this.alertService.showMessage(this.translations.schemaActionExceedsMessage);
            else
                this.schemaActions.push(Object.assign({
                    columns: new LocalDataSource(),
                    modifyColumns: new LocalDataSource(),
                    dropColumns: new LocalDataSource()
                }, defs || {}));
        } else {
            if (this.lockTargets.length >= 10)
                this.alertService.showMessage(this.translations.lockTargetExceedsMessage);
            else
                this.lockTargets.push(Object.assign({
                    permissions: []
                }, defs || {}));
        }
    }

    getPrivateKey() {
        let privKey;
        if (this.selectedPrivateKey == "import") {
            privKey = this.inputPrivateKey;
        }
        else {
            privKey = this.privateKeyService.getPrivateKeyDirectly(this.selectedPrivateKey);
        }

        return privKey;
    }

    submit() {
        if (this.codeMode) {
            this.alertService.showDialog(this.translations.forbidSubmitInCodeModeMessage, DialogType.alert);
            return;
        }

        let privKey = this.getPrivateKey();
        if (!privKey) {
            this.alertService.showMessage(this.translations.lackPrivateKeyTitle, this.translations.lackPrivateKeyContent, MessageSeverity.error);
            return;
        }

        let pubKey = this.cryptoService.getPublicKey(privKey);
        let address = pubKey.toAddress();

        let unlockPrivateKey = null;
        if (this.enableUnlockScripts) {
            unlockPrivateKey = this.privateKeyService.getPrivateKeyDirectly(this.selectedUnlockKey);
        }

        let rpcCallback = (_) => {
            this.alertService.showMessage(this.translations.successSendTitle, this.translations.successSendContent, MessageSeverity.success);
            this.router.navigate(['database', this.db.id]);
        };
        let errCallback = (_) => {
            this.alertService.showMessage(this.translations.errorSendTitle, this.translations.errorSendContent, MessageSeverity.error);
        };

        if (this.selectedType == "data") {
            var da = DatabaseCreatePageFunction.getDataActions(this.dataActions);
            this.dataService.createDataTransaction(this.db, privKey, unlockPrivateKey, da)
                .subscribe(rpcCallback, errCallback);
        } else if (this.selectedType == "schema") {
            var sa = DatabaseCreatePageFunction.getSchemaActions(this.schemaActions);
            this.dataService.createSchemaTransaction(this.db, privKey, unlockPrivateKey, sa)
                .subscribe(rpcCallback, errCallback);
        } else if (this.selectedType == "lock") {
            var lt = DatabaseCreatePageFunction.getLockTargets(this.lockTargets);
            this.dataService.createLockTransaction(this.db, privKey, unlockPrivateKey, this.lockScripts, lt)
                .subscribe(rpcCallback, errCallback);
        } else {
            this.alertService.showMessage(this.translations.unknownTransactionTypeTitle, this.translations.unknownTransactionTypeContent, MessageSeverity.warn);
        }
    }

    removeAction(actions: Array<any>, idx) {
        actions.splice(idx, 1);
    }

    duplicateAction(actions: Array<any>, idx) {
        let action = Object.assign({}, actions.slice(idx, idx + 1)[0]);
        if (this.selectedType == "data") {
            this.appendAction(Object.assign({}, action, { columns: Array.from(action.columns) }));
        }
        else if (this.selectedType == "schema") {
            this.appendAction(Object.assign({}, action, {
                columns: new LocalDataSource(Array.from(action.columns.data)),
                modifyColumns: new LocalDataSource(Array.from(action.modifyColumns.data)),
                dropColumns: new LocalDataSource(Array.from(action.dropColumns.data)),
            }));
        } else {
            this.appendAction(action);
        }
    }

    gotoCode() {
        this.alertService.showDialog(this.translations.gotoCodeConfirmation, DialogType.confirm, _ => {
            this.generateCode();
            this.codeMode = true;
        });
    }

    gotoGui() {
        if (!this.code) {
            this.codeMode = false;
            return;
        }

        this.alertService.showDialog(this.translations.gotoGuiConfirmation, DialogType.confirm, _ => {
            if (this.parseCode()) {
                this.codeMode = false;
            }
        });
    }

    generateCode() {
        let replacer = (key, value) => (value === null || value == "") ? undefined : value;

        let getRequestObject = () => {
            if (this.selectedType == "schema") {
                return { actions: DatabaseCreatePageFunction.getSchemaActions(this.schemaActions) };
            } else if (this.selectedType == "data") {
                return { actions: DatabaseCreatePageFunction.getDataActions(this.dataActions) };
            } else if (this.selectedType == "lock") {
                return { lockScripts: this.lockScripts, targets: DatabaseCreatePageFunction.getLockTargets(this.lockTargets) };
            } else {
                return null;
            }
        };

        let data = getRequestObject();
        let fullobj = data ? Object.assign({ type: this.selectedType }, data) : {};
        this.code = JSON.stringify(fullobj, replacer, 2);
    }

    parseCode() {
        try {
            let obj = JSON.parse(this.code);
            let type = obj.type as TransactionType;
            this.selectedType = type;
            if (type == "schema") {
                this.schemaActions = DatabaseCreatePageFunction.getSchemaActionCreationTypes(obj.actions as SchemaAction[]);
            } else if (type == "data") {
                this.dataActions = DatabaseCreatePageFunction.getDataActionCreationTypes(obj.actions as DataAction[]);
            } else if (type == "lock") {
                this.lockTargets = DatabaseCreatePageFunction.getLockTargetCreationTypes(obj.targets as LockTarget[]);
                this.lockScripts = obj.lockScripts;
            } else {
                //nothing happened
            }
            return true;
        } catch (error) {
            this.alertService.showDialog(this.translations.parseCodeExceptionMessage + error, DialogType.alert);
            return false;
        }
    }

    onPrivateKeyChange(value) {
        console.log(value);
        if (value == "import") {

        }
    }

    example(type: 'single' | 'multiple') {
        let change = () => {
            if (type == 'single') {
                this.lockScripts = "<USER_ADDRESS>\nOC_CheckSignature";
            } else if (type == 'multiple') {
                this.lockScripts = "<USER1_ADDRESS>\n<USER2_ADDRESS>\n...\n<USERn_ADDRESS>\n<n>\nOC_CheckOneOfMultiSignature";
            }
        }

        if (this.lockScripts && this.lockScripts.length > 0) {
            this.alertService.showDialog(this.translations.exampleOverwrittenConfirmation, DialogType.confirm, _ => { change(); });
        }
        else {
            change();
        }
    }

    insert(pubKey: string) {
        let area = this.lockScriptsTextBox.nativeElement;
        let value = pubKey;
        if (area.selectionStart || area.selectionStart == '0') {
            var startPos = area.selectionStart;
            var endPos = area.selectionEnd;
            area.value = area.value.substring(0, startPos)
                + value
                + area.value.substring(endPos, area.value.length);
            area.selectionStart = startPos + value.length;
            area.selectionEnd = startPos + value.length;
        } else {
            area.value += value;
        }
        this.lockScripts = area.value;
    }

    onPermissionChange(target: LockTargetCreationType, name: LockPermissionEnum, event) {
        target.permissions = target.permissions || [];
        let uncheckAllExcept = (except: LockPermissionEnum) => {
            target.permissions = [except];
        }

        let uncheck = (item: LockPermissionEnum) => {
            let idx = target.permissions.findIndex(_ => _ == item);
            if (idx > -1) target.permissions.splice(idx, 1);
        };

        let uncheckNoneAndReadOnly = () => {
            uncheck("None");
            uncheck("ReadOnly");
        };

        if (event) {
            target.permissions = [...target.permissions, name];
        } else {
            uncheck(name);
        }

        if (name == "None" && this.permissionList.find(_ => _.value == "None")) {
            uncheckAllExcept("None");
        } else if (name == "ReadOnly" && this.permissionList.find(_ => _.value == "ReadOnly")) {
            uncheckAllExcept("ReadOnly");
        } else if (name == "Insert" && this.permissionList.find(_ => _.value == "Insert")) {
            uncheckNoneAndReadOnly();
        } else if (name == "Update" && this.permissionList.find(_ => _.value == "Update")) {
            uncheckNoneAndReadOnly();
        } else if (name == "Delete" && this.permissionList.find(_ => _.value == "Delete")) {
            uncheckNoneAndReadOnly();
        } else if (name == "AlterLock" && this.permissionList.find(_ => _.value == "AlterLock")) {
            uncheckNoneAndReadOnly();
        } else if (name == "AlterSchema" && this.permissionList.find(_ => _.value == "AlterSchema")) {
            uncheckNoneAndReadOnly();
        }
    }
}